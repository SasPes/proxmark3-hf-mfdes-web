# Proxmark3 MIFARE DESFire Web Interface

A web-based interface for sending MIFARE DESFire commands to a Proxmark3 device.  
Built with FastAPI (Python backend) and a simple HTML/JS frontend.

![ss](ss/ss.png)

## Features

- Start and control the Proxmark3 shell from your browser
- Manage MFDes profiles and keys
- Create and manage DESFire applications and files
- Read and write file data
- String/hex conversion tools
- "No Auth" toggle for testing

## Requirements

- Python 3.8+
- [Proxmark3](https://github.com/Proxmark/proxmark3) installed and accessible
- [FastAPI](https://fastapi.tiangolo.com/)
- [pexpect](https://pexpect.readthedocs.io/en/stable/)

## Setup

1. Clone this repository.
2. Install dependencies:
    ```
    pip install fastapi pexpect uvicorn
    ```
3. Make sure your Proxmark3 binary is built and available (default: `../../proxmark3/pm3`).

## Running

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Open your browser and go to [http://localhost:8000](http://localhost:8000).

## Usage

- Use the tabs to access different features.
- Start the Proxmark3 shell from the "Proxmark3" tab.
- Use the "MFDes File Access" tab for app/file operations.
- Output and command results are shown at the bottom.

## Notes

- The backend uses `pexpect` to control the Proxmark3 shell.
- Some features require a connected Proxmark3 device.
- The "No Auth" toggle disables authentication for supported commands.

## License

MIT License