import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: "1.1.0",
    release_date: "2026-08-29",
    release_notes: [
      { version: "1.1.0", notes: "Desktop-first architecture; LIS local REST API; MLSCN-compliant PDF generation; Cellpose segmentation pipeline." },
      { version: "1.0.5", notes: "Improved frame aggregation logic for parasitology deduplication." },
      { version: "1.0.0", notes: "Initial closed beta release for pilot institutions." }
    ],
    builds: {
      windows: { filename: "IRIS-Setup-1.1.0-win-x64.exe", size_mb: 142, sha256: "a3f9e1b2c4...", url: "#" },
      mac: { filename: "IRIS-1.1.0-mac-universal.dmg", size_mb: 158, sha256: "b8c7d6e5f4...", url: "#" },
      linux: [
        { type: "AppImage", filename: "IRIS-1.1.0-linux-x64.AppImage", size_mb: 145, sha256: "c1d2e3f4g5...", url: "#" },
        { type: "deb", filename: "IRIS-1.1.0-linux-amd64.deb", size_mb: 92, sha256: "d5e6f7g8h9...", url: "#" }
      ]
    }
  });
}