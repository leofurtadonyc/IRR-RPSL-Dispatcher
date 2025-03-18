#!/usr/bin/env python3
"""
A dispatching tool for IRR that sends an RPSL object via the HTTP/HTTPS API,
with an auditing feature that logs each successful operation.

Usage:
    python irr_rpsl_submit.py [options] <file>

Options:
    -s, --server     IRR server hostname (default depends on --instance)
    -p, --port       IRR server port (default depends on --instance)
    --db-type        Target IRR database type: RADB or ALTDB (default: ALTDB)
    --instance       Select the target IRR instance:
                       "irrd"   - your own IRRd instance (defaults to 127.0.0.1; HTTP API on port 8080)
                       "altdb"  - ALTDB (defaults to whois.altdb.net:43)
                       "radb"   - RADB (defaults to whois.radb.net:43)
                       "tc"     - TC IRR (defaults to bgp.net.br:80)
    --https          Use HTTPS instead of HTTP for the API connection.
    -o, --override   Override password if required
"""

import argparse
import ipaddress
import json
import os
import sys
import requests
import socket
import string
from datetime import datetime

# -----------------------------------------------------------
# Utility functions
# -----------------------------------------------------------

def sanitize_nic_handle(handle):
    """
    Converts a NIC handle to a valid format:
    - If it contains spaces, they are replaced with dashes.
    - Removes any characters that are not alphanumeric or a dash.
    - Converts the result to uppercase.
    If the handle appears already valid (no spaces and contains a dash), it returns the uppercase value.
    """
    if " " not in handle and "-" in handle:
        return handle.upper()
    else:
        new_handle = handle.replace(" ", "-")
        allowed = set(string.ascii_letters + string.digits + "-")
        new_handle = "".join(ch for ch in new_handle if ch in allowed)
        return new_handle.upper()

# -----------------------------------------------------------
# TXT File Processing
# -----------------------------------------------------------
def process_txt_file(txt_filename):
    """
    Reads and processes a human-friendly TXT file.
    The file should have header lines declaring:
      - "action:" (required)
      - Optional "password:" and "multiple_routes:".
    The rest of the file is treated as the RPSL object text.
    Also sanitizes the "admin-c:" and "tech-c:" fields.
    
    Returns:
      (json_dict, object_type, identifier)
    where json_dict is the generated JSON representation,
    object_type is the type (e.g. "route", "route6", "aut-num", etc.),
    and identifier is the key value from the first RPSL line.
    """
    with open(txt_filename, "r") as f:
        lines = f.readlines()

    # Strip trailing whitespace from each line.
    lines = [line.rstrip() for line in lines]

    # Remove empty lines and lines starting with "#" (comments).
    non_comment_lines = [line for line in lines if line.strip() and not line.strip().startswith("#")]
    if not non_comment_lines:
        raise Exception("No non-comment content found in file.")

    # Initialize header variables.
    action = None
    password = None
    multiple_routes = False

    # Process header lines (look for "action:", "password:" and "multiple_routes:")
    header_keys = {"action", "password", "multiple_routes"}
    content_start = 0
    for i, line in enumerate(non_comment_lines):
        parts = line.split(":", 1)
        if len(parts) == 2:
            key = parts[0].strip().lower()
            if key in header_keys:
                if key == "action":
                    action = parts[1].strip()
                elif key == "password":
                    password = parts[1].strip()
                elif key == "multiple_routes":
                    value = parts[1].strip().lower()
                    multiple_routes = (value == "true")
                continue  # Process next header line.
        content_start = i  # First non-header line.
        break

    # The remaining lines form the RPSL object text.
    rpsl_text_lines = non_comment_lines[content_start:]
    if not rpsl_text_lines:
        raise Exception("No RPSL content found after header.")

    # Sanitize "admin-c:" and "tech-c:" fields.
    processed_lines = []
    for line in rpsl_text_lines:
        lower_line = line.lower()
        if lower_line.startswith("admin-c:"):
            parts = line.split(":", 1)
            if len(parts) == 2:
                processed_lines.append(f"{parts[0]}: {sanitize_nic_handle(parts[1].strip())}")
            else:
                processed_lines.append(line)
        elif lower_line.startswith("tech-c:"):
            parts = line.split(":", 1)
            if len(parts) == 2:
                processed_lines.append(f"{parts[0]}: {sanitize_nic_handle(parts[1].strip())}")
            else:
                processed_lines.append(line)
        else:
            processed_lines.append(line)
    
    rpsl_text = "\n".join(processed_lines).strip()

    # Derive object type and identifier from the first non-empty RPSL line.
    rpsl_non_empty = [line for line in rpsl_text.splitlines() if line.strip()]
    if not rpsl_non_empty:
        raise Exception("No RPSL lines found after processing.")
    first_rpsl_line = rpsl_non_empty[0].strip()
    if ":" not in first_rpsl_line:
        raise Exception("The first RPSL line is not in the expected 'attribute: value' format.")
    attr, value = first_rpsl_line.split(":", 1)
    object_type = attr.strip().lower()
    identifier = value.strip()

    # Build the JSON dictionary.
    json_dict = {
        "object_type": object_type,
        "action": action.lower() if action else "",
        "data": {
            "object_text": rpsl_text,
            "identifier": identifier,
            "passwords": [password] if password else []
        },
        "status": "pending"
    }
    # Store the multiple_routes flag at top level (it won't be sent to the API)
    json_dict["multiple_routes"] = multiple_routes

    return json_dict, object_type, identifier

# -----------------------------------------------------------
# Route Subobject Generation
# -----------------------------------------------------------
def generate_route_subobjects(rpsl_text, object_type):
    """
    Generates subobjects for route or route6 objects based on the "multiple_routes" flag.
    It always includes the original object, then creates subdivisions:
      - For IPv4 ("route"): from (prefix+1) up to /24.
      - For IPv6 ("route6"): from (prefix+1) up to /36.
    Raises an error if a route6 object's prefix is longer than /36.
    
    Returns:
      A list of RPSL object texts.
    """
    lines = rpsl_text.splitlines()
    new_objects = []
    # Set the keyword based on object type.
    keyword = "route6:" if object_type == "route6" else "route:"
    # Locate the line that starts with the keyword.
    route_line = None
    for line in lines:
        if line.lower().startswith(keyword):
            route_line = line
            break
    if route_line is None:
        raise Exception(f"No {keyword} line found in RPSL text.")
    parts = route_line.split(":", 1)
    if len(parts) != 2:
        raise Exception("Invalid route line format.")
    route_val = parts[1].strip()
    try:
        if object_type == "route6":
            network = ipaddress.IPv6Network(route_val, strict=False)
            max_prefix = 36
        else:
            network = ipaddress.IPv4Network(route_val, strict=False)
            max_prefix = 24
    except Exception as e:
        raise Exception(f"Error parsing route value '{route_val}': {e}")

    # For route6, ensure the prefix isn't longer than /36.
    if object_type == "route6" and network.prefixlen > max_prefix:
        raise Exception(f"multiple_routes not allowed for {object_type} prefixes longer than /{max_prefix}.")

    # Always include the original object.
    new_objects.append(rpsl_text)
    
    # Generate subdivisions only if the current prefix is less than the maximum.
    if network.prefixlen < max_prefix:
        for new_plen in range(network.prefixlen + 1, max_prefix + 1):
            for subnet in network.subnets(new_prefix=new_plen):
                new_lines = []
                for line in lines:
                    if line.lower().startswith(keyword):
                        new_lines.append(f"{keyword:<12} {subnet}")
                    else:
                        new_lines.append(line)
                new_objects.append("\n".join(new_lines))
    return new_objects

# -----------------------------------------------------------
# JSON File Saving
# -----------------------------------------------------------
def save_json_object(json_data, object_type, identifier):
    """
    Saves the JSON data into a file within the "objects/" folder.
    The filename is based on the object type and identifier.
    """
    if not os.path.exists("objects"):
        os.makedirs("objects")
    safe_identifier = "".join(c if c.isalnum() or c in ('-', '_') else '_' for c in identifier)
    filename = os.path.join("objects", f"{object_type}_{safe_identifier}.json")
    with open(filename, "w") as f:
        json.dump(json_data, f, indent=4)
    return filename

# -----------------------------------------------------------
# API Submission
# -----------------------------------------------------------
def submit_rpsl_change(api_url, objects_list, passwords, action=None):
    """
    Submits one or more RPSL object changes to the IRRd HTTP/HTTPS API.
    Uses POST for most actions and DELETE if action is "delete".
    
    Returns:
      The parsed JSON response if successful, or an error dictionary.
    """
    payload = {
        "objects": [{"object_text": obj} for obj in objects_list],
        "passwords": passwords
    }
    if action and action.lower() == "delete":
        method = requests.delete
    else:
        method = requests.post

    try:
        response = method(api_url, json=payload)
        response.raise_for_status()
        try:
            return response.json()
        except json.JSONDecodeError:
            # Return a clear message if response isn't valid JSON.
            return {"error": "Response is not valid JSON", "response": response.text}
    except requests.RequestException as e:
        resp_text = ""
        if hasattr(e, 'response') and e.response is not None:
            resp_text = e.response.text
        return {"error": str(e), "response": resp_text or "No response"}

# -----------------------------------------------------------
# Auditing: Write Audit Log
# -----------------------------------------------------------
def write_audit_log(username, host_ip, operation, json_filename):
    """
    Writes an audit log file in the "logs/" folder.
    The log entry contains:
      - Timestamp (MM-DD-YYYY HH:MM)
      - Username
      - Host IP address
      - Operation performed (add, modify, delete)
      - The JSON filename used for the operation
    """
    if not os.path.exists("logs"):
        os.makedirs("logs")
    timestamp = datetime.now().strftime("%m-%d-%Y %H:%M")
    log_entry = (
        f"Timestamp: {timestamp}\n"
        f"Username: {username}\n"
        f"Host IP: {host_ip}\n"
        f"Operation: {operation}\n"
        f"JSON File: {json_filename}\n"
        "----------------------------------------\n"
    )
    safe_timestamp = datetime.now().strftime("%m-%d-%Y_%H-%M")
    log_filename = os.path.join("logs", f"audit_{safe_timestamp}.log")
    with open(log_filename, "w") as f:
        f.write(log_entry)
    print(f"Audit log written to {log_filename}")

# -----------------------------------------------------------
# Main Function
# -----------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="Submit an RPSL object to a chosen IRR server using the HTTP/HTTPS API."
    )
    parser.add_argument("file", help="File containing the RPSL object to submit (full path; can be plain text, JSON, or .txt)")
    parser.add_argument("-s", "--server", default=None, help="IRR server hostname (overrides the default for the selected instance)")
    parser.add_argument("-p", "--port", type=int, default=None, help="IRR server port (overrides the default for the selected instance)")
    parser.add_argument("--db-type", choices=["RADB", "ALTDB"], default="ALTDB", help="Target IRR database type (default: ALTDB)")
    parser.add_argument("--instance", choices=["irrd", "altdb", "radb", "tc"], default="altdb",
                        help="Select the target IRR instance. 'irrd' defaults to 127.0.0.1 (HTTP API on port 8080), 'altdb' to whois.altdb.net:43, 'radb' to whois.radb.net:43, and 'tc' to bgp.net.br:80 (default: altdb)")
    parser.add_argument("--https", action="store_true", help="Use HTTPS instead of HTTP for the API connection")
    parser.add_argument("-o", "--override", help="Override password, if required")
    args = parser.parse_args()

    # Set default server and port based on instance selection.
    if args.instance == "irrd":
        default_server, default_port = "127.0.0.1", 8043
    elif args.instance == "radb":
        default_server, default_port = "whois.radb.net", 43
    elif args.instance == "tc":
        default_server, default_port = "bgp.net.br", 80
    else:
        default_server, default_port = "whois.altdb.net", 43

    server = args.server if args.server is not None else default_server
    port = args.port if args.port is not None else default_port

    # For local IRRD, force port 8080.
    if args.instance == "irrd":
        port = 8080

    # Determine the URL scheme.
    scheme = "https" if args.https else "http"
    # Set the API URL based on the instance.
    if args.instance == "tc":
        # For TC instance, use /submit/ endpoint.
        api_url = f"{scheme}://{server}:{port}/submit/"
    else:
        api_url = f"{scheme}://{server}:{port}/v1/submit/"

    # -----------------------------------------------------------
    # Process the input file.
    # -----------------------------------------------------------
    file_ext = os.path.splitext(args.file)[1].lower()
    if file_ext == ".txt":
        txt_filename = args.file
        try:
            json_dict, object_type, identifier = process_txt_file(txt_filename)
        except Exception as e:
            print(f"Error processing TXT file: {e}", file=sys.stderr)
            sys.exit(1)
        # Save the generated JSON file for record-keeping.
        json_filename = save_json_object(json_dict, object_type, identifier)
        print(f"Generated JSON file: {json_filename}")
        base_rpsl_text = json_dict["data"]["object_text"]
        action = json_dict.get("action", None)
        passwords = json_dict["data"].get("passwords", [])
        # Retrieve the multiple_routes flag from the top level.
        multiple_routes = json_dict.get("multiple_routes", False)
        if multiple_routes and object_type in ("route", "route6"):
            try:
                generated_objects = generate_route_subobjects(base_rpsl_text, object_type)
                json_dict["generated_objects"] = generated_objects
                objects_to_submit = generated_objects
            except Exception as e:
                print(f"Error generating multiple route objects: {e}", file=sys.stderr)
                sys.exit(1)
        else:
            objects_to_submit = [base_rpsl_text]
    else:
        # If file is not TXT, assume JSON/plain text.
        try:
            with open(args.file, "r") as f:
                file_content = f.read()
        except Exception as e:
            print(f"Error reading file '{args.file}': {e}", file=sys.stderr)
            sys.exit(1)
        action = None
        passwords = []
        base_rpsl_text = file_content
        try:
            parsed = json.loads(file_content)
            if isinstance(parsed, dict):
                action = parsed.get("action", None)
                if "data" in parsed:
                    data = parsed["data"]
                    if "object_text" in data:
                        base_rpsl_text = data["object_text"]
                    if "passwords" in data:
                        passwords = data["passwords"]
        except json.JSONDecodeError:
            pass
        objects_to_submit = [base_rpsl_text]

    if args.override:
        passwords = [args.override]

    # -----------------------------------------------------------
    # Submit the object(s) via the API.
    # -----------------------------------------------------------
    print(f"Submitting RPSL object(s) from '{args.file}' to {server}:{port} "
          f"(Instance: {args.instance}, DB type: {args.db_type}, Action: {action})...")
    result = submit_rpsl_change(api_url, objects_to_submit, passwords, action)
    print("Response from server:")
    print(json.dumps(result, indent=4))

    # -----------------------------------------------------------
    # Update JSON file and write audit log if submission succeeded.
    # -----------------------------------------------------------
    if file_ext == ".txt" and result.get("summary", {}).get("successful", 0) > 0:
        json_dict["status"] = "submitted"
        with open(json_filename, "w") as f:
            json.dump(json_dict, f, indent=4)
        print(f"Updated JSON file '{json_filename}' with status 'submitted'.")
        username = os.getenv("LOGNAME") or os.getenv("USER") or "unknown"
        try:
            host_ip = socket.gethostbyname(socket.gethostname())
        except Exception:
            host_ip = "unknown"
        write_audit_log(username, host_ip, action, json_filename)

if __name__ == "__main__":
    main()
