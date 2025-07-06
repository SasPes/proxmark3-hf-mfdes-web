# Proxmark3 MIFARE DESFire Web Interface

<img src="ss/MIFARE-DESFire-EV3.png" width="250">

A web-based interface for sending MIFARE DESFire commands to a Proxmark3 device.  
Built with FastAPI (Python backend) and a modern HTML/JS frontend.

![ss](ss/ss.png)

## Useful links
[Proxmark3Commands](https://github.com/SasPes/Proxmark3Commands)  
[MIFARE DESFire](https://github.com/SasPes/Proxmark3Commands/blob/main/MIFARE%20DESFire.md)

## Features

- Start and control the Proxmark3 shell from your browser
- Manage MFDes profiles and keys (set, get, change, master key)
- Create and manage DESFire applications and files (create, delete, list)
- Read and write file data
- String \<-\> Hex conversion tools
- "No Auth" toggle for testing
- Tabbed and sub-tabbed UI for easy navigation
- Output highlighting for command results
- Automatic dropdown population for AIDs and FIDs

## Requirements

- Python 3.8+
- [Proxmark3](https://github.com/Proxmark/proxmark3) installed and accessible
- [FastAPI](https://fastapi.tiangolo.com/)
- [pexpect](https://pexpect.readthedocs.io/en/stable/)
- [Uvicorn](https://www.uvicorn.org/) for running the server

## Setup

1. Clone this repository.
2. Install dependencies:
    ```
    pip install fastapi pexpect uvicorn
    ```
3. Make sure your Proxmark3 binary is built and available (default: `../proxmark3/pm3`).

## Running

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Open your browser and go to [http://localhost:8000](http://localhost:8000).

## Usage

Use the tabs to access different features:

- **Proxmark3:**  
  - Set the Proxmark3 executable path and start the shell.

- **MFDes Profile:**  
  - Get the current default MFDes profile (key and type).
  - Set a new default profile by selecting the crypto type and entering a key.

- **MFDes Commands:**  
  - Run common MFDes commands (e.g., HF Search, Free Memory, Info, List Apps).

- **MFDes (Card/App/File/Delete):**  
  - **Set new card master key:**  
    - Choose the new algorithm and enter the new key.
    - Click "Set Master Key" to update the card's master key.
  - **Set card default master key:**  
    - Select "Current Algo" (DES/2TDEA/3TDEA/AES).
    - Enter "Current Key" (the current master key).
    - Click "Set default (DES/0...0)" to reset the master key to DES/0000000000000000.
  - **Create MFDes App:**  
    - Enter App ID, FID, DF Name, and select Key Algo.
    - Click "Create App" to add a new application.
  - **Set App Key:**  
    - Select an app, enter a new key, and set it.
  - **Create File:**  
    - Select an app and create a new file.
  - **Write to File:**  
    - Select an app, enter plaintext, and write to the file.
  - **Delete App/File:**  
    - Select an app or file and delete it.
  - **Format card:**  
    - Format the card (all data will be erased).

- **Tools:**  
  - Convert between string and hex representations.

**Other features:**
- Use the "No Auth" toggle (top right) to enable/disable authentication for supported commands.
- Dropdowns for AID and FID are auto-populated after loading apps.
- Output and command results are shown at the bottom with color highlighting.

## Notes

- The backend uses pexpect to control the Proxmark3 shell.
- Some features require a connected Proxmark3 device.
- The "No Auth" toggle disables authentication for supported commands.
- All communication is via HTTP GET requests from the frontend to the FastAPI backend.

## License

MIT License 