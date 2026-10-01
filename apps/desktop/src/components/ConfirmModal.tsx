import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isDestructive?: boolean;
  isAlert?: boolean;
  isPrompt?: boolean;
  promptValue?: string;
  onPromptChange?: (val: string) => void;
  promptPlaceholder?: string;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
  isAlert = false,
  isPrompt = false,
  promptValue = '',
  onPromptChange,
  promptPlaceholder = ''
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 animate-fade-in-blur flex items-center justify-center z-[9999] p-10 bg-slate-900/40 backdrop-blur-md">
      <div className="bg-glass-panel backdrop-blur-3xl p-10 rounded-[40px] w-full max-w-md shadow-[0_24px_60px_rgba(0,0,0,0.2)] border border-white/20 animate-slide-up relative overflow-hidden">
        <h2 className="text-xl font-black text-white mb-3">{title}</h2>
        <div className="text-slate-200 font-medium mb-4 text-[13px] leading-relaxed whitespace-pre-wrap">
          {message}
        </div>
        {isPrompt && onPromptChange && (
          <div className="mb-8">
            <input 
              type="text" 
              autoFocus
              value={promptValue} 
              onChange={e => onPromptChange(e.target.value)}
              placeholder={promptPlaceholder}
              className="w-full p-4 text-base font-bold text-white bg-black/20 border border-white/10 rounded-2xl outline-none focus:bg-black/40 focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner placeholder:text-slate-400" 
            />
          </div>
        )}
        {!isPrompt && <div className="mb-4" />}
        <div className="flex gap-4 pt-2">
          {!isAlert && onCancel && (
            <button 
              type="button" 
              onClick={onCancel} 
              className="flex-1 py-4 font-bold text-slate-200 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl hover:bg-white/20 hover:text-white transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button 
            type="button" 
            onClick={onConfirm} 
            className={`flex-1 py-4 font-extrabold text-white rounded-2xl shadow-sm transition-colors ${isDestructive ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
