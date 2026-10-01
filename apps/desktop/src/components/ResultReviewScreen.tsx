import { useState, useRef, useEffect, useMemo } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { calculateEditDistance } from '../utils/algorithms';
import { ConfirmModal } from './ConfirmModal';

const SignaturePad = SignatureCanvas as any;

import { SPECIALIST_ROLES } from '../utils/constants';

interface ResultReviewProps {
  requestId: string;
  patientName: string;
  testName: string;
  currentUser: any;
  onBack: () => void;
}

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs text-red-600 font-semibold whitespace-pre-wrap">{message}</p>
  );
};

export function ResultReviewScreen({ requestId, patientName, testName, currentUser, onBack }: ResultReviewProps) {
  const sigPad = useRef<SignatureCanvas>(null);
  const [aiFindings, setAiFindings] = useState('Loading...');
  const [confidencePct, setConfidencePct] = useState(0);
  const [editedFindings, setEditedFindings] = useState('');
  const [comments, setComments] = useState('');
  const [frameImages, setFrameImages] = useState<string[]>([]);
  const [isApproving, setIsApproving] = useState(false);
  const [autoPrint, setAutoPrint] = useState(true);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [approvedPdfPath, setApprovedPdfPath] = useState<string | null>(null);
  const [priorPdfPath, setPriorPdfPath] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [isReleased, setIsReleased] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testCategory, setTestCategory] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!window.electron) return;
      const res = await window.electron.ipcRenderer.invoke('results:getReviewData', requestId);
      if (res.success && res.data) {
        const { findings, confidence, frames, isApproved, resultId: resResultId, pdfPath, priorPdfPath: resPriorPdfPath, testCategory: resTestCategory } = res.data;
        if (isApproved) {
          setApprovedPdfPath(pdfPath);
          setPriorPdfPath(resPriorPdfPath);
          setResultId(resResultId);
        }
        const formatted = `Detected Morphology: ${findings.test_type}\nParasitaemia: ${findings.parasitaemia_pct}%\nSeverity Rating: ${findings.severity}\nParasitised RBCs Found: ${findings.by_class?.parasitised_rbc || 0}\nTotal Cells Analyzed: ${findings.total_cells}`;
        setAiFindings(formatted);
        setEditedFindings(formatted);
        setComments(findings.interpretive_comment || 'Recommend clinical correlation.');
        setFrameImages(frames || []);
        // Safely check against null/undefined so a real 0 confidence isn't fabricated as 94%
        setConfidencePct(
          (confidence.overall !== undefined && confidence.overall !== null)
            ? Math.round(confidence.overall * 100)
            : 94
        );
        // Stash test category for role-gating
        setTestCategory(resTestCategory);
      }
    };
    load();
  }, [requestId]);

  const deviationScore = useMemo(() => {
    if (!aiFindings || !editedFindings) return 0;
    const distance = calculateEditDistance(aiFindings, editedFindings);
    const maxLen = Math.max(aiFindings.length, editedFindings.length, 1);
    return Math.min(100, Math.round((distance / maxLen) * 100));
  }, [aiFindings, editedFindings]);

  const canApprove = useMemo(() => {
    if (!testCategory) return false;
    const allowed = SPECIALIST_ROLES[testCategory] || [];
    return allowed.includes(currentUser.role);
  }, [testCategory, currentUser.role]);

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', isDestructive: false, onConfirm: () => {}, onCancel: () => {} });

  const requestConfirm = (title: string, message: string, isDestructive = false): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true, title, message, isDestructive,
        onConfirm: () => { setConfirmState(prev => ({ ...prev, isOpen: false })); resolve(true); },
        onCancel: () => { setConfirmState(prev => ({ ...prev, isOpen: false })); resolve(false); }
      });
    });
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      if (window.electron) {
        const response = await window.electron.ipcRenderer.invoke('results:generatePdfPreview', {
          requestId,
          patientName,
          testName,
          editedFindings,
          comments,
          frameImages,
          token: currentUser?.token || currentUser?.sessionToken,
        });
        if (response.success && response.pdfPath) {
          await window.electron.ipcRenderer.invoke('shell:openPath', response.pdfPath);
        } else {
          setErrors({ global: response.error || 'Preview failed' });
        }
      }
    } catch {
      setErrors({ global: 'Failed to generate preview' });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleApprove = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (deviationScore > 20) {
      const confirmed = await requestConfirm(
        "Significant Override",
        `WARNING: Your edits deviate from the AI findings by ${deviationScore}%. Are you sure you want to approve this significant override?`,
        true
      );
      if (!confirmed) return;
    }

    const requiredKeys = ['Detected Morphology:', 'Parasitaemia:', 'Severity Rating:'];
    const missing = requiredKeys.filter(k => !editedFindings.includes(k));
    if (missing.length > 0) {
      newErrors.findings = `Required fields are missing:\n${missing.map(k => `• ${k}`).join('\n')}`;
    } else {
      const pMatch = editedFindings.match(/Parasitaemia:\s*([0-9.]+)\s*%/);
      if (!pMatch || isNaN(parseFloat(pMatch[1]))) {
        newErrors.findings = 'Parasitaemia must include a valid numeric percentage (e.g. Parasitaemia: 1.5%).';
      }
    }
    if (!sigPad.current || sigPad.current.isEmpty()) {
      newErrors.signature = 'A signature is required to authorize this report.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const confirmSign = await requestConfirm(
      "Authorize Report",
      "By clicking OK, you are legally authorizing this clinical report. This action is irrevocable and will lock the result. Proceed?",
      false
    );
    if (!confirmSign) return;

    setIsApproving(true);
    const signatureData = sigPad.current!.getCanvas().toDataURL('image/png');

    try {
      if (window.electron) {
        const response = await window.electron.ipcRenderer.invoke('results:approve', {
          requestId,
          patientName,
          testName,
          editedFindings,
          comments,
          originalFindings: aiFindings,
          signatureData, autoPrint,
          scientistId: currentUser.id,
          scientistName: currentUser.name,
          frameImages,
          token: currentUser?.token || currentUser?.sessionToken,
        });
        if (response.success) {
          setApprovedPdfPath(response.pdfPath);
          setResultId(response.resultId);
        } else {
          setErrors({ global: response.error });
        }
      }
    } catch {
      setErrors({ global: 'Failed to communicate with the local database.' });
    } finally {
      setIsApproving(false);
    }
  };

  const handleRelease = async () => {
    if (!resultId || !window.electron) return;
    try {
      const res = await window.electron.ipcRenderer.invoke('results:release', { resultId });
      if (res.success) {
        setIsReleased(true);
      } else {
        setErrors({ global: res.error });
      }
    } catch {
      setErrors({ global: 'System error during release.' });
    }
  };

  const handleDownloadPdf = async () => {
    if (!approvedPdfPath || !window.electron) return;
    try {
      const res = await window.electron.ipcRenderer.invoke('results:savePdf', {
        pdfPath: approvedPdfPath,
        token: currentUser?.token || currentUser?.sessionToken,
      });
      if (!res.success && !res.canceled) {
        setErrors({ global: res.error });
      }
    } catch {
      setErrors({ global: 'System error during PDF export.' });
    }
  };

  const textareaBase = 'w-full p-4 text-sm text-app-text bg-glass-input backdrop-blur-xl border border-glass-inputBorder shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] rounded-2xl outline-none resize-none transition-all disabled:opacity-50 shadow-sm font-medium';
  const textareaFocus = 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';
  const textareaError = 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20';

  return (
    <div className="max-w-7xl mx-auto w-full font-sans h-full flex flex-col pb-10">
      <div className="flex flex-col gap-1 mb-6">
        <button onClick={onBack} className="self-start text-xs font-bold uppercase tracking-widest text-app-muted hover:text-app-text transition-colors mb-3">
          ← Back to Worklist
        </button>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-app-text tracking-tight">Test results</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-bold text-app-text bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-sm">{patientName}</span>
              <span className="text-slate-300">·</span>
              <span className="text-sm font-semibold text-app-muted">{testName}</span>
            </div>
          </div>
        </div>
      </div>

      {errors.global && <FieldError message={errors.global} />}

      <div className="flex-1 flex flex-col min-h-0 mt-2">
        <div className="grid grid-cols-2 gap-8 flex-1 bg-glass-panel backdrop-blur-3xl p-8 rounded-3xl border border-glass-panelBorder shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)]">
          
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-5 border-b border-slate-200/60 pb-4">
              <h3 className="text-sm font-bold text-app-text">Initial findings</h3>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-emerald-200">
                {confidencePct}% confidence
              </span>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-app-muted mb-2 uppercase tracking-wide">Slide analysis</label>
              <div className="p-4 bg-glass-input backdrop-blur-xl border border-glass-inputBorder shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] rounded-2xl text-sm text-app-text min-h-[140px] font-medium leading-relaxed whitespace-pre-wrap shadow-inner">
                {aiFindings}
              </div>
              <div className="mt-8">
                <label className="block text-xs font-bold text-app-muted mb-2 uppercase tracking-wide">Fields of view</label>
                <div className="grid grid-cols-3 gap-3">
                  {frameImages.length > 0 ? (
                    frameImages.map((src, idx) => (
                      <div key={idx} className="aspect-square bg-slate-900 rounded-2xl overflow-hidden shadow-sm relative group">
                        <img src={src} alt={`FOV ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-md">
                          FOV {idx + 1}
                        </div>
                      </div>
                    ))
                  ) : (
                    [1, 2, 3].map(n => (
                      <div key={n} className="aspect-square bg-glass-input backdrop-blur-xl rounded-2xl border border-glass-inputBorder shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] flex items-center justify-center text-xs text-slate-300 font-medium shadow-inner">
                        —
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col border-l border-slate-200/60 pl-8">
            <div className="flex justify-between items-center mb-5 border-b border-slate-200/60 pb-4">
              <h3 className="text-sm font-bold text-emerald-700">Final report</h3>
              {deviationScore > 0 && (
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${deviationScore > 20 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                  {deviationScore}% deviation
                </span>
              )}
            </div>

            <div className="flex-1 space-y-6">
              <div>
                <label className="block text-xs font-bold text-app-muted mb-1.5 uppercase tracking-wide">Final findings</label>
                <textarea
                  disabled={!!approvedPdfPath}
                  value={editedFindings}
                  onChange={e => { setEditedFindings(e.target.value); if (errors.findings) setErrors({ ...errors, findings: '' }); }}
                  className={`${textareaBase} h-40 ${errors.findings ? textareaError : textareaFocus}`}
                />
                <FieldError message={errors.findings} />
              </div>
              <div>
                <label className="block text-xs font-bold text-app-muted mb-1.5 uppercase tracking-wide">Comments</label>
                <textarea
                  disabled={!!approvedPdfPath}
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  className={`${textareaBase} h-28 ${textareaFocus}`}
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200/60">
              {approvedPdfPath ? (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex flex-col items-center text-center shadow-sm">
                  <svg className="w-10 h-10 text-emerald-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="text-sm font-bold text-app-text mb-1">Result saved</h4>
                  <p className="text-xs font-medium text-app-muted mb-5">Report has been signed and saved locally.</p>
                  <div className="flex gap-2 w-full flex-wrap justify-center">
                    <button onClick={async () => {
                      const res = await window.electron.ipcRenderer.invoke('shell:openPath', approvedPdfPath);
                      if (!res.success) setErrors({ global: 'Failed to open PDF: ' + res.error });
                    }} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-app-muted text-sm font-bold rounded-xl transition-colors tracking-wide">
                      Open PDF
                    </button>
                    {priorPdfPath && (
                      <button onClick={async () => {
                        const res = await window.electron.ipcRenderer.invoke('shell:openPath', priorPdfPath);
                        if (!res.success) setErrors({ global: 'Failed to open Prior PDF: ' + res.error });
                      }} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-amber-700 text-sm font-bold rounded-xl transition-colors tracking-wide border border-amber-200">
                        Prior PDF
                      </button>
                    )}
                    <button onClick={handleDownloadPdf} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-app-muted text-sm font-bold rounded-xl transition-colors tracking-wide">
                      Save PDF
                    </button>
                    <button disabled={isReleased} onClick={handleRelease} className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm tracking-wide disabled:opacity-60">
                      {isReleased ? 'Released' : 'Release Result'}
                    </button>
                    <button onClick={onBack} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-app-muted text-sm font-bold rounded-xl transition-colors tracking-wide">
                      Back
                    </button>
                    {errors.global && <div className="w-full mt-2"><FieldError message={errors.global} /></div>}
                  </div>
                </div>
              ) : !showSignaturePad ? (
                <>
                  {!canApprove && testCategory && (
                    <div className="mb-4 text-xs font-semibold text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                      You do not have the required role to sign and approve this {testCategory} result. Only authorized specialists may authorize this report.
                    </div>
                  )}
                  <button 
                    disabled={!canApprove}
                    onClick={() => setShowSignaturePad(true)} 
                    className="w-full py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed">
                    Sign & approve
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-app-muted uppercase tracking-wide">Signature</label>
                    <button type="button" onClick={() => sigPad.current?.clear()} className="text-[10px] font-bold uppercase tracking-widest text-app-muted hover:text-app-muted transition-colors">
                      Clear
                    </button>
                  </div>
                  <div className={`border-2 rounded-xl overflow-hidden relative h-36 shadow-inner ${errors.signature ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-glass-input backdrop-blur-xl'}`}>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-slate-300 text-sm font-medium select-none">
                      Sign here
                    </div>
                    <SignaturePad
                      ref={sigPad}
                      onBegin={() => { if (errors.signature) setErrors({ ...errors, signature: '' }); }}
                      canvasProps={{ className: 'w-full h-full cursor-crosshair relative z-10' }}
                    />
                  </div>
                  <FieldError message={errors.signature} />
                  <div className="mt-4 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={autoPrint} onChange={e => setAutoPrint(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500 bg-glass-input border-slate-300" />
                      <span className="text-xs font-bold text-app-muted">Auto-print final report</span>
                    </label>
                  </div>
                  
                  <div className="flex gap-3">
                    <button onClick={handlePreview} disabled={isPreviewing} className="flex-1 py-3 text-sm font-bold text-app-text bg-white border border-slate-200 shadow-sm rounded-xl hover:bg-slate-50 transition-colors tracking-wide disabled:opacity-50">
                      {isPreviewing ? 'Loading...' : 'Preview PDF'}
                    </button>
                    <button onClick={() => setShowSignaturePad(false)} className="flex-1 py-3 text-sm font-bold text-app-muted bg-glass-input backdrop-blur-xl border border-glass-inputBorder shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] rounded-xl hover:bg-white/70 transition-colors shadow-sm tracking-wide">
                      Cancel
                    </button>
                    <button disabled={isApproving} onClick={handleApprove} className="flex-[2] py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-60 shadow-sm tracking-wide">
                      {isApproving ? 'Saving...' : 'Sign & Approve'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal {...confirmState} />
    </div>
  );
}
