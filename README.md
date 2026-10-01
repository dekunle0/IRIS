# KytoLabx IRIS Desktop

IRIS (Intelligent Real-time Imaging System) is the primary workstation software for the KytoLabx digital microscopy suite. 

It interfaces directly with the IRIS Intelligent Eyepiece hardware to capture, analyze, and manage diagnostic blood films in strictly air-gapped laboratory environments.

## Architecture Overview

IRIS operates entirely locally. It does not rely on external cloud infrastructure for AI inference or data storage, ensuring strict compliance with data sovereignty regulations and continuous operation regardless of network stability.

* **Application Shell:** Electron / Node.js
* **User Interface:** React / TypeScript / Vite
* **Local Inference:** PyInstaller-bundled Python engine (ONNX Runtime / OpenCV) executing lightweight segmentation and classification models directly on the host CPU.
* **Storage:** AES-256 encrypted SQLite (via SQLCipher) ensuring rest-state data security for all clinical records.

## Local LIS Integration

IRIS functions as a specialized diagnostic node within existing hospital networks. It exposes a local Fastify-based REST API (bound to `127.0.0.1:8787` by default) to accept test requests from—and return approved diagnostic results to—a facility's primary Laboratory Information System (LIS).

## Development Setup

Node.js 20+ and Python 3.11+ are required. 

```bash
# Install dependencies and trigger native module compilation for Electron
pnpm install

# Launch the development server and Electron shell
pnpm dev
```

*KytoLabx Proprietary. Unauthorized distribution is prohibited.*
