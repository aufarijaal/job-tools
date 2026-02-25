import { useState } from "react";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { toast } from "sonner";

loader.config({ monaco });

const starterText = `Meeting Notes

- Agenda:
- Action Items:
- Follow-up Date:
`;

type EditorTheme = "vs-dark" | "light";

function PowerfulTextEditor() {
  const [value, setValue] = useState(starterText);
  const [theme, setTheme] = useState<EditorTheme>("vs-dark");
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState(true);
  const [minimap, setMinimap] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const characters = value.length;
  const lines = value.split("\n").length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied editor content to clipboard.");
    } catch {
      toast.error("Copy failed. Please try again.");
    }
  };

  const handleReset = () => {
    setValue(starterText);
    toast.success("Content reset to starter text.");
  };

  return (
    <div className="p-8 max-w-7xl">
      <h1 className="text-4xl font-bold mb-4">Powerful Text Editor</h1>
      <p className="text-lg mb-6">
        Write and organize plain text notes with a clean editing experience and
        quick utilities.
      </p>

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Theme</label>
            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value as EditorTheme)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="vs-dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Font Size</label>
            <input
              type="number"
              min={10}
              max={30}
              value={fontSize}
              onChange={(event) =>
                setFontSize(Number(event.target.value) || 14)
              }
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={wordWrap}
                onChange={(event) => setWordWrap(event.target.checked)}
                className="h-4 w-4"
              />
              Word Wrap
            </label>
          </div>

          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={minimap}
                onChange={(event) => setMinimap(event.target.checked)}
                className="h-4 w-4"
              />
              Minimap
            </label>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => setShowHelp(true)}
              className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
            >
              Help
            </button>
            <button
              onClick={handleCopy}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Copy
            </button>
            <button
              onClick={handleReset}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Editor
          height="65vh"
          language="plaintext"
          theme={theme}
          value={value}
          onChange={(nextValue) => setValue(nextValue ?? "")}
          options={{
            fontSize,
            minimap: { enabled: minimap },
            wordWrap: wordWrap ? "on" : "off",
            padding: { top: 16, bottom: 16 },
            automaticLayout: true,
            formatOnType: true,
            formatOnPaste: true,
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Editor Shortcuts Help</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                aria-label="Close help"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-3 text-sm text-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded p-3">Find: Ctrl+F / Cmd+F</div>
                <div className="bg-gray-50 rounded p-3">Replace: Ctrl+H / Cmd+Alt+F</div>
                <div className="bg-gray-50 rounded p-3">Select All: Ctrl+A / Cmd+A</div>
                <div className="bg-gray-50 rounded p-3">Undo: Ctrl+Z / Cmd+Z</div>
                <div className="bg-gray-50 rounded p-3">Redo: Ctrl+Y / Cmd+Shift+Z</div>
                <div className="bg-gray-50 rounded p-3">Copy Line Down: Shift+Alt+Down / Shift+Option+Down</div>
                <div className="bg-gray-50 rounded p-3">Move Line Up/Down: Alt+Up/Down / Option+Up/Down</div>
                <div className="bg-gray-50 rounded p-3">Command Palette: F1</div>
                <div className="bg-gray-50 rounded p-3">Toggle Word Wrap: Alt+Z / Option+Z</div>
                <div className="bg-gray-50 rounded p-3">Format Document: Shift+Alt+F / Shift+Option+F</div>
              </div>
              <p className="text-xs text-gray-500">
                Shortcuts may vary slightly by OS/keyboard layout.
              </p>
            </div>

            <div className="px-6 py-4 border-t flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-700">
        <span>Lines: {lines}</span>
        <span>Words: {words}</span>
        <span>Characters: {characters}</span>
      </div>
    </div>
  );
}

export default PowerfulTextEditor;
