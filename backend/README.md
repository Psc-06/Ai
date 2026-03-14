# Backend Setup

This directory contains the backend for the BankShield network security scanner.

## Prerequisites

- Python 3.11+ (recommended)
- pip

## Setup

1. Open a terminal in this folder:

   ```bash
   cd backend
   ```

2. Create and activate a virtual environment.

   Windows PowerShell:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

   macOS/Linux:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

## Run the backend

If your entry file is `app.py`, run:

```bash
python app.py
```

If you use Flask CLI instead:

```bash
flask --app app run --debug
```

## Notes

- `python-nmap` requires `nmap` to be installed on the host system.
- Add your runtime configuration (database URI, secrets) through environment variables.
