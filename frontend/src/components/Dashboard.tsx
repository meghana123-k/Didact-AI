import React from "react";
import { BookOpen, Brain, BarChart3, Award, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Hero Section */}

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 px-10 text-center">
        <h1 className="text-5xl font-bold mb-4">Welcome to DidactAI</h1>

        <p className="text-lg text-indigo-100 max-w-2xl mx-auto">
          Transform dense learning material into structured understanding,
          adaptive quizzes, and measurable mastery.
        </p>

        <div className="mt-8">
          <button
            onClick={() => navigate("/summaries")}
            className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold shadow hover:scale-105 transition"
          >
            Start Learning
          </button>
        </div>
      </div>

      {/* Feature Section */}

      <div className="px-10 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Learning System Modules
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <FeatureCard
            icon={<BookOpen size={32} />}
            title="Smart Summaries"
            description="Basic, Detailed, and Conceptual summaries generated using NLP."
            link="/summaries"
          />

          <FeatureCard
            icon={<Brain size={32} />}
            title="Adaptive Quizzes"
            description="Beginner, Intermediate, and Advanced questions automatically generated."
            link="/assessments"
          />

          <FeatureCard
            icon={<BarChart3 size={32} />}
            title="Learning Analytics"
            description="Track mastery levels, concept performance, and learning improvement."
            link="/analytics"
          />

          <FeatureCard
            icon={<Award size={32} />}
            title="Certificates"
            description="Receive verified certificates after clearing mastery threshold."
            link="/certificates"
          />

          {/* NEW BLOG CARD */}

          <FeatureCard
            icon={<Info size={32} />}
            title="About DidactAI"
            description="Learn how DidactAI uses AI and NLP to transform reading into measurable learning."
            link="/about"
          />
        </div>
      </div>
    </div>
  );
};

interface CardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
}

const FeatureCard: React.FC<CardProps> = ({
  title,
  description,
  icon,
  link,
}) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(link)}
      className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200
      hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
    >
      <div className="text-indigo-600 mb-4">{icon}</div>

      <h3 className="text-xl font-semibold mb-3">{title}</h3>

      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>

      <span className="mt-5 text-indigo-600 font-semibold text-sm hover:underline inline-block">
        Explore →
      </span>
    </div>
  );
};

export default Dashboard;
