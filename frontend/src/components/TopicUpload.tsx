import React, { useState, useEffect } from "react";
import { topicService } from "../services/topicService";
import { Topic, User } from "../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { CodeProps } from "react-markdown/lib/ast";

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

  useEffect(() => {
    const load = async () => {
      const topics = await topicService.getHistory(user.id, token);
      setHistory(topics);
    };
    load();
  }, [user.id, token]);

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

  const formattedSummary = selectedTopic?.summary
    ? selectedTopic.summary
        .replace(/(#+\s.*)(\n)([^#\n])/g, "$1\n\n$3")
        .replace(/([a-z0-9])\.\s([A-Z])/g, "$1.\n\n$2")
    : "";

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className="w-72 border-r border-gray-200 bg-white p-4 overflow-y-auto shadow-sm">
        <h3 className="text-sm uppercase tracking-wide text-gray-400 mb-4">
          Saved Topics
        </h3>

        {history.length === 0 && (
          <p className="text-gray-500 text-sm">No topics yet.</p>
        )}

        {history.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTopic(t)}
            className={`w-full text-left p-3 rounded-lg mb-2 transition ${
              selectedTopic?.id === t.id
                ? "bg-indigo-50 border border-indigo-200"
                : "hover:bg-gray-100"
            }`}
          >
            <p className="text-sm font-semibold truncate">{t.title}</p>
            <p className="text-xs text-gray-500">{t.mode}</p>
          </button>
        ))}
      </aside>

      {/* Main */}
      <main className="flex-1 p-10 overflow-y-auto">
        {!selectedTopic && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold mb-6">
              Upload & Summarize Topic
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-300 text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Topic Title"
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:border-indigo-500 outline-none shadow-sm"
              />

              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 shadow-sm"
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
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 outline-none shadow-sm"
              />

              <input
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-gray-600"
              />

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition font-medium shadow"
              >
                {loading ? "Summarizing..." : "Summarize & Save"}
              </button>
            </form>
          </div>
        )}

        {selectedTopic && selectedTopic.summary && (
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setSelectedTopic(null)}
              className="text-sm text-indigo-600 mb-6 hover:underline"
            >
              ← Back
            </button>

            <h2 className="text-3xl font-bold mb-3">{selectedTopic.title}</h2>

            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-semibold">
              {selectedTopic.mode.toUpperCase()} MODE
            </span>

            <div className="markdown-body mt-8">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: ({
                    inline,
                    className,
                    children,
                    ...props
                  }: CodeProps) => {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={oneLight}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-gray-100 px-2 py-1 rounded text-indigo-600">
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {formattedSummary}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TopicUpload;
