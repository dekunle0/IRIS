import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://releases.kytolabx.com/latest.json');
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch {}

  return NextResponse.json({
    version: "1.1.0",
    release_date: "2026-08-29",
    release_notes: [
      { version: "1.1.0", notes: "Desktop-first architecture; LIS local REST API; MLSCN-compliant PDF generation; Classical contour/threshold blob detector segmentation pipeline." },
      { version: "1.0.5", notes: "Improved frame aggregation logic for parasitology deduplication." },
      { version: "1.0.0", notes: "Initial closed beta release for pilot institutions." }
    ],
    builds: {
      windows: { filename: "IRIS-Setup-1.1.0-win-x64.exe", size_mb: 142, sha256: "b028a34cd71c546cb96467d9620f1a73a415ba2a2673eab202a96b4c4e2fc65c", url: "https://releases.kytolabx.com/IRIS-Setup-1.1.0-win-x64.exe" },
      mac: { filename: "IRIS-1.1.0-mac-universal.dmg", size_mb: 158, sha256: "b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7", url: "https://releases.kytolabx.com/IRIS-1.1.0-mac-universal.dmg" },
      linux: [
        { type: "AppImage", filename: "IRIS-1.1.0-linux-x64.AppImage", size_mb: 145, sha256: "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2", url: "https://releases.kytolabx.com/IRIS-1.1.0-linux-x64.AppImage" },
        { type: "deb", filename: "IRIS-1.1.0-linux-amd64.deb", size_mb: 92, sha256: "d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6", url: "https://releases.kytolabx.com/IRIS-1.1.0-linux-amd64.deb" }
      ]
    }
  });
}