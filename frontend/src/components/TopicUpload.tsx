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

  // Submit Upload + Summarize (Backend does Gemini)
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

      // ✅ Backend generates summary + saves topic
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
    <div>
      <h2 className="text-2xl font-bold mb-4">Upload Topic</h2>

      {error && <p className="text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Topic Title"
          className="border p-2 w-full"
        />

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          className="border p-2 w-full"
        >
          <option value="basic">Basic (Child Friendly)</option>
          <option value="detailed">Detailed (Academic)</option>
          <option value="overview">Overview (Concept Mapping)</option>
        </select>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste text here..."
          className="border p-2 w-full"
        />

        <input
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          {loading ? "Summarizing..." : "Summarize & Save"}
        </button>
      </form>

      <hr className="my-6" />

      <h3 className="font-bold mb-2">Saved Topics</h3>

      {history.map((t) => (
        <button
          key={t.id}
          onClick={() => setSelectedTopic(t)}
          className="block w-full text-left border p-2 mb-2"
        >
          {t.title} ({t.mode})
        </button>
      ))}
      {selectedTopic && (
        <div className="mt-6 border p-4 rounded">
          <h2 className="text-xl font-bold mb-4">{selectedTopic.title}</h2>

          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className="prose max-w-none"
          >
            {selectedTopic.summary || ""}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default TopicUpload;
