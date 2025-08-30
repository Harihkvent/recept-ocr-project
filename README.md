
# Receipt OCR Project — Easy Step-by-Step (for non-technical users)

This document explains **how to run the Receipt OCR project locally** in simple, step-by-step instructions so a non-technical person can follow along. It covers backend (Python FastAPI) and the mobile client (Expo React Native).  

> **Goal:** Upload a receipt image → backend extracts text, merchant, date, total → stores into a local MongoDB.

---

## What you'll need (simple checklist)

1. A computer (Windows / macOS / Ubuntu).
2. Internet connection to download a few tools.
3. Basic comfort running a few commands (copy-paste from these instructions).
4. The project files (you already have them).

---

## High-level steps (you will follow these in detail below)

1. Install system-level prerequisites (Python 3.10+, Tesseract OCR, optional Docker).
2. Setup and run MongoDB (database).
3. Setup backend (create virtual environment, install Python packages).
4. Download spaCy language model.
5. Run the backend server.
6. Run the mobile app (optional) or call the backend directly with a test image.

---

## 1) Install system-level prerequisites

### Windows
- Install **Python 3.10+** from https://www.python.org/downloads/ and check "Add to PATH".
- Install **Tesseract OCR**: download the Windows installer (choose latest) and run it.
  - After install, note the Tesseract install path (e.g. `C:\Program Files\Tesseract-OCR\tesseract.exe`).

### macOS (with Homebrew)
Open Terminal and run:
```bash
brew install python@3.10    # if Python not already installed
brew install tesseract
```

### Ubuntu / Debian
Open Terminal and run:
```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip
sudo apt install -y tesseract-ocr
```

---

## 2) Set up MongoDB (database)

You can run MongoDB locally or use a free cloud cluster (MongoDB Atlas). The backend will try `mongodb://localhost:27017` by default.

**Option A — Using Docker (easy, recommended if you have Docker):**
```bash
docker run -d --name receipts-mongo -p 27017:27017 mongo:6.0
```

**Option B — Install MongoDB locally**
- Follow official MongoDB installation docs for your OS.

**Tip:** If you use a cloud connection (Atlas), copy your connection string and set the environment variable `MONGO_URL` before starting the server.

---

## 3) Backend setup (Python)

Open a Terminal/PowerShell and follow these steps.

### Create a Python virtual environment and activate it
Linux / macOS:
```bash
cd /path/to/recept-ocr-project/backend
python3 -m venv venv
source venv/bin/activate
```

Windows (PowerShell):
```powershell
cd C:\path\to\recept-ocr-project\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Install Python dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 4) Download spaCy language model
Run:
```bash
python -m spacy download en_core_web_sm
```

(This model is small and used to extract named entities like merchant names or dates.)

---

## 5) Make sure Tesseract is reachable
If Tesseract is not on your PATH (Windows), you may need to set environment variable in your shell before running the server:

Windows (PowerShell):
```powershell
$env:PATH += ";C:\Program Files\Tesseract-OCR"
```
Or set `TESSERACT_CMD` in Python code or system environment to the full path:
```
C:\Program Files\Tesseract-OCR\tesseract.exe
```

---

## 6) Run the backend server

From `backend/` folder with your virtual environment activated:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Server should start at: `http://localhost:8000`

### Quick test — healthcheck
If the repo includes a health endpoint (or root docs), open:
```
http://localhost:8000/docs
```
This URL shows the interactive FastAPI docs where you can test endpoints via a browser.

### Uploading a receipt (example)
From Terminal:
```bash
curl -X POST "http://localhost:8000/receipts/upload" -F "file=@/path/to/receipt.jpg"
```
Replace `/path/to/receipt.jpg` with your image path. The API should respond with extracted fields and an inserted database id.

---

## 7) Run the mobile app (optional)
This project includes a mobile client built with **Expo** (React Native). To run it:

1. Install **Node.js** (recommended LTS) from https://nodejs.org/
2. Install **Expo CLI** globally:
```bash
npm install -g expo-cli
```
3. In a new terminal:
```bash
cd /path/to/recept-ocr-project/mobile
npm install
expo start
```
Use the Expo app on your phone to scan the QR code or run an emulator.

If the mobile app needs the backend URL, open its configuration and point it at `http://<your-machine-ip>:8000` (replace localhost when testing on an actual phone).

---

## 8) Troubleshooting (common issues)

- **Tesseract not found / OCR returns empty text**  
  Ensure the `tesseract` binary is installed and in your PATH. Try running `tesseract --version` in terminal.

- **MongoDB connection refused**  
  Make sure MongoDB is running (docker container or service). If using Docker, check `docker ps`. If using Atlas, set `MONGO_URL` env variable to your connection string.

- **spaCy model missing**  
  Run `python -m spacy download en_core_web_sm`. If this fails, ensure internet connection.

- **Permission errors on Windows when activating venv**  
  Use PowerShell as Administrator or run the recommended activation command for PowerShell: `.\venv\Scripts\Activate.ps1`.

---

## Files added/modified by these instructions

- `.gitignore` — excludes virtual environments, node_modules, and other temp files (created in repository).
- `requirements.txt` — lists Python libraries to install (created in repository).
- `README.md` — this file (created in repository).

---

## If you'd like, I can:
- Produce a 1-click script (`run_local.sh`) that automates environment creation and server start.
- Create a Docker Compose file to run the backend + MongoDB together.
- Trim the repository (remove `backend/venv` and other generated files) so the repo is clean for git.

---

**Done for now.** Follow the exact commands above. If you want, I will now:
1. Create the `.gitignore` file with sensible defaults.
2. Create a `requirements.txt` based on the project imports.
3. Add the `README.md` file (this file).

Which of those should I create now? (Or I can create all three immediately.)
