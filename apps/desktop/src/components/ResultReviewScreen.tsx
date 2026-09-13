import { useState } from 'react';

interface ResultReviewProps {
  requestId: string;
  patientName: string;
  testName: string;
  onBack: () => void;
}

export function ResultReviewScreen({ requestId, patientName, testName, onBack }: ResultReviewProps) {
  const aiFindings = "Plasmodium falciparum trophozoites seen. Parasitemia: 2+";
  
  const [editedFindings, setEditedFindings] = useState(aiFindings);
  const [comments, setComments] = useState("Recommend clinical correlation and follow-up in 48 hours.");
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      if (window.electron) {
        // Mock base64 signature to prevent backend crash during testing
        const mockSignature = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        
        const response = await window.electron.ipcRenderer.invoke('results:approve', {
          requestId: requestId,
          patientName: patientName,
          testName: testName,
          editedFindings: editedFindings,
          comments: comments,
          originalFindings: aiFindings,
          signatureData: mockSignature,
          scientistId: 'admin-id', 
          scientistName: 'System Administrator'
        });

        if (response.success) {
          alert(`Result approved!\nVerification Code: ${response.verificationCode}`);
          onBack(); 
        } else {
          alert(`Database Error: ${response.error}`);
        }
      } else {
        setTimeout(() => {
          alert(`[Browser Mode] Simulated approval for ${patientName}\n\nNote: To test real database writes, run the app in Electron.`);
          onBack(); 
        }, 1500);
      }
    } catch (err) {
      alert("Failed to communicate with Electron main process.");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full font-sans h-full flex flex-col">
      <div className="flex flex-col gap-2 mb-10">
        <button 
          onClick={onBack}
          className="self-start px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-bold text-sm transition-all shadow-sm mb-4"
        >
          &larr; Back to Worklist
        </button>
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Result Review</h2>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-lg font-bold text-primary-dark bg-primary-ghost px-4 py-1 rounded-lg border border-primary/20">{patientName}</span>
              <span className="text-slate-400 font-medium">•</span>
              <span className="text-lg font-semibold text-slate-600">{testName}</span>
              <span className="text-slate-400 font-medium">•</span>
              <span className="text-base font-mono font-medium text-slate-400">ID: {requestId.substring(0, 8)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10 flex-1">
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col shadow-inner">
          <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
            <h3 className="text-2xl font-extrabold text-slate-800">AI Preliminary Findings</h3>
            <span className="px-4 py-1.5 bg-emerald-100 text-emerald-800 text-sm font-extrabold rounded-full shadow-sm border border-emerald-200">
              Confidence: 94%
            </span>
          </div>
          
          <div className="flex-1">
            <label className="block text-base font-bold text-slate-500 mb-3 uppercase tracking-wider">Detected Morphology</label>
            <div className="p-6 bg-white border border-slate-200 rounded-2xl text-slate-800 text-lg shadow-sm min-h-[160px] font-medium leading-relaxed">
              {aiFindings}
            </div>
            
            <div className="mt-10">
              <label className="block text-base font-bold text-slate-500 mb-3 uppercase tracking-wider">Analyzed Frames</label>
              <div className="grid grid-cols-3 gap-4">
                <div className="aspect-square bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center text-sm font-bold text-slate-400">Frame 1</div>
                <div className="aspect-square bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center text-sm font-bold text-slate-400">Frame 2</div>
                <div className="aspect-square bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center text-sm font-bold text-slate-400">Frame 3</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 flex flex-col relative overflow-hidden">
          
          <h3 className="text-2xl font-extrabold text-primary-dark mb-8 border-b border-slate-100 pb-4 mt-2">
            Official Laboratory Report
          </h3>
          
          <div className="flex-1 space-y-8">
            <div>
              <label className="block text-base font-bold text-slate-700 mb-3">Final Findings (Editable)</label>
              <textarea
                value={editedFindings}
                onChange={(e) => setEditedFindings(e.target.value)}
                className="w-full p-5 text-lg font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white outline-none resize-none h-40 transition-all shadow-inner"
              />
              {editedFindings !== aiFindings && (
                <p className="text-sm text-warning mt-3 font-bold bg-amber-50 p-4 rounded-xl border border-amber-200">
                  Modifications to AI findings will be logged for future model retraining.
                </p>
              )}
            </div>

            <div>
              <label className="block text-base font-bold text-slate-700 mb-3">Interpretive Comment</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full p-5 text-lg font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white outline-none resize-none h-32 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100">
            <button
              disabled={isApproving}
              onClick={handleApprove}
              className={`w-full py-6 rounded-2xl font-extrabold text-xl text-white transition-all shadow-sm ${
                isApproving 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary-dark cursor-pointer'
              }`}
            >
              {isApproving ? 'Generating Cryptographic Signature...' : 'Approve & Release Result'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}