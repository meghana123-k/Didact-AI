import React from "react";

const Dashboard: React.FC = () => {
  return (
    <div className="bg-[#0f172a] text-slate-100 px-10 py-12 space-y-12">

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-semibold tracking-tight">
          Welcome to DidactAI
        </h1>
        <p className="text-slate-400 mt-4 text-lg">
          AI-powered structured learning with mastery analytics and adaptive intelligence.
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Overall Accuracy", value: "84%", color: "text-emerald-400" },
          { title: "Weak Concepts", value: "3", color: "text-amber-400" },
          { title: "Mastery Level", value: "Intermediate", color: "text-indigo-400" },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800"
          >
            <p className="text-sm text-slate-400">{item.title}</p>
            <p className={`text-2xl font-semibold mt-2 ${item.color}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Feature Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FeatureCard
          title="Smart Summaries"
          description="Multi-level summarization: Basic, Detailed, Conceptual."
          accent="text-indigo-400"
        />
        <FeatureCard
          title="Adaptive Assessments"
          description="Mastery-based quizzes with performance insights."
          accent="text-cyan-400"
        />
        <FeatureCard
          title="Learning Analytics"
          description="Concept-level tracking and progression modeling."
          accent="text-emerald-400"
        />
        <FeatureCard
          title="Verified Certificates"
          description="Downloadable certificates upon mastery completion."
          accent="text-amber-400"
        />
      </div>

    </div>
  );
};

interface CardProps {
  title: string;
  description: string;
  accent: string;
}

const FeatureCard: React.FC<CardProps> = ({ title, description, accent }) => (
  <div className="bg-[#1e293b] p-8 rounded-2xl border border-slate-800 hover:border-slate-600 transition-all">
    <h2 className={`text-xl font-semibold mb-3 ${accent}`}>{title}</h2>
    <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
  </div>
);

export default Dashboard;
