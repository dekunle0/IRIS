# IRIS — Intelligent Real-time Imaging System

**Bringing Laboratory Services to Every Nigerian.**

IRIS is a desktop-first, fully offline AI-assisted microscopy platform built by [KytoLabx](https://kytolabx.io). It's designed specifically for the realities of medical laboratories in Nigeria and across Africa, where internet connectivity is often unreliable and power grids can be unpredictable. 

This repository contains the core IRIS Desktop software, which pairs with our custom IRIS Intelligent Eyepiece hardware.

## Why Offline-First?

Most AI diagnostic tools assume you have a fibre connection to a US or EU cloud server. We don't. 
IRIS is built from the ground up to operate with **zero internet dependency**. 

- **Local AI Inference**: The computer vision models (segmentation and classification) run directly on your workstation's CPU using a bundled, highly optimized local service. No cloud GPU required.
- **Local Encrypted Storage**: All patient data, sample records, and clinical results are stored in an encrypted local SQLite database (SQLCipher). Your data never leaves your lab unless you explicitly configure an integration.
- **Local Reporting**: MLSCN-compliant PDF reports are generated and printed directly from the desktop app.

IRIS doesn't replace the laboratory scientist; it augments them. It turns a 15-minute manual cell-counting chore into a 30-second AI-assisted review, reducing eye strain and allowing professionals to focus their judgement where it's needed most.

## Tech Stack

This is a modern desktop application, not a web wrapper:
- **Frontend**: React, TypeScript, Tailwind CSS, Vite.
- **Desktop Shell**: Electron (handles file system access, USB/Wi-Fi device pairing, and secure IPC).
- **Database**: `better-sqlite3-multiple-ciphers` (SQLite with SQLCipher AES-256 encryption).
- **Local AI Engine**: A lightweight Python/FastAPI child process running `onnxruntime` and OpenCV, bundled transparently via PyInstaller.
- **LIS Integration**: A local REST API (Fastify) for seamless integration with existing Laboratory Information Systems over the hospital's local network.

## Getting Started (Development)

To run the IRIS desktop app locally for development:

1. **Prerequisites**: Node.js 20+, `pnpm`, Python 3.11+.
2. **Install Dependencies**:
   ```bash
   pnpm install
   ```
   *(Note: This automatically builds the native SQLite bindings against the Electron ABI via our custom postinstall script).*
3. **Start the App**:
   ```bash
   pnpm dev
   ```

## Laboratory Information System (LIS) Integration

IRIS is designed to play nicely with existing hospital infrastructure. Instead of forcing labs to use our software for everything, IRIS acts as a highly specialized diagnostic node. 

We expose a local REST API (defaulting to `127.0.0.1:8787`, or the local subnet if enabled by an admin) that allows an existing LIS to:
1. Push patient and test request data to the IRIS worklist.
2. Poll for finalized, scientist-approved results.

This integration happens entirely on the local network. No public cloud APIs, no internet required.

---
*Confidential — KytoLabx Ltd. 2026.*
