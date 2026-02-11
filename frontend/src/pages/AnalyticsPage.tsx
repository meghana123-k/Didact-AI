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

  // Insights are now computed server-side in /api/analytics

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


  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">
            Analyzing Performance Patterns...
          </p>
        </div>
      </div>
    );
  }

  if (!data || !data.accuracyTrend || data.accuracyTrend.length === 0) {
    return (
      <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-chart-pie text-3xl text-slate-300"></i>
        </div>
        <h2 className="text-2xl font-bold text-slate-700">Insights Pending</h2>
        <p className="text-slate-500 mt-2 px-10">
          You need at least one mastery quiz attempt to unlock your personalized
          learning analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">
            Learning Insights
          </h1>
          <p className="text-slate-500 font-medium">
            Deep data analysis for {user.name}
          </p>
          <div className="mt-4">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white shadow-sm"
            >
              <option value="">All Topics</option>
              {data?.availableTopics?.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Integrity Rank
            </p>
            <p
              className={`text-sm font-bold ${data.integrityReport.suspiciousAttempts > 0 ? "text-amber-500" : "text-emerald-500"}`}
            >
              {data.integrityReport.suspiciousAttempts > 0
                ? "Needs Attention"
                : "Verified Student"}
            </p>
          </div>
          <div className="h-8 w-px bg-slate-100"></div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Violations
            </p>
            <p className="text-sm font-bold text-slate-700">
              {data.integrityReport.totalViolations}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <i className="fas fa-chart-line text-sm"></i>
              </div>
              Mastery Progression
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.accuracyTrend}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickMargin={10}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    domain={[0, 100]}
                    tickMargin={10}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Score"]}
                    labelFormatter={(label: string, payload: any[]) => {
                      if (payload && payload.length > 0) {
                        return `${payload[0].payload.topic} • ${label}`;
                      }
                      return label;
                    }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#2563eb"
                    fillOpacity={1}
                    fill="url(#colorScore)"
                    strokeWidth={4}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <i className="fas fa-signal text-sm"></i>
                </div>
                Difficulty Breakdown
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.difficultyBreakdown}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="difficulty"
                      stroke="#94a3b8"
                      fontSize={11}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value}%`,
                        "Average Score",
                      ]}
                      labelFormatter={(label: string) =>
                        `Difficulty • ${label.charAt(0).toUpperCase() + label.slice(1)}`
                      }
                      cursor={{ fill: "#f8fafc" }}
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      }}
                    />

                    <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                      {data.difficultyBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
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

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-sm"></i>
                </div>
                Concept Weaknesses
              </h3>
              <div className="space-y-4">
                {data.weakConcepts.map((concept, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-600">
                        {concept.concept}
                      </span>
                      <span className="text-xs font-bold text-red-500">
                        {concept.score.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${concept.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl shadow-indigo-100 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <i className="fas fa-magic text-6xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <i className="fas fa-sparkles"></i> AI Tutor Insights
            </h3>

            {data.aiInsights ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  {data.aiInsights.suggestions.map((tip, i) => (
                    <div
                      key={i}
                      className="flex gap-3 text-sm font-medium leading-relaxed"
                    >
                      <i className="fas fa-check-circle mt-1 opacity-60"></i>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-white/10">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-4">
                    Recommended Resources
                  </p>
                  <div className="space-y-2">
                    {data.weakConcepts.length > 0 && (
                      <button
                        onClick={() =>
                          fetchRecommendation(data.weakConcepts[0].concept)
                        }
                        className="w-full p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-sm font-bold"
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
                        className="block mt-4 p-3 bg-white/20 rounded-xl text-sm font-bold flex items-center justify-between"
                      >
                        <span>{resource.title}</span>
                        <i className="fas fa-external-link-alt text-[10px] opacity-60"></i>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm opacity-80">
                Complete at least one mastery quiz to unlock tutor insights.
              </p>
            )}
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center">
                <i className="fas fa-shield-halved text-sm"></i>
              </div>
              Integrity Dashboard
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                <span className="text-sm font-medium text-slate-600">
                  Tab Switched
                </span>
                <span className="font-black text-slate-800">
                  {data.integrityReport.tabSwitches}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                <span className="text-sm font-medium text-slate-600">
                  Window Blurs
                </span>
                <span className="font-black text-slate-800">
                  {data.integrityReport.windowBlurs}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium italic leading-relaxed">
                * High violation counts may lead to certificate suspension or
                mandatory re-evaluation by instructors.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
