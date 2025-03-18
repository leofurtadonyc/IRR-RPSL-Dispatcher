# IRR-RPSL-Dispatcher
A dispatcher tool for IRR that sends RPSL objects via the HTTP API.

IRR-RPSL-Dispatcher is a Python-based tool designed to simplify and automate the management of RPSL (Routing Policy Specification Language) object submissions to Internet Routing Registry (IRR) instances. It effectively bridges the gap between user-friendly input formats and the strict requirements of IRR databases, thereby reducing operational complexity and saving time for network engineers and operations teams.

The tool processes RPSL objects using JSON input files or TXT files that contain specific header metadata. Users can specify actions such as adding, modifying, or deleting objects through these header lines, provide passwords either in the files or as command-line arguments, and enable one-time multiple route generation if desired.

IRR-RPSL-Dispatcher supports various IRR instances, ranging from local private IRRd for laboratory testing to production instances like RADB, ALTDB, and TC IRR. It features configurable defaults to ensure compatibility across different operational environments.

Additionally, the tool generates JSON files that document the processed RPSL objects. These files are stored in an `objects/` directory, facilitating auditing and consistency management by ensuring that all submitted objects adhere to uniform formatting rules.

The tool can be enhanced in several ways to integrate more effectively with other tools. This would facilitate end-to-end network automation and play a vital role in managing routing policies, where security and availability are critical. Please feel free to share any ideas or suggestions you may have.
