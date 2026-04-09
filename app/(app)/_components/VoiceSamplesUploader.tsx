"use client";
import { useRef, useState } from "react";

export type LocalSample = { title: string; body: string };

type Props = {
  samples: LocalSample[];
  onChange: (s: LocalSample[]) => void;
  compact?: boolean;
};

export default function VoiceSamplesUploader({ samples, onChange, compact }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  function add() {
    if (!body.trim() || body.trim().length < 50) {
      alert("Sample must be at least 50 characters.");
      return;
    }
    onChange([...samples, { title: title || "(untitled)", body: body.trim() }]);
    setTitle("");
    setBody("");
  }
  function remove(i: number) {
    onChange(samples.filter((_, idx) => idx !== i));
  }
  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const next: LocalSample[] = [...samples];
    for (const file of Array.from(files)) {
      const text = await file.text();
      if (text.trim().length < 50) continue;
      next.push({ title: file.name.replace(/\.[^.]+$/, ""), body: text.trim() });
    }
    onChange(next);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <div>
      {!compact && (
        <p className="sub" style={{ marginBottom: 12 }}>
          Upload past articles (.txt or .md) or paste them. Claude will use them to match your voice when generating content.
        </p>
      )}

      <label>Upload files (.txt, .md — multiple allowed)</label>
      <input
        ref={fileInput}
        type="file"
        accept=".txt,.md,.markdown"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        style={{ padding: 6 }}
      />

      <label style={{ marginTop: 14 }}>Or paste a sample</label>
      <input placeholder="Sample title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        placeholder="Paste full article body here (min 50 characters)…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        style={{ minHeight: 100, marginTop: 6 }}
      />
      <div style={{ marginTop: 10 }}>
        <button type="button" className="ghost" onClick={add}>+ Add pasted sample</button>
      </div>

      {samples.length > 0 && (
        <table style={{ marginTop: 16 }}>
          <thead><tr><th>Title</th><th>Length</th><th></th></tr></thead>
          <tbody>
            {samples.map((s, i) => (
              <tr key={i}>
                <td>{s.title}</td>
                <td>{s.body.length} chars</td>
                <td><button type="button" className="ghost" onClick={() => remove(i)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
