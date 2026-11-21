"use client";

import { useState, useMemo, useTransition } from "react";
import { PeerProfile } from "@/types/learner";
import { LearnerCard } from "./LearnerCard";
import { PeerProfileModal } from "./PeerProfileModal";
import { ExchangeModal } from "@/components/requests/ExchangeModal";
import { getLearnerPeers } from "@/lib/learners";
import {
  Search,
  X,
  Filter,
  Users,
  Sparkles,
  RefreshCw,
  AlertCircle,
  GraduationCap,
  BookOpen,
  UserPlus,
} from "lucide-react";

interface LearnersExplorerProps {
  initialPeers: PeerProfile[];
  currentUserId: string | null;
  currentUserSkillsOffered?: string[];
  initialError?: string;
  title?: string;
  description?: string;
  limit?: number;
  showViewAllLink?: boolean;
}

export function LearnersExplorer({
  initialPeers,
  currentUserId,
  currentUserSkillsOffered = [],
  initialError,
  title = "Discover Learner Peers",
  description = "Connect with peers offering the skills you want to learn, and share what you know.",
  limit,
  showViewAllLink = false,
}: LearnersExplorerProps) {
  const [peers, setPeers] = useState<PeerProfile[]>(initialPeers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError || null);
  const [activePeer, setActivePeer] = useState<PeerProfile | null>(null);
  const [exchangePeer, setExchangePeer] = useState<PeerProfile | null>(null);
  const [isPending, startTransition] = useTransition();

  // Extract all unique skills offered across peers with frequency counts
  const availableSkills = useMemo(() => {
    const counts: Record<string, number> = {};
    peers.forEach((peer) => {
      peer.skills_offered.forEach((skill) => {
        const trimmed = skill.trim();
        if (trimmed) {
          counts[trimmed] = (counts[trimmed] || 0) + 1;
        }
      });
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [peers]);

  // Client-side search and filtering
  const filteredPeers = useMemo(() => {
    return peers.filter((peer) => {
      // 1. Search Query filter (matches name, username, bio, skills offered)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = (peer.full_name || "").toLowerCase().includes(query);
        const matchesUsername = (peer.username || "").toLowerCase().includes(query);
        const matchesBio = (peer.bio || "").toLowerCase().includes(query);
        const matchesSkill = peer.skills_offered.some((s) => s.toLowerCase().includes(query));
        const matchesNeeded = peer.skills_needed.some((s) => s.toLowerCase().includes(query));

        if (!matchesName && !matchesUsername && !matchesBio && !matchesSkill && !matchesNeeded) {
          return false;
        }
      }

      // 2. Selected skill filter (matches skills_offered)
      if (selectedSkill) {
        const hasSkill = peer.skills_offered.some(
          (s) => s.toLowerCase() === selectedSkill.toLowerCase()
        );
        if (!hasSkill) return false;
      }

      return true;
    });
  }, [peers, searchQuery, selectedSkill]);

  const displayedPeers = limit ? filteredPeers.slice(0, limit) : filteredPeers;

  // Manual refresh action
  const handleRefresh = () => {
    startTransition(async () => {
      setError(null);
      const res = await getLearnerPeers();
      if (res.error) {
        setError(res.error);
      } else {
        setPeers(res.peers);
      }
    });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedSkill(null);
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
              {title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition shadow-2xs disabled:opacity-50"
            title="Refresh learner list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span>{isPending ? "Refreshing..." : "Refresh"}</span>
          </button>

          {showViewAllLink && (
            <a
              href="/learners"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900 transition"
            >
              <span>Explore All</span>
            </a>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start justify-between gap-3 text-xs text-red-700 dark:text-red-300">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Failed to load learner peers</p>
              <p className="text-[11px] opacity-90">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 text-xs font-semibold hover:bg-red-200 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search peers by name, @username, bio, or skills offered..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-slate-900 dark:text-white text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Popular Skills Pills */}
        {availableSkills.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Filter className="w-3 h-3 text-blue-500" />
              <span>Filter by Skills Offered:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedSkill(null)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedSkill === null
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                All Skills ({peers.length})
              </button>

              {availableSkills.slice(0, 10).map(({ name, count }) => {
                const isSelected = selectedSkill?.toLowerCase() === name.toLowerCase();
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedSkill(isSelected ? null : name)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? "bg-emerald-600 text-white shadow-2xs font-semibold"
                        : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                    }`}
                  >
                    <span>{name}</span>
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded-full ${
                        isSelected
                          ? "bg-emerald-800 text-white"
                          : "bg-emerald-200/60 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Filter Indicators */}
        {(searchQuery || selectedSkill) && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <span className="flex items-center gap-1">
              <span>Showing {filteredPeers.length} of {peers.length} peers</span>
              {selectedSkill && (
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  teaching &quot;{selectedSkill}&quot;
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isPending && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-750 rounded w-1/3" />
                </div>
              </div>
              <div className="h-10 bg-slate-100 dark:bg-slate-750 rounded-xl" />
              <div className="h-16 bg-slate-100 dark:bg-slate-750 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Learners Grid */}
      {!isPending && displayedPeers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedPeers.map((peer) => (
            <LearnerCard
              key={peer.id}
              peer={peer}
              onSelectPeer={(selected) => setActivePeer(selected)}
              onRequestExchange={(selected) => setExchangePeer(selected)}
            />
          ))}
        </div>
      )}

      {/* Empty State: No results matching filters */}
      {!isPending && peers.length > 0 && displayedPeers.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
            <Search className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              No matching learners found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No learners matched &quot;{searchQuery || selectedSkill}&quot;. Try adjusting your search query or selecting a different skill.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Empty State: No other peers registered yet */}
      {!isPending && peers.length === 0 && (
        <div className="bg-gradient-to-b from-brand-50/50 to-indigo-50/20 dark:from-slate-800/80 dark:to-slate-900 rounded-3xl border border-brand-200/80 dark:border-slate-700 p-8 sm:p-12 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center shadow-sm">
            <UserPlus className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              You&apos;re One of Our Pioneer Learners!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              As fellow learners join and publish their skill portfolios, they will appear right here for mutual skill discovery.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-500 transition shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Peer List</span>
            </button>
            <a
              href="/profile"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <span>Update Your Skills</span>
            </a>
          </div>
        </div>
      )}

      {/* Peer Profile Modal */}
      {activePeer && (
        <PeerProfileModal
          peer={activePeer}
          currentUserId={currentUserId}
          onClose={() => setActivePeer(null)}
          onRequestExchange={(selected) => setExchangePeer(selected)}
        />
      )}

      {/* Exchange Request Modal */}
      {exchangePeer && (
        <ExchangeModal
          peer={exchangePeer}
          currentUserSkillsOffered={currentUserSkillsOffered}
          isOpen={!!exchangePeer}
          onClose={() => setExchangePeer(null)}
        />
      )}
    </div>
  );
}

