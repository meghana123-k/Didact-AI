import React from "react";

const Dashboard: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-500 space-y-10">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-slate-800">
          Welcome to DidAct AI 🎓
        </h1>
        <p className="text-slate-500 mt-3 max-w-2xl mx-auto">
          Your personalized AI-powered learning platform for summaries, adaptive
          quizzes, analytics, and certificates.
        </p>
      </div>

      {/* Main Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Summarizer */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all">
          <h2 className="text-2xl font-bold text-blue-700 mb-2">
            📘 Smart Summaries
          </h2>
          <p className="text-slate-500 mb-4">
            Upload your study material and get multi-level AI summaries: Basic,
            Detailed, and Conceptual.
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase">
            Go to → Summaries Tab
          </p>
        </div>

        {/* Quiz Generator */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all">
          <h2 className="text-2xl font-bold text-indigo-700 mb-2">
            🧠 Adaptive Quiz Generator
          </h2>
          <p className="text-slate-500 mb-4">
            Generate 30-question mastery quizzes (Easy, Medium, Hard) from your
            uploaded topic summaries.
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase">
            Go to → Assessments Tab
          </p>
        </div>

        {/* Analytics */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all">
          <h2 className="text-2xl font-bold text-emerald-700 mb-2">
            📊 Learning Analytics
          </h2>
          <p className="text-slate-500 mb-4">
            Track accuracy trends, weak concepts, difficulty performance, and
            integrity insights.
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase">
            Go to → Analytics Tab
          </p>
        </div>

        {/* Certificates */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all">
          <h2 className="text-2xl font-bold text-yellow-600 mb-2">
            🏆 Verified Certificates
          </h2>
          <p className="text-slate-500 mb-4">
            Score above 75% in mastery quizzes and earn a downloadable digital
            certificate as proof of learning.
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase">
            Go to → Certificates Tab
          </p>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center text-sm text-slate-400 italic">
        DidAct AI ensures structured, measurable, and meaningful learning.
      </div>
    </div>
  );
};

export default Dashboard;
