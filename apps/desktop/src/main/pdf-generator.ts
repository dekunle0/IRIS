import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

// FIX: Removed top-level Electron import
export async function generateLocalPDF(resultData: any): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { height } = page.getSize();

  page.drawText('IRIS CLINICAL LABORATORY REPORT', { x: 50, y: height - 50, size: 18, font: boldFont, color: rgb(0.01, 0.58, 0.41) });
  page.drawText(`Report ID: ${resultData.verificationCode}`, { x: 50, y: height - 70, size: 10, font });
  
  page.drawText(`Patient Name: ${resultData.patientName}`, { x: 50, y: height - 110, size: 12, font: boldFont });
  page.drawText(`Test Requested: ${resultData.testName}`, { x: 50, y: height - 130, size: 12, font });

  page.drawText('FINAL FINDINGS', { x: 50, y: height - 200, size: 14, font: boldFont });
  page.drawText(resultData.editedFindings, { x: 50, y: height - 220, size: 11, font, maxWidth: 495 });

  page.drawText('INTERPRETIVE COMMENT', { x: 50, y: height - 300, size: 14, font: boldFont });
  page.drawText(resultData.comments, { x: 50, y: height - 320, size: 11, font, maxWidth: 495 });

  const qrDataUrl = await QRCode.toDataURL(JSON.stringify({ id: resultData.verificationCode, test: resultData.testName }));
  const qrImage = await pdfDoc.embedPng(qrDataUrl);
  page.drawImage(qrImage, { x: 450, y: 50, width: 80, height: 80 });

  page.drawText('NDPR Compliant. AI-assisted analysis reviewed and approved by a licensed MLS.', { x: 50, y: 30, size: 8, font, color: rgb(0.5, 0.5, 0.5) });

  const pdfBytes = await pdfDoc.save();
  
  // FIX: Dynamic check ensures terminal testing writes to current directory seamlessly
  let storagePath = process.cwd();
  if (process.versions && process.versions.electron) {
    const { app } = require('electron');
    storagePath = app.getPath('userData');
  }

  const pdfPath = path.join(storagePath, `Report_${resultData.verificationCode}.pdf`);
  fs.writeFileSync(pdfPath, pdfBytes);

  return pdfPath;
}

export async function printLocalReport(pdfPath: string) {
  if (!process.versions || !process.versions.electron) {
    console.log(`[Print] PDF saved to ${pdfPath} (Terminal Mode)`);
    return;
  }
  const { BrowserWindow } = require('electron');
  const win = new BrowserWindow({ show: false });
  win.loadFile(pdfPath);
  win.webContents.on('did-finish-load', () => {
    win.webContents.print({ silent: false, printBackground: true }, () => win.close());
  });
}