# IRR-RPSL-Dispatcher
A dispatcher tool for IRR that sends RPSL objects via the HTTP/HTTPS API.

IRR-RPSL-Dispatcher is a Python-based tool designed to simplify and automate the management of RPSL (Routing Policy Specification Language) object submissions to Internet Routing Registry (IRR) instances. It effectively bridges the gap between user-friendly input formats and the strict requirements of IRR databases, thereby reducing operational complexity and saving time for network engineers and operations teams.

The tool processes RPSL objects using JSON input files or TXT files that contain specific header metadata. Users can specify actions such as adding, modifying, or deleting objects through these header lines, provide passwords either in the files or as command-line arguments, and enable one-time multiple route generation if desired.

IRR-RPSL-Dispatcher supports various IRR instances, ranging from local private IRRd for laboratory testing to production instances like RADB, ALTDB, and TC IRR. It features configurable defaults to ensure compatibility across different operational environments.

Additionally, the tool generates JSON files that document the processed RPSL objects. These files are stored in an `objects/` directory, facilitating auditing and consistency management by ensuring that all submitted objects adhere to uniform formatting rules.

The tool can be enhanced in several ways to integrate more effectively with other tools. This would facilitate end-to-end network automation and play a vital role in managing routing policies, where security and availability are critical. Please feel free to share any ideas or suggestions you may have.

```
python3 irr_rpsl_dispatcher.py --help
usage: irr_rpsl_dispatcher.py [-h] [-s SERVER] [-p PORT] [--db-type {RADB,ALTDB}] [--instance {irrd,altdb,radb,tc}] [--http] [-o OVERRIDE] file

Submit an RPSL object to a chosen IRR server using the HTTP/HTTPS API.

positional arguments:
  file                  File containing the RPSL object to submit (full path; can be plain text, JSON, or .txt)

options:
  -h, --help            show this help message and exit
  -s SERVER, --server SERVER
                        IRR server hostname (overrides the default for the selected instance)
  -p PORT, --port PORT  IRR server port (overrides the default for the selected instance)
  --db-type {RADB,ALTDB}
                        Target IRR database type (default: ALTDB)
  --instance {irrd,altdb,radb,tc}
                        Select the target IRR instance. 'irrd' defaults to 127.0.0.1 (HTTP API on port 8080), 'altdb' to whois.altdb.net:443, 'radb' to whois.radb.net:443, and 'tc' to bgp.net.br:443
                        (default: altdb)
  --http                Use HTTP instead of HTTPS for the API connection (for non-local IRRd instances)
  -o OVERRIDE, --override OVERRIDE
                        Override password, if required
```
