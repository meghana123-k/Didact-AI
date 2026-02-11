import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { AnalyticsData, User } from "../types";
import api from "../services/api";

interface AnalyticsPageProps {
  user: User;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ user }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [resource, setResource] = useState<any | null>(null);
  const [loadingResource, setLoadingResource] = useState(false);

  useEffect(() => {
    fetchAnalytics(selectedTopic || undefined);
    setResource(null);
  }, [user.id, selectedTopic]);

  const fetchAnalytics = async (topicId?: string) => {
    try {
      setLoading(true);
      const url = topicId
        ? `/analytics/${user.id}?topic_id=${topicId}`
        : `/analytics/${user.id}`;
      const response = await api.get(url);
      setData(response.data);
    } catch (e) {
      console.error("Failed to fetch analytics", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendation = async (concept: string) => {
    try {
      setLoadingResource(true);
      const response = await api.get(
        `/analytics/recommendation/${concept}?topic_id=${selectedTopic}`,
      );
      setResource(response.data);
    } catch (err) {
      console.error("Recommendation failed", err);
    } finally {
      setLoadingResource(false);
    }
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-300">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Analyzing Performance Patterns...</p>
        </div>
      </div>
    );
  }

  /* ================= EMPTY STATE ================= */

  if (!data || !data.accuracyTrend || data.accuracyTrend.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-400">
        <div className="text-center max-w-lg">
          <h2 className="text-2xl font-semibold text-slate-200">
            Insights Pending
          </h2>
          <p className="mt-4">
            Complete at least one mastery quiz attempt to unlock learning
            analytics.
          </p>
        </div>
      </div>
    );
  }

  /* ================= MAIN UI ================= */

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 px-10 py-12 space-y-10">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">
          Learning Insights
        </h1>
        <p className="text-slate-400 mt-2">
          Deep academic performance analysis for {user.name}
        </p>

        <div className="mt-4 flex items-center gap-6">
          <span className="text-sm font-semibold">
            Overall Score:{" "}
            <span className="text-indigo-400">{data.overallScore}%</span>
          </span>

          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="px-4 py-2 rounded-xl bg-[#1e293b] border border-slate-700 text-sm"
          >
            <option value="">All Topics</option>
            {data.availableTopics?.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-8">
          {/* AREA CHART */}
          <div className="bg-[#1e293b] p-8 rounded-2xl border border-slate-700">
            <h3 className="font-semibold mb-6">Mastery Progression</h3>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.accuracyTrend}>
                  <CartesianGrid stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#6366f1"
                    fill="#6366f133"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DIFFICULTY */}
          <div className="bg-[#1e293b] p-8 rounded-2xl border border-slate-700">
            <h3 className="font-semibold mb-6">Difficulty Breakdown</h3>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.difficultyBreakdown}>
                  <CartesianGrid stroke="#334155" vertical={false} />
                  <XAxis dataKey="difficulty" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                    }}
                    labelStyle={{
                      color: "#94a3b8",
                    }}
                    itemStyle={{
                      color: "#e2e8f0",
                      fontWeight: 500,
                    }}
                    cursor={{ fill: "#1e293b" }}
                  />

                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {data.difficultyBreakdown.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.difficulty === "easy"
                            ? "#10b981"
                            : entry.difficulty === "medium"
                              ? "#f59e0b"
                              : "#ef4444"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* WEAK CONCEPTS */}
          <div className="bg-[#1e293b] p-8 rounded-2xl border border-slate-700">
            <h3 className="font-semibold mb-6">Concept Weaknesses</h3>

            {data.weakConcepts.length === 0 ? (
              <p className="text-emerald-400 font-medium">
                No significant weak concepts detected.
              </p>
            ) : (
              <div className="space-y-5">
                {data.weakConcepts.map((concept, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{concept.concept}</span>
                      <span className="text-red-400">
                        {concept.score.toFixed(0)}%
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-700 rounded-full">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${concept.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-8">
          {/* AI INSIGHTS */}
          <div className="bg-indigo-600 p-8 rounded-2xl text-white">
            <h3 className="text-xl font-semibold mb-6">AI Tutor Insights</h3>

            {data.aiInsights ? (
              <>
                <div className="space-y-3">
                  {data.aiInsights.suggestions.map((tip, i) => (
                    <p key={i} className="text-sm">
                      • {tip}
                    </p>
                  ))}
                </div>

                {data.weakConcepts.length > 0 && (
                  <button
                    onClick={() =>
                      fetchRecommendation(data.weakConcepts[0].concept)
                    }
                    className="mt-6 w-full p-3 bg-white/20 rounded-xl hover:bg-white/30 transition"
                  >
                    Get Smart Recommendation
                  </button>
                )}

                {loadingResource && (
                  <p className="text-xs mt-3 opacity-70">
                    Loading recommendation...
                  </p>
                )}

                {resource && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-4 p-3 bg-white/20 rounded-xl text-sm font-semibold"
                  >
                    {resource.title}
                  </a>
                )}
              </>
            ) : (
              <p className="text-sm opacity-80">
                Complete at least one mastery quiz to unlock AI insights.
              </p>
            )}
          </div>

          {/* INTEGRITY */}
          <div className="bg-[#1e293b] p-8 rounded-2xl border border-slate-700">
            <h3 className="font-semibold mb-6">Integrity Dashboard</h3>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Tab Switches</span>
                <span className="text-indigo-400">
                  {data.integrityReport.tabSwitches}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Window Blurs</span>
                <span className="text-indigo-400">
                  {data.integrityReport.windowBlurs}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Total Violations</span>
                <span className="text-red-400">
                  {data.integrityReport.totalViolations}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
