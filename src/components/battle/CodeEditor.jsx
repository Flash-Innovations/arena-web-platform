import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, ShieldAlert, Code2 } from 'lucide-react';

export function CodeEditor({
  code,
  onChange,
  language = 'python',
  onLanguageChange,
  onRun,
  onSubmit,
  isExecuting = false,
  isSubmitting = false,
  onTabBlurViolation
}) {
  const [pasteBlockedWarning, setPasteBlockedWarning] = useState(false);
  const [blurCount, setBlurCount] = useState(0);

  // Anti-Cheat: Window Blur & Tab Switching Tracker
  useEffect(() => {
    function handleBlur() {
      setBlurCount((prev) => {
        const next = prev + 1;
        if (onTabBlurViolation) onTabBlurViolation(next);
        return next;
      });
    }

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [onTabBlurViolation]);

  // Anti-Cheat: Intercept Paste in Monaco Editor
  const handleEditorMount = (editor, monaco) => {
    // Intercept Cmd/Ctrl+V command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      setPasteBlockedWarning(true);
      setTimeout(() => setPasteBlockedWarning(false), 3000);
    });

    // Disable editor context menu paste
    const domNode = editor.getDomNode();
    if (domNode) {
      domNode.addEventListener('paste', (e) => {
        e.preventDefault();
        setPasteBlockedWarning(true);
        setTimeout(() => setPasteBlockedWarning(false), 3000);
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span>Solution Editor</span>
          </div>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
            className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-950 text-indigo-300 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500"
          >
            <option value="python">Python 3</option>
            <option value="javascript">JavaScript (Node)</option>
            <option value="cpp">C++ (GCC)</option>
          </select>
        </div>

        {/* Anti-Cheat & Action Buttons */}
        <div className="flex items-center gap-2">
          {pasteBlockedWarning && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 animate-fade-in">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Paste is blocked in 1v1</span>
            </div>
          )}

          {blurCount > 0 && (
            <span
              title="Tab switch violations logged for review"
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20"
            >
              Tab Blurs: {blurCount}
            </span>
          )}

          <button
            onClick={onRun}
            disabled={isExecuting || isSubmitting}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-slate-400" />
            <span>{isExecuting ? 'Running...' : 'Run Tests'}</span>
          </button>

          <button
            onClick={onSubmit}
            disabled={isExecuting || isSubmitting}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Verifying...' : 'Submit to Win'}</span>
          </button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 min-h-[360px] relative">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(val) => onChange && onChange(val || '')}
          onMount={handleEditorMount}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            padding: { top: 12 },
            fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace"
          }}
        />
      </div>

    </div>
  );
}

export default CodeEditor;
