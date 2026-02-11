import React, { useState, useEffect } from "react";
import { topicService } from "../services/topicService";
import { Topic, User } from "../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface TopicUploadProps {
  user: User;
}

const TopicUpload: React.FC<TopicUploadProps> = ({ user }) => {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"basic" | "detailed" | "overview">("basic");

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token") || "";

  // Load Topic History
  useEffect(() => {
    const load = async () => {
      const topics = await topicService.getHistory(user.id, token);
      setHistory(topics);
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title) return setError("Topic title is required");
    if (!text && !file) return setError("Provide text or upload PDF/DOCX");

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("mode", mode);

      if (text) formData.append("text", text);
      if (file) formData.append("file", file);

      const savedTopic = await topicService.summarize(formData, token);

      setHistory([savedTopic, ...history]);
      setSelectedTopic(savedTopic);

      setTitle("");
      setText("");
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#0f172a] text-slate-100">
      {/* 🔹 Sidebar */}
      <aside className="w-72 border-r border-slate-800 bg-[#111827] p-4 overflow-y-auto">
        <h3 className="text-sm uppercase tracking-wide text-slate-400 mb-4">
          Saved Topics
        </h3>

        {history.length === 0 && (
          <p className="text-slate-500 text-sm">No topics yet.</p>
        )}

        {history.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTopic(t)}
            className={`w-full text-left p-3 rounded-xl mb-2 transition-all ${
              selectedTopic?.id === t.id ? "bg-slate-700" : "hover:bg-slate-800"
            }`}
          >
            <p className="text-sm font-medium truncate">{t.title}</p>
            <p className="text-xs text-slate-500">{t.mode}</p>
          </button>
        ))}
      </aside>

      {/* 🔹 Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        {/* If no topic selected → show upload form */}
        {!selectedTopic && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">
              Upload & Summarize Topic
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-700 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Topic Title"
                className="w-full px-4 py-3 rounded-xl bg-[#1e293b] border border-slate-700 text-slate-100 focus:border-indigo-500 outline-none"
              />

              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl bg-[#1e293b] border border-slate-700 text-slate-100"
              >
                <option value="basic">Basic (Child Friendly)</option>
                <option value="detailed">Detailed (Academic)</option>
                <option value="overview">Overview (Concept Mapping)</option>
              </select>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste text here..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-[#1e293b] border border-slate-700 text-slate-100 outline-none"
              />

              <input
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-slate-400"
              />

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all font-medium"
              >
                {loading ? "Summarizing..." : "Summarize & Save"}
              </button>
            </form>
          </div>
        )}

        {/* If topic selected → show summary */}
        {selectedTopic && (
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setSelectedTopic(null)}
              className="text-sm text-indigo-400 mb-6 hover:text-indigo-300"
            >
              ← Back to Upload
            </button>

            <h2 className="text-3xl font-semibold mb-6">
              {selectedTopic.title}
            </h2>

            <div className="prose prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedTopic.summary}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TopicUpload;
