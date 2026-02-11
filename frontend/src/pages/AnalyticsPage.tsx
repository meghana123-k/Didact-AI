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
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">
            Learning Insights
          </h1>
          <p className="text-slate-500 font-medium">
            Deep data analysis for {user.name}
          </p>

          {/* ✅ STEP 6 ADDED HERE */}
          <div className="mt-3 flex items-center gap-4">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
              Tier: {data.performanceTier}
            </span>
            <span className="text-sm font-semibold text-slate-600">
              Overall Score: {data.overallScore}%
            </span>
          </div>

          <div className="mt-4">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white shadow-sm"
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
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* AREA CHART */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6">
              Mastery Progression
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.accuracyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Score"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#2563eb"
                    fill="#93c5fd"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* WEAK CONCEPTS */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6">
              Concept Weaknesses
            </h3>

            {/* ✅ STEP 7 CLEAN EMPTY STATE */}
            {data.weakConcepts.length === 0 ? (
              <p className="text-sm text-emerald-600 font-semibold">
                No significant weak concepts detected. Strong conceptual
                clarity.
              </p>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
