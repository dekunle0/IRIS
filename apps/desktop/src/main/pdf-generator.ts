import { PDFDocument, rgb, PDFFont, PDFPage, StandardFonts } from 'pdf-lib';
import * as fontkit from '@pdf-lib/fontkit';
import path from 'path';
import fs from 'fs';
import { encryptBuffer, decryptBuffer } from './db';
import QRCode from 'qrcode';
import crypto from 'crypto';

export function buildSignedQRPayload(data: Record<string, any>): string {
  const payload = JSON.stringify(data);
  const secret = process.env.IRIS_SIGNING_SECRET || 'dev-fallback-secret';
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return JSON.stringify({ data, sig: hmac });
}

function computeAge(dob: string): string {
  if (!dob) return '—';
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return '—';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age.toString();
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? rgb(parseInt(result[1], 16)/255, parseInt(result[2], 16)/255, parseInt(result[3], 16)/255) : rgb(0,0,0);
}

const C = {
  emerald: hexToRgb('#10b981'),
  red: hexToRgb('#ef4444'),
  amber: hexToRgb('#f59e0b'),
  slate900: hexToRgb('#0f172a'),
  slate700: hexToRgb('#334155'),
  slate500: hexToRgb('#64748b'),
  slate100: hexToRgb('#f1f5f9'),
  white: hexToRgb('#ffffff')
};

class PdfContext {
  pdfDoc: PDFDocument;
  page!: PDFPage;
  font: PDFFont;
  bf: PDFFont;
  ML: number = 45;
  MR: number;
  CW: number;
  Y: number;
  width: number = 595.28;
  height: number = 841.89;
  pageNum: number = 0;
  resultData: any;

  constructor(pdfDoc: PDFDocument, font: PDFFont, bf: PDFFont, resultData: any) {
    this.pdfDoc = pdfDoc;
    this.font = font;
    this.bf = bf;
    this.resultData = resultData;
    this.MR = this.width - this.ML;
    this.CW = this.MR - this.ML;
    this.Y = this.height - this.ML;
    this.addNewPage();
  }

  addNewPage() {
    this.page = this.pdfDoc.addPage([this.width, this.height]);
    this.pageNum++;
    this.Y = this.height - this.ML;

    // Draw header on new page
    this.drawHeader();
  }

  checkPage(requiredSpace: number) {
    if (this.Y - requiredSpace < 80) { // Keep 80 space for footer
      this.addNewPage();
    }
  }

  drawHeader() {
    // 1. Institutional Header
    const instName = this.resultData.institution_name || 'UNKNOWN INSTITUTION';
    const instAddress = this.resultData.institution_address || 'No address provided';
    const reportTitle = 'CLINICAL DIAGNOSTICS REPORT';

    this.page.drawText(instName.toUpperCase(), { x: this.ML, y: this.Y, size: 14, font: this.bf, color: C.emerald });
    this.Y -= 12;
    this.page.drawText(instAddress, { x: this.ML, y: this.Y, size: 8, font: this.font, color: C.slate500 });
    
    this.page.drawText(reportTitle, { x: this.MR - this.bf.widthOfTextAtSize(reportTitle, 14), y: this.Y + 12, size: 14, font: this.bf, color: C.slate900 });
    
    this.Y -= 20;
    this.page.drawLine({ start: { x: this.ML, y: this.Y }, end: { x: this.MR, y: this.Y }, thickness: 1, color: C.slate100 });
    this.Y -= 15;
  }

  drawFooter() {
    const pages = this.pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const footerY = 70;
      
      // Horizontal line
      p.drawLine({ start: { x: this.ML, y: footerY }, end: { x: this.MR, y: footerY }, thickness: 1, color: C.slate100 });

      // Legal footer
      const legal =
        'This report is generated and stored exclusively on the issuing institution\'s local system. ' +
        'It contains clinically sensitive information protected under the Nigerian Data Protection Regulation (NDPR) 2019 and the Health Records and Information Management Act. ' +
        'Unauthorised disclosure, reproduction, or transmission is strictly prohibited. For verification, scan the QR code above.';

      p.drawRectangle({ x: 0, y: 0, width: this.width, height: 38, color: C.slate100 });
      p.drawText(legal, { x: this.ML, y: 24, size: 6.2, font: this.font, color: C.slate500, maxWidth: this.CW - 90, lineHeight: 9 });
      
      const accr = this.resultData.accreditation_status ? `  |  ${this.resultData.accreditation_status}` : '';
      p.drawText(`KYTOLABX IRIS v1.1  |  MLSCN Compliant${accr}  |  ${new Date().getFullYear()}`, {
        x: this.ML, y: 8, size: 6, font: this.bf, color: C.emerald
      });

      // Page numbers
      const pageText = `Page ${i + 1} of ${pages.length}`;
      p.drawText(pageText, {
        x: this.MR - this.font.widthOfTextAtSize(pageText, 8),
        y: 8, size: 8, font: this.font, color: C.slate700
      });
    }
  }

  drawWrapped(text: string, x: number, maxW: number, lh: number, size: number, color: any, isBold: boolean = false) {
    const activeFont = isBold ? this.bf : this.font;
    let currentLine = '';
    const words = text.split(/\s+/);
    
    // Check if a single word is too long, break it by characters
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (activeFont.widthOfTextAtSize(word, size) > maxW) {
        let chunk = '';
        for (const char of word) {
          if (activeFont.widthOfTextAtSize(chunk + char + '-', size) > maxW) {
            this.checkPage(lh);
            this.page.drawText(chunk + '-', { x, y: this.Y, size, font: activeFont, color });
            this.Y -= lh;
            chunk = char;
          } else {
            chunk += char;
          }
        }
        words[i] = chunk;
      }
    }

    const reassembledWords = words;
    for (const word of reassembledWords) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = activeFont.widthOfTextAtSize(testLine, size);
      
      if (testWidth > maxW) {
        this.checkPage(lh);
        this.page.drawText(currentLine, { x, y: this.Y, size, font: activeFont, color });
        this.Y -= lh;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      this.checkPage(lh);
      this.page.drawText(currentLine, { x, y: this.Y, size, font: activeFont, color });
      this.Y -= lh;
    }
  }
}

export async function generateLocalPDF(resultData: any): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  
  // Use a local unicode font (Arial) to support Nigerian diacritics
  let fontBytes: Buffer | undefined, bfBytes: Buffer | undefined;
  try {
    fontBytes = fs.readFileSync('C:\\Windows\\Fonts\\arial.ttf');
    bfBytes = fs.readFileSync('C:\\Windows\\Fonts\\arialbd.ttf');
  } catch {
    // Fallback to standard fonts if filesystem access fails
    console.warn("Arial TTF not found, falling back to Helvetica");
  }

  const font = fontBytes ? await pdfDoc.embedFont(fontBytes, { subset: true }) : await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bf = bfBytes ? await pdfDoc.embedFont(bfBytes, { subset: true }) : await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const ctx = new PdfContext(pdfDoc, font, bf, resultData);

  const field = (label: string, val: string, w: number = 250) => {
    ctx.page.drawText(label, { x: ctx.ML, y: ctx.Y, size: 7, font: ctx.bf, color: C.slate500 });
    ctx.page.drawText(val, { x: ctx.ML, y: ctx.Y - 12, size: 9, font: ctx.font, color: C.slate900 });
    ctx.ML += w;
  };
  const nl = () => { ctx.ML = 45; ctx.Y -= 30; };

  // Patient Info
  const maskedNin = resultData.nin ? `****-${resultData.nin.slice(-4)}` : '—';
  const age = computeAge(resultData.dob);
  
  field('PATIENT NAME', resultData.patientName || '—');
  field('DOB / AGE', `${resultData.dob || '—'} / ${age} yrs`, 150);
  field('GENDER', resultData.gender || '—', 100);
  nl();
  field('PATIENT ID', resultData.patient_code || '—');
  field('HOSPITAL NO.', resultData.hospital_number || '—', 150);
  field('NIN', maskedNin, 100);
  nl();

  ctx.Y -= 10;
  ctx.page.drawLine({ start: { x: ctx.ML, y: ctx.Y }, end: { x: ctx.MR, y: ctx.Y }, thickness: 1, color: C.slate100 });
  ctx.Y -= 15;

  // Request Info
  field('TEST CATEGORY', resultData.test_category || 'Haematology');
  field('REQUESTING CLINICIAN', resultData.requesting_clinician || '—', 150);
  field('WARD/CLINIC', resultData.ward_clinic || '—', 100);
  nl();
  field('TEST REQUESTED', resultData.testName || resultData.test_name || '—');
  field('PRIORITY', resultData.priority || 'Routine', 150);
  field('DATE ISSUED', new Date().toLocaleDateString(), 100);
  nl();

  ctx.Y -= 10;
  ctx.page.drawLine({ start: { x: ctx.ML, y: ctx.Y }, end: { x: ctx.MR, y: ctx.Y }, thickness: 1, color: C.slate100 });
  ctx.Y -= 20;

  // Methodology
  ctx.page.drawText('METHODOLOGY', { x: ctx.ML, y: ctx.Y, size: 9, font: ctx.bf, color: C.slate900 });
  ctx.Y -= 14;
  const method = `Automated digital microscopy with AI-assisted cell classification (IRIS v${resultData.modelVersion || '1.0.0'}). `
    + `Thick and thin blood film preparation. Giemsa-stained slides analysed at 100X oil immersion. `
    + `AI model: ${resultData.test_category || 'haematology'} pipeline. MLSCN-registered diagnostic workflow.`;
  ctx.drawWrapped(method, ctx.ML, ctx.CW, 13, 9, C.slate700);
  ctx.Y -= 10;

  // Quantitative Findings Table
  let ranges: any[] = [];
  if (resultData.reference_ranges) {
    try { ranges = JSON.parse(resultData.reference_ranges); } catch (e) {}
  }
  
  if (ranges.length > 0) {
    ctx.checkPage(ranges.length * 20 + 50);
    ctx.page.drawLine({ start: { x: ctx.ML, y: ctx.Y }, end: { x: ctx.MR, y: ctx.Y }, thickness: 1, color: C.slate100 });
    ctx.Y -= 18;
    ctx.page.drawText('QUANTITATIVE FINDINGS', { x: ctx.ML, y: ctx.Y, size: 9, font: ctx.bf, color: C.slate900 });
    ctx.Y -= 16;
    
    // Table Header
    ctx.page.drawRectangle({ x: ctx.ML, y: ctx.Y - 4, width: ctx.CW, height: 16, color: C.slate100 });
    ctx.page.drawText('ANALYTE', { x: ctx.ML + 10, y: ctx.Y, size: 7, font: ctx.bf, color: C.slate500 });
    ctx.page.drawText('RESULT', { x: ctx.ML + 180, y: ctx.Y, size: 7, font: ctx.bf, color: C.slate500 });
    ctx.page.drawText('REFERENCE INTERVAL', { x: ctx.ML + 350, y: ctx.Y, size: 7, font: ctx.bf, color: C.slate500 });
    ctx.Y -= 16;

    let aiFindings = resultData.findings || '';
    for (const r of ranges) {
      ctx.checkPage(20);
      let resVal = '—';
      if (r.field && aiFindings) {
         try {
           const parsed = JSON.parse(aiFindings);
           let ptr = parsed;
           for (const part of r.field.split('.')) { ptr = ptr[part]; }
           if (ptr !== undefined) resVal = ptr.toString();
         } catch {
           const match = aiFindings.match(new RegExp(`${r.analyte}:\\s*([\\d.]+)`));
           if (match) resVal = match[1];
         }
      }
      ctx.page.drawText(r.analyte, { x: ctx.ML + 10, y: ctx.Y, size: 9, font: ctx.bf, color: C.slate900 });
      ctx.page.drawText(`${resVal} ${r.unit}`, { x: ctx.ML + 180, y: ctx.Y, size: 9, font: ctx.font, color: C.slate900 });
      ctx.page.drawText(`${r.low} - ${r.high} ${r.unit}`, { x: ctx.ML + 350, y: ctx.Y, size: 8, font: ctx.font, color: C.slate500 });
      ctx.Y -= 16;
      ctx.page.drawLine({ start: { x: ctx.ML, y: ctx.Y + 10 }, end: { x: ctx.MR, y: ctx.Y + 10 }, thickness: 0.5, color: C.slate100 });
    }
    ctx.Y -= 10;
  }

  // AI Confidence
  ctx.checkPage(50);
  let confPct = 0;
  try {
    const cs = typeof resultData.confidence_scores === 'string' ? JSON.parse(resultData.confidence_scores) : {};
    confPct = cs.overall !== undefined ? Math.round(cs.overall * 100) : (resultData.confidencePct || 0);
  } catch { confPct = resultData.confidencePct || 0; }

  const confLabel = confPct >= 90 ? 'HIGH' : confPct >= 70 ? 'MODERATE' : 'LOW';
  const confColor = confPct >= 90 ? C.emerald : confPct >= 70 ? C.amber : C.red;
  ctx.page.drawText(`Overall model confidence: `, { x: ctx.ML, y: ctx.Y, size: 9, font: ctx.font, color: C.slate700 });
  ctx.page.drawText(`${confPct}% - ${confLabel}`, { x: ctx.ML + 150, y: ctx.Y, size: 9, font: ctx.bf, color: confColor });
  ctx.page.drawText(
    'AI-generated findings are provided as decision support only and must be reviewed and authorized by a qualified MLSCN-registered scientist.',
    { x: ctx.ML, y: ctx.Y - 13, size: 7.5, font: ctx.font, color: C.slate500 }
  );
  ctx.Y -= 30;

  // FOV Images
  const fovImages: string[] = Array.isArray(resultData.frameImages) ? resultData.frameImages.slice(0, 3) : [];
  if (fovImages.length > 0) {
    ctx.checkPage(180);
    ctx.page.drawLine({ start: { x: ctx.ML, y: ctx.Y }, end: { x: ctx.MR, y: ctx.Y }, thickness: 1, color: C.slate100 });
    ctx.Y -= 18;
    ctx.page.drawText('FIELD OF VIEW - REPRESENTATIVE FRAMES', { x: ctx.ML, y: ctx.Y, size: 9, font: ctx.bf, color: C.slate900 });

    const imgW = Math.floor((ctx.CW - 10) / Math.min(fovImages.length, 3));
    const imgH = Math.round(imgW * 0.75);

    let imgX = ctx.ML;
    for (let i = 0; i < fovImages.length; i++) {
      const src = fovImages[i];
      try {
        let embeddedImg;
        const b64Data = src.split(',')[1];
        if (src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg')) {
          embeddedImg = await pdfDoc.embedJpg(Buffer.from(b64Data, 'base64'));
        } else if (src.startsWith('data:image/png')) {
          embeddedImg = await pdfDoc.embedPng(Buffer.from(b64Data, 'base64'));
        } else if (src.startsWith('data:image/webp')) {
          // Convert to PNG placeholder if webp isn't natively supported, 
          // or ideally convert via sharp/canvas. For now, since pdf-lib doesn't do WebP natively,
          // we embed a simple square indicating "WebP image omitted".
          // If we had canvas we could convert. To not crash, we skip WebP silently in base pdf-lib
          // but we won't throw an unhandled exception.
          continue;
        } else {
          continue;
        }
        ctx.page.drawImage(embeddedImg, { x: imgX, y: ctx.Y - imgH, width: imgW - 5, height: imgH });
        ctx.page.drawText(`FOV ${i + 1}`, {
          x: imgX + 2, y: ctx.Y - imgH + 4, size: 6, font: ctx.bf, color: C.white
        });
        imgX += imgW;
      } catch (e) { console.error('Failed to embed FOV image', e); }
    }
    ctx.Y -= imgH + 16;
  }

  // Clinical Narrative
  ctx.checkPage(120);
  ctx.page.drawLine({ start: { x: ctx.ML, y: ctx.Y }, end: { x: ctx.MR, y: ctx.Y }, thickness: 1, color: C.slate100 });
  ctx.Y -= 18;
  ctx.page.drawText('CLINICAL FINDINGS', { x: ctx.ML, y: ctx.Y, size: 9, font: ctx.bf, color: C.slate900 });
  ctx.Y -= 16;
  ctx.drawWrapped(resultData.editedFindings || 'No findings reported.', ctx.ML, ctx.CW, 14, 10, C.slate900);
  ctx.Y -= 16;

  // Interpretive Comment
  if (resultData.comments) {
    ctx.checkPage(80);
    ctx.page.drawText('INTERPRETIVE COMMENT', { x: ctx.ML, y: ctx.Y, size: 9, font: ctx.bf, color: C.slate900 });
    ctx.Y -= 16;
    ctx.drawWrapped(resultData.comments, ctx.ML, ctx.CW, 14, 10, C.slate700);
    ctx.Y -= 16;
  }

  // Ensure there's space for authorization & signature (which take ~80 units)
  ctx.checkPage(100);

  // Print auth footer
  const authY = ctx.Y - 20;
  ctx.page.drawText('AUTHORIZED BY', { x: ctx.ML, y: authY, size: 7, font: ctx.bf, color: C.slate500 });
  ctx.page.drawText(resultData.approvedByName || 'Authorized Personnel', { x: ctx.ML, y: authY - 14, size: 11, font: ctx.bf, color: C.slate900 });
  ctx.page.drawText(`Role: ${(resultData.approvedByRole || '').replace(/_/g, ' ').toUpperCase()}`, {
    x: ctx.ML, y: authY - 28, size: 8, font: ctx.font, color: C.slate500
  });
  if (resultData.mlscnNumber) {
    ctx.page.drawText(`MLSCN Reg: ${resultData.mlscnNumber}`, { x: ctx.ML, y: authY - 40, size: 8, font: ctx.bf, color: C.slate700 });
  }

  // Signature image
  if (resultData.signatureData) {
    try {
      const b64 = resultData.signatureData.split(',')[1];
      const sigImg = await pdfDoc.embedPng(Buffer.from(b64, 'base64'));
      
      // Preserve aspect ratio while fitting into a 130x40 box
      const maxWidth = 130;
      const maxHeight = 40;
      const aspect = sigImg.width / sigImg.height;
      let finalW = maxWidth;
      let finalH = maxWidth / aspect;
      if (finalH > maxHeight) {
        finalH = maxHeight;
        finalW = maxHeight * aspect;
      }
      ctx.page.drawImage(sigImg, { x: ctx.ML, y: authY - 45, width: finalW, height: finalH });
    } catch { /* no signature */ }
  }

  // QR code
  try {
    const qrPayload = buildSignedQRPayload({
      ref: resultData.verificationCode || '',
      patient: resultData.patientName || '',
      test: resultData.testName || resultData.test_name || '',
      issued: new Date().toISOString().split('T')[0],
      ...(resultData.isAmendment ? { amends: resultData.priorVerificationCode } : {})
    });
    const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 90 });
    const qrImg = await pdfDoc.embedPng(Buffer.from(qrDataUrl.split(',')[1], 'base64'));
    ctx.page.drawImage(qrImg, { x: ctx.MR - 85, y: authY - 50, width: 85, height: 85 });
    ctx.page.drawText('SCAN TO VERIFY', { x: ctx.MR - 80, y: authY - 55, size: 6.5, font: ctx.bf, color: C.slate500 });
  } catch { /* QR failed */ }

  ctx.drawFooter();

  const pdfBytes = await pdfDoc.save();

  let storagePath = process.cwd();
  if (process.versions?.electron) {
    const { app } = require('electron');
    storagePath = app.getPath('userData');
  }

  const pdfPath = path.join(storagePath, `Report_${resultData.verificationCode}.pdf.enc`);
  fs.writeFileSync(pdfPath, encryptBuffer(Buffer.from(pdfBytes)));
  return pdfPath;
}

export async function printLocalReport(pdfPath: string): Promise<boolean> {
  if (!process.versions?.electron) return false;
  const { app, BrowserWindow } = require('electron');
  
  const tempPath = path.join(app.getPath('temp'), `print_${Date.now()}.pdf`);
  const encrypted = fs.readFileSync(pdfPath);
  const decrypted = decryptBuffer(encrypted);
  if (!decrypted) return false;
  fs.writeFileSync(tempPath, decrypted, { mode: 0o600 });
  
  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } });
    win.loadFile(tempPath);
    win.webContents.on('did-finish-load', () => {
      win.webContents.print({ silent: false, printBackground: true }, (success: boolean, failureReason: string) => {
        win.close();
        try { fs.unlinkSync(tempPath); } catch (e) {}
        if (success) {
          resolve(true);
        } else {
          reject(new Error(failureReason || 'Print failed or cancelled'));
        }
      });
    });
  });
}