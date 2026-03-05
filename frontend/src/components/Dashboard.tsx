import React from "react";

const Dashboard: React.FC = () => {
  return (
    <div className="bg-gray-50 text-gray-800 px-10 py-12 space-y-12 min-h-screen">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Welcome to <span className="text-indigo-600">DidactAI</span>
        </h1>

        <p className="text-gray-600 mt-4 text-lg">
          AI-powered structured learning with mastery analytics and adaptive
          intelligence.
        </p>
      </div>

      {/* Feature Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FeatureCard
          title="Smart Summaries"
          description="Multi-level summarization: Basic, Detailed, Conceptual."
          accent="bg-indigo-50 text-indigo-600"
        />

        <FeatureCard
          title="Adaptive Assessments"
          description="Mastery-based quizzes with performance insights."
          accent="bg-cyan-50 text-cyan-600"
        />

        <FeatureCard
          title="Learning Analytics"
          description="Concept-level tracking and progression modeling."
          accent="bg-emerald-50 text-emerald-600"
        />

        <FeatureCard
          title="Verified Certificates"
          description="Downloadable certificates upon mastery completion."
          accent="bg-amber-50 text-amber-600"
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
  <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
    <div
      className={`inline-block px-3 py-1 rounded-md text-xs font-semibold mb-4 ${accent}`}
    >
      Feature
    </div>

    <h2 className="text-xl font-semibold mb-3 text-gray-900">{title}</h2>

    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
  </div>
);

export default Dashboard;
