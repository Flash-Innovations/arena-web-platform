import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, ShieldAlert, Terminal } from 'lucide-react';

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
    <div className="flex flex-col h-full bg-[#0c0d10] border border-zinc-800 rounded-xl overflow-hidden">
      
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#121215] border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-zinc-300">
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span>Editor</span>
          </div>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
            className="px-2 py-0.5 text-xs font-mono bg-zinc-900 text-zinc-200 border border-zinc-750 rounded focus:outline-none focus:border-zinc-500 cursor-pointer"
          >
            <option value="python">Python 3</option>
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++ (GCC)</option>
          </select>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {pasteBlockedWarning && (
            <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              <ShieldAlert className="w-3 h-3" />
              <span>Paste Disabled</span>
            </div>
          )}

          {blurCount > 0 && (
            <span
              title="Tab blur violations logged for match review"
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20"
            >
              Blurs: {blurCount}
            </span>
          )}

          <button
            onClick={onRun}
            disabled={isExecuting || isSubmitting}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/80 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3 h-3 text-zinc-400" />
            <span>{isExecuting ? 'Running...' : 'Run'}</span>
          </button>

          <button
            onClick={onSubmit}
            disabled={isExecuting || isSubmitting}
            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold tracking-wide transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            <span>{isSubmitting ? 'Evaluating...' : 'Submit'}</span>
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
            fontFamily: "ui-monospace, SFMono-Regular, 'JetBrains Mono', 'Geist Mono', Menlo, Consolas, monospace"
          }}
        />
      </div>

    </div>
  );
}

export default CodeEditor;
