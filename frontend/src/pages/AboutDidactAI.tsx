import React from "react";
import { Brain, BookOpen, BarChart3, Award, Upload, Cpu } from "lucide-react";

const AboutDidactAI: React.FC = () => {
  return (
    <div className="bg-gray-50 text-gray-800">
      {/* HERO */}

      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-24 px-8 text-center">
        <h1 className="text-5xl font-bold mb-6">DidactAI</h1>

        <p className="max-w-3xl mx-auto text-lg text-indigo-100">
          DidactAI is an intelligent learning assistant that combines Natural
          Language Processing and Machine Learning to convert complex academic
          material into structured summaries, adaptive quizzes, and measurable
          learning insights.
        </p>
      </section>

      {/* PROJECT OVERVIEW */}

      <section className="max-w-5xl mx-auto px-8 py-20">
        <h2 className="text-3xl font-bold mb-6">Project Overview</h2>

        <p className="text-gray-600 leading-relaxed">
          Students often read large amounts of study material but struggle to
          measure whether they truly understand it. Traditional tools either
          summarize content or provide quizzes, but rarely combine both with
          learning analytics.
        </p>

        <p className="text-gray-600 leading-relaxed mt-4">
          DidactAI bridges this gap by building a complete AI-powered learning
          pipeline. The system processes textual learning content, generates
          multi-level summaries, produces adaptive quizzes, and evaluates
          learning performance using analytics and AI-based insights.
        </p>
      </section>

      {/* WORKFLOW */}

      <section className="bg-white py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-14">
            Learning Pipeline
          </h2>

          <div className="grid md:grid-cols-5 gap-8 text-center">
            <Workflow icon={<Upload />} title="Upload Topic" />

            <Workflow icon={<BookOpen />} title="AI Summaries" />

            <Workflow icon={<Brain />} title="Adaptive Quiz" />

            <Workflow icon={<BarChart3 />} title="Learning Analytics" />

            <Workflow icon={<Award />} title="Certificate" />
          </div>
        </div>
      </section>

      {/* MODULES */}

      <section className="max-w-6xl mx-auto px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-14">
          Core System Modules
        </h2>

        <div className="grid md:grid-cols-2 gap-10">
          <ModuleCard
            icon={<BookOpen />}
            title="Smart Summaries"
            desc="DidactAI generates three levels of summaries: Basic (key points), Detailed (context-rich explanations), and Conceptual (concept extraction using NLP techniques such as Named Entity Recognition and dependency parsing)."
          />

          <ModuleCard
            icon={<Brain />}
            title="Adaptive Assessments"
            desc="The system automatically generates quizzes with beginner, intermediate, and advanced questions. This allows students to test understanding across multiple cognitive levels."
          />

          <ModuleCard
            icon={<BarChart3 />}
            title="Learning Analytics"
            desc="Performance data is analyzed to track concept mastery, quiz accuracy, and improvement trends over time, enabling measurable learning insights."
          />

          <ModuleCard
            icon={<Cpu />}
            title="Integrity Monitoring"
            desc="The system monitors behavioral signals such as rapid answering patterns or tab switching during quizzes to detect suspicious activity."
          />

          <ModuleCard
            icon={<Award />}
            title="Certification"
            desc="Students who achieve mastery thresholds receive automatically generated digital certificates verifying their learning progress."
          />
        </div>
      </section>

      {/* AI ARCHITECTURE */}

      <section className="bg-white py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center">
            System Architecture
          </h2>

          <div className="grid md:grid-cols-4 gap-6 text-center">
            <ArchitectureBox title="Frontend" desc="React + Tailwind UI" />

            <ArchitectureBox title="Backend" desc="Flask API Services" />

            <ArchitectureBox
              title="AI Processing"
              desc="HuggingFace Transformers, NLP Models"
            />

            <ArchitectureBox title="Database" desc="PostgreSQL Learning Data" />
          </div>
        </div>
      </section>

      {/* EVALUATION */}

      <section className="max-w-5xl mx-auto px-8 py-20">
        <h2 className="text-3xl font-bold mb-6">Learning Evaluation</h2>

        <p className="text-gray-600 leading-relaxed">
          DidactAI evaluates learning effectiveness using both NLP metrics and
          educational performance metrics.
        </p>

        <ul className="mt-6 space-y-3 text-gray-700 list-disc ml-6">
          <li>ROUGE-1 and ROUGE-L metrics to evaluate summary quality</li>
          <li>Quiz accuracy measured across difficulty levels</li>
          <li>Concept-level learning performance tracking</li>
          <li>Learning improvement percentage over multiple attempts</li>
        </ul>
      </section>

      {/* FUTURE WORK */}

      <section className="bg-indigo-50 py-20 px-8 text-center">
        <h2 className="text-3xl font-bold mb-6">Future Improvements</h2>

        <div className="max-w-3xl mx-auto text-gray-700">
          <p>
            Future versions of DidactAI will introduce personalized learning
            recommendations, interactive concept visualization, and AI tutoring
            assistance that dynamically guides students through complex topics.
          </p>
        </div>
      </section>
    </div>
  );
};

/* WORKFLOW CARD */

const Workflow: React.FC<{ icon: React.ReactNode; title: string }> = ({
  icon,
  title,
}) => (
  <div className="p-6 border rounded-xl bg-gray-50 hover:shadow-md transition">
    <div className="flex justify-center text-indigo-600 mb-3">{icon}</div>
    <p className="font-medium">{title}</p>
  </div>
);

/* MODULE CARD */

interface ModuleProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
}

const ModuleCard: React.FC<ModuleProps> = ({ title, desc, icon }) => (
  <div className="p-8 bg-white border rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition">
    <div className="text-indigo-600 mb-4">{icon}</div>

    <h3 className="text-xl font-semibold mb-3">{title}</h3>

    <p className="text-gray-600 leading-relaxed">{desc}</p>
  </div>
);

/* ARCHITECTURE CARD */

const ArchitectureBox: React.FC<{ title: string; desc: string }> = ({
  title,
  desc,
}) => (
  <div className="p-6 border rounded-xl bg-gray-50 hover:shadow-md transition">
    <p className="font-semibold">{title}</p>
    <p className="text-sm text-gray-600 mt-1">{desc}</p>
  </div>
);

export default AboutDidactAI;
