"use client";

import React, { useState } from "react";
import {
  getAIProfileRecommendations,
  getAICourseAndSkillRecommendations,
  RecommendedPeerResult,
  SkillRecommendationResult,
} from "@/lib/ai/recommendations";
import { ExchangeModal } from "@/components/requests/ExchangeModal";
import { PeerProfileModal } from "@/components/learners/PeerProfileModal";
import { PeerProfile } from "@/types/learner";
import { useLumi } from "@/components/mascot/LumiContext";
import {
  Users,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  GraduationCap,
  Search,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface PeerRecommendationsViewProps {
  currentUserId: string | null;
  currentUserSkillsOffered?: string[];
  initialTab?: "peers" | "curriculum";
  initialQuery?: string;
}

export function PeerRecommendationsView({
  currentUserId,
  currentUserSkillsOffered = [],
  initialTab = "peers",
  initialQuery = "",
}: PeerRecommendationsViewProps) {
  const { triggerMode } = useLumi();
  const [activeSubTab, setActiveSubTab] = useState<"peers" | "curriculum">(initialTab);
  const [peerQuery, setPeerQuery] = useState(initialQuery || "");
  const [careerGoal, setCareerGoal] = useState("");
  const [userLevel, setUserLevel] = useState("beginner");

  const [isLoading, setIsLoading] = useState(false);
  const [peerRecommendations, setPeerRecommendations] = useState<RecommendedPeerResult[]>([]);
  const [curriculumSkills, setCurriculumSkills] = useState<SkillRecommendationResult[]>([]);
  const [explanationMessage, setExplanationMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [selectedExchangePeer, setSelectedExchangePeer] = useState<PeerProfile | null>(null);
  const [selectedProfilePeer, setSelectedProfilePeer] = useState<PeerProfile | null>(null);

  const handleSearchPeers = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!peerQuery.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setExplanationMessage(null);
    triggerMode("thinking", 5000, "Searching real LearnLync peers to match your learning goals...");

    const res = await getAIProfileRecommendations(peerQuery);
    setIsLoading(false);

    if (res.error) {
      setError(res.error);
      triggerMode("encouragement", 3500, "Couldn't complete peer search. Let's try again.");
    } else {
      setPeerRecommendations(res.recommendations);
      setExplanationMessage(res.message || null);
      triggerMode("explaining", 4000, "Found matching peer profiles on LearnLync!");
    }
  };

  const handleSearchCurriculum = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!careerGoal.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setExplanationMessage(null);
    triggerMode("thinking", 5000, "Designing your personalized peer-taught curriculum...");

    const res = await getAICourseAndSkillRecommendations(careerGoal, userLevel);
    setIsLoading(false);

    if (res.error) {
      setError(res.error);
      triggerMode("encouragement", 3500, "Couldn't generate curriculum recommendations. Let's try again.");
    } else {
      setCurriculumSkills(res.skills);
      setExplanationMessage(res.explanation);
      triggerMode("explaining", 4000, "Curriculum ready! Matched with registered LearnLync teachers.");
    }
  };

  const toPeerProfile = (peer: any): PeerProfile => ({
    id: peer.id,
    full_name: peer.full_name,
    username: peer.username,
    avatar_url: peer.avatar_url,
    bio: peer.bio,
    skills_offered: peer.skills_offered || [],
    skills_needed: peer.skills_needed || [],
    created_at: new Date().toISOString(),
    nexconnUserId: peer.id.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
  });

  return (
    <div className="space-y-6">
      {/* Subtab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveSubTab("peers")}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition ${
              activeSubTab === "peers"
                ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>AI Profile Recommendations</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("curriculum")}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition ${
              activeSubTab === "curriculum"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>AI Peer Curriculum (Zero External Courses)</span>
          </button>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>100% Verified LearnLync Users</span>
        </div>
      </div>

      {/* Mode 1: AI Profile Recommendations */}
      {activeSubTab === "peers" && (
        <div className="space-y-6">
          {/* Search Form */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent-amber" />
                <span>Search Peers by Learning Requirements</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Describe the skill you want to learn, your background, or requirements. AI will evaluate actual LearnLync profiles and rank matches based on reciprocal skill compatibility.
              </p>
            </div>

            <form onSubmit={handleSearchPeers} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={peerQuery}
                  onChange={(e) => setPeerQuery(e.target.value)}
                  placeholder="e.g. 'I want someone to teach me PyTorch or Machine Learning in exchange for React'"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !peerQuery.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 transition shadow-md disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isLoading ? "Matching..." : "Find AI Matches"}</span>
              </button>
            </form>
          </div>

          {/* Results Stream */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {explanationMessage && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 text-xs border border-indigo-200/80 dark:border-indigo-800/60 leading-relaxed">
              <strong>AI Analysis:</strong> {explanationMessage}
            </div>
          )}

          {peerRecommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {peerRecommendations.map((peer) => (
                <div
                  key={peer.id}
                  className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {peer.avatar_url ? (
                          <img
                            src={peer.avatar_url}
                            alt={peer.full_name}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                            {peer.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                            {peer.full_name}
                          </h4>
                          <p className="text-xs font-mono text-slate-400">@{peer.username}</p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        {peer.compatibility_score}% Match
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {peer.bio}
                    </p>

                    {/* AI Match Reason Banner */}
                    <div className="p-3 rounded-2xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800/40 text-xs text-brand-900 dark:text-brand-200 space-y-1">
                      <p className="font-bold text-[11px] uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-accent-amber" />
                        <span>Why Recommended</span>
                      </p>
                      <p className="leading-relaxed">{peer.match_reason}</p>
                    </div>

                    {/* Skills Breakdown */}
                    <div className="space-y-2 pt-1 text-xs">
                      <div>
                        <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider block mb-1">
                          Offers:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {peer.skills_offered.map((s, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium text-[11px]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider block mb-1">
                          Needs:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {peer.skills_needed.map((s, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium text-[11px]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSelectedProfilePeer(toPeerProfile(peer))}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition text-center"
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedExchangePeer(toPeerProfile(peer))}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 transition shadow-sm text-center"
                    >
                      Send Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: AI Peer Curriculum (Zero External Courses) */}
      {activeSubTab === "curriculum" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-600" />
                <span>Personalized Peer Learning Curriculum</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Describe your desired career or project goal. AI will structure the required skills in the correct learning sequence and match each skill <strong className="text-brand-600">exclusively to registered LearnLync teachers</strong>. No external courses will ever be recommended.
              </p>
            </div>

            <form onSubmit={handleSearchCurriculum} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  placeholder="e.g. 'I want to become a Cloud DevOps & Kubernetes specialist'"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={userLevel}
                  onChange={(e) => setUserLevel(e.target.value)}
                  className="px-3 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>

                <button
                  type="submit"
                  disabled={isLoading || !careerGoal.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 transition shadow-md disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Build Curriculum</span>
                </button>
              </div>
            </form>
          </div>

          {explanationMessage && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 text-xs border border-indigo-200/80 dark:border-indigo-800/60 leading-relaxed">
              <strong>Learning Strategy:</strong> {explanationMessage}
            </div>
          )}

          {curriculumSkills.length > 0 && (
            <div className="space-y-4">
              {curriculumSkills.map((step, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                        #{step.learning_order}
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {step.skill}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{step.reason}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Practical Applications:
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {step.applications}
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Career & Project Impact:
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {step.career_impact}
                      </p>
                    </div>
                  </div>

                  {/* Registered LearnLync Peer Teachers */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Registered LearnLync Teachers for {step.skill}:
                    </span>

                    {step.available_teachers.length === 0 ? (
                      <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
                        No matching LearnLync peer teacher is currently registered for this skill. Consider posting an exchange request in the community to find a learner learning it.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {step.available_teachers.map((teacher) => (
                          <div
                            key={teacher.id}
                            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {teacher.avatar_url ? (
                                <img
                                  src={teacher.avatar_url}
                                  alt={teacher.full_name}
                                  className="w-8 h-8 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                  {teacher.full_name.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {teacher.full_name}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  @{teacher.username}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedExchangePeer(toPeerProfile(teacher))}
                              className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-white bg-brand-600 hover:bg-brand-500 transition shrink-0"
                            >
                              Request
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Exchange Request Modal */}
      {selectedExchangePeer && (
        <ExchangeModal
          peer={selectedExchangePeer}
          currentUserSkillsOffered={currentUserSkillsOffered}
          isOpen={true}
          onClose={() => setSelectedExchangePeer(null)}
          onSuccess={() => setSelectedExchangePeer(null)}
        />
      )}

      {/* Peer Profile Modal */}
      {selectedProfilePeer && (
        <PeerProfileModal
          peer={selectedProfilePeer}
          currentUserId={currentUserId}
          onClose={() => setSelectedProfilePeer(null)}
          onRequestExchange={(p) => {
            setSelectedProfilePeer(null);
            setSelectedExchangePeer(p);
          }}
        />
      )}
    </div>
  );
}
