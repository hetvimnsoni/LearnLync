"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { PeerProfile, PeerConnectionStatus } from "@/types/learner";
import { createClient } from "@/lib/supabase/client";
import { Earth3DScene } from "./Earth3DScene";
import { LearnerCard } from "./LearnerCard";
import { PeerProfileModal } from "./PeerProfileModal";
import { ExchangeModal } from "@/components/requests/ExchangeModal";
import { KNOWN_CITIES, getSkillIcon } from "@/lib/geo";
import {
  Search,
  Globe2,
  Users,
  Sparkles,
  MapPin,
  X,
  Compass,
  ArrowRight,
  BookOpen,
  GraduationCap,
  MessageSquare,
  ArrowLeftRight,
  Filter,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  RotateCcw,
  Clock,
} from "lucide-react";

interface LearnersMapExplorerProps {
  initialPeers: PeerProfile[];
  currentUserId: string | null;
  currentUserSkillsOffered?: string[];
  initialConnections?: Record<string, PeerConnectionStatus>;
  initialError?: string;
}

const CATEGORY_SHORTCUTS = [
  { id: "tech", label: "Tech", icon: "💻" },
  { id: "design", label: "Design", icon: "🎨" },
  { id: "music", label: "Music", icon: "🎵" },
  { id: "languages", label: "Languages", icon: "🗣️" },
  { id: "photography", label: "Photography", icon: "📸" },
];

function matchCategory(skills: string[], categoryId: string): boolean {
  if (categoryId === "all") return true;
  return skills.some((s) => {
    const lower = s.toLowerCase();
    if (categoryId === "tech") {
      return (
        lower.includes("code") ||
        lower.includes("program") ||
        lower.includes("develop") ||
        lower.includes("web") ||
        lower.includes("software") ||
        lower.includes("python") ||
        lower.includes("javascript") ||
        lower.includes("typescript") ||
        lower.includes("react") ||
        lower.includes("next") ||
        lower.includes("node") ||
        lower.includes("ai") ||
        lower.includes("ml") ||
        lower.includes("data") ||
        lower.includes("cloud") ||
        lower.includes("devops") ||
        lower.includes("backend") ||
        lower.includes("frontend") ||
        lower.includes("fullstack")
      );
    }
    if (categoryId === "design") {
      return (
        lower.includes("design") ||
        lower.includes("ui") ||
        lower.includes("ux") ||
        lower.includes("figma") ||
        lower.includes("illustrator") ||
        lower.includes("photoshop") ||
        lower.includes("3d") ||
        lower.includes("blender") ||
        lower.includes("graphic") ||
        lower.includes("brand") ||
        lower.includes("logo")
      );
    }
    if (categoryId === "music") {
      return (
        lower.includes("music") ||
        lower.includes("guitar") ||
        lower.includes("piano") ||
        lower.includes("audio") ||
        lower.includes("sound") ||
        lower.includes("sing") ||
        lower.includes("beat") ||
        lower.includes("production")
      );
    }
    if (categoryId === "languages") {
      return (
        lower.includes("language") ||
        lower.includes("spanish") ||
        lower.includes("french") ||
        lower.includes("german") ||
        lower.includes("japanese") ||
        lower.includes("english") ||
        lower.includes("italian") ||
        lower.includes("mandarin") ||
        lower.includes("korean") ||
        lower.includes("chinese") ||
        lower.includes("arabic")
      );
    }
    if (categoryId === "photography") {
      return (
        lower.includes("photo") ||
        lower.includes("camera") ||
        lower.includes("video") ||
        lower.includes("lightroom") ||
        lower.includes("film") ||
        lower.includes("portrait") ||
        lower.includes("cinematography")
      );
    }
    return false;
  });
}

export function LearnersMapExplorer({
  initialPeers,
  currentUserId,
  currentUserSkillsOffered = [],
  initialConnections = {},
  initialError,
}: LearnersMapExplorerProps) {
  const [peers] = useState<PeerProfile[]>(initialPeers);
  const [connections, setConnections] = useState<Record<string, PeerConnectionStatus>>(
    initialConnections
  );
  const [connectionFilter, setConnectionFilter] = useState<"all" | "connected" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedOfferedSkill, setSelectedOfferedSkill] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSkillFilterOpen, setIsSkillFilterOpen] = useState(false);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");

  // Realtime listener: auto-sync connections when exchanges are accepted or requested
  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();
    const channelName = `learners-conn-sync-${currentUserId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "skill_exchanges",
        },
        (payload: any) => {
          const row = payload.new || payload.old;
          if (!row) return;

          const peerId = row.sender_id === currentUserId ? row.receiver_id : row.sender_id;
          if (!peerId) return;

          setConnections((prev) => {
            const next = { ...prev };
            if (payload.eventType === "DELETE" || row.status === "rejected" || row.status === "cancelled") {
              delete next[peerId];
            } else if (row.status === "accepted" || row.status === "completed") {
              next[peerId] = "connected";
            } else if (row.status === "pending") {
              if (next[peerId] !== "connected") {
                next[peerId] = "pending";
              }
            }
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const getStatus = (id?: string | null): PeerConnectionStatus => {
    if (!id) return "none";
    return connections[id] || connections[id.toLowerCase()] || "none";
  };

  const connectedCount = useMemo(() => {
    return peers.filter((p) => getStatus(p.id) === "connected").length;
  }, [peers, connections]);

  const pendingCount = useMemo(() => {
    return peers.filter((p) => getStatus(p.id) === "pending").length;
  }, [peers, connections]);

  // Default to first active peer so floating card is populated immediately matching reference
  const [activePeer, setActivePeer] = useState<PeerProfile | null>(
    initialPeers.length > 0 ? initialPeers[0] : null
  );
  const [isProfileCardOpen, setIsProfileCardOpen] = useState(true);
  const [exchangePeer, setExchangePeer] = useState<PeerProfile | null>(null);
  const [detailedModalPeer, setDetailedModalPeer] = useState<PeerProfile | null>(null);
  const [targetLocation, setTargetLocation] = useState<{ lat: number; lon: number } | null>(null);

  const filterPopoverRef = useRef<HTMLDivElement>(null);

  // Close filter popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target as Node)) {
        setIsSkillFilterOpen(false);
      }
    }
    if (isSkillFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSkillFilterOpen]);

  // Extract unique countries from real peers for country filter
  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    peers.forEach((p) => {
      if (p.country && p.country.trim()) set.add(p.country.trim());
    });
    return Array.from(set).sort();
  }, [peers]);

  // Extract all unique offered skills from real peers
  const allUniqueOfferedSkills = useMemo(() => {
    const counts: Record<string, number> = {};
    peers.forEach((p) => {
      p.skills_offered.forEach((s) => {
        const trimmed = s.trim();
        if (trimmed) counts[trimmed] = (counts[trimmed] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [peers]);

  // Filter skills for the popover search
  const filteredSkillsForPopover = useMemo(() => {
    if (!skillSearchQuery.trim()) return allUniqueOfferedSkills;
    const q = skillSearchQuery.toLowerCase().trim();
    return allUniqueOfferedSkills.filter((s) => s.toLowerCase().includes(q));
  }, [allUniqueOfferedSkills, skillSearchQuery]);

  // Filtered peers based on active search, country filter, skill filter, and category shortcuts
  const filteredPeers = useMemo(() => {
    return peers.filter((peer) => {
      // 1. Keyword search (Name, username, bio, city, country, skills offered, skills needed)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (peer.full_name || "").toLowerCase().includes(q);
        const matchesUsername = (peer.username || "").toLowerCase().includes(q);
        const matchesBio = (peer.bio || "").toLowerCase().includes(q);
        const matchesCity = (peer.city || "").toLowerCase().includes(q);
        const matchesCountry = (peer.country || "").toLowerCase().includes(q);
        const matchesOfferedSkill = peer.skills_offered.some((s) => s.toLowerCase().includes(q));
        const matchesNeededSkill = peer.skills_needed.some((s) => s.toLowerCase().includes(q));

        if (
          !matchesName &&
          !matchesUsername &&
          !matchesBio &&
          !matchesCity &&
          !matchesCountry &&
          !matchesOfferedSkill &&
          !matchesNeededSkill
        ) {
          return false;
        }
      }

      // 2. Country / Location filter
      if (selectedCountry && selectedCountry !== "all") {
        if (!peer.country || peer.country.toLowerCase() !== selectedCountry.toLowerCase()) {
          return false;
        }
      }

      // 3. Specific skill filter
      if (selectedOfferedSkill) {
        const hasSkill = peer.skills_offered.some(
          (s) => s.toLowerCase() === selectedOfferedSkill.toLowerCase()
        );
        if (!hasSkill) return false;
      }

      // 4. Category shortcut (Tech, Design, Music, Languages, Photography)
      if (selectedCategory !== "all") {
        if (!matchCategory(peer.skills_offered, selectedCategory)) {
          return false;
        }
      }

      // 5. Connection status filter (All / Connected / Pending)
      if (connectionFilter === "connected" && getStatus(peer.id) !== "connected") {
        return false;
      }
      if (connectionFilter === "pending" && getStatus(peer.id) !== "pending") {
        return false;
      }

      return true;
    });
  }, [peers, searchQuery, selectedCountry, selectedOfferedSkill, selectedCategory, connectionFilter, connections]);

  // When filtered peers change, if active peer is no longer in list, pick the first filtered peer
  useEffect(() => {
    if (filteredPeers.length > 0) {
      if (!activePeer || !filteredPeers.some((p) => p.id === activePeer.id)) {
        setActivePeer(filteredPeers[0]);
      }
    }
  }, [filteredPeers, activePeer]);

  // Real statistics calculated directly from real data
  const representedCountriesCount = useMemo(() => {
    const set = new Set<string>();
    filteredPeers.forEach((p) => {
      if (p.country) set.add(p.country);
    });
    return set.size;
  }, [filteredPeers]);

  const representedCategoriesCount = useMemo(() => {
    const set = new Set<string>();
    filteredPeers.forEach((p) => {
      p.skills_offered.forEach((s) => {
        const { category } = getSkillIcon(s);
        set.add(category);
      });
    });
    return set.size;
  }, [filteredPeers]);

  const handleSelectPeerOnMap = (peer: PeerProfile) => {
    setActivePeer(peer);
    setIsProfileCardOpen(true);
    if (typeof peer.latitude === "number" && typeof peer.longitude === "number") {
      setTargetLocation({ lat: peer.latitude, lon: peer.longitude });
    }
  };

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    if (country && country !== "all") {
      // Find a peer in that country and smoothly rotate Earth to that region
      const match = peers.find(
        (p) => p.country && p.country.toLowerCase() === country.toLowerCase()
      );
      if (match && typeof match.latitude === "number" && typeof match.longitude === "number") {
        setTargetLocation({ lat: match.latitude, lon: match.longitude });
        setActivePeer(match);
        setIsProfileCardOpen(true);
      }
    }
  };

  const handleNextPeer = () => {
    if (filteredPeers.length <= 1 || !activePeer) return;
    const currentIndex = filteredPeers.findIndex((p) => p.id === activePeer.id);
    const nextIndex = (currentIndex + 1) % filteredPeers.length;
    handleSelectPeerOnMap(filteredPeers[nextIndex]);
  };

  const handlePrevPeer = () => {
    if (filteredPeers.length <= 1 || !activePeer) return;
    const currentIndex = filteredPeers.findIndex((p) => p.id === activePeer.id);
    const prevIndex = (currentIndex - 1 + filteredPeers.length) % filteredPeers.length;
    handleSelectPeerOnMap(filteredPeers[prevIndex]);
  };

  const toggleCategory = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory("all");
    } else {
      setSelectedCategory(categoryId);
    }
  };

  const resetAllFilters = () => {
    setSearchQuery("");
    setSelectedCountry("all");
    setSelectedOfferedSkill(null);
    setSelectedCategory("all");
    setConnectionFilter("all");
    setSkillSearchQuery("");
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    (selectedCountry && selectedCountry !== "all") ||
    selectedOfferedSkill ||
    selectedCategory !== "all" ||
    connectionFilter !== "all"
  );

  return (
    <div className="space-y-8">
      {/* ========================================================================= */}
      {/* 1. BALANCED DISCOVERY CONTROLS ROW (Heading on Left, Big Search on Right) */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
        {/* LEFT SIDE: Heading, Description, Statistics & Compact Category Filters */}
        <div className="space-y-4 max-w-xl">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Find Peers
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
              A global community of learners, connect, learn and grow together.
            </p>
          </div>

          {/* Connection Status Filter Segmented Control (All / Connected / Pending) */}
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-purple-200/60 dark:border-white/10 backdrop-blur-xl shadow-xs text-xs font-bold flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setConnectionFilter("all")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                connectionFilter === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Peers ({peers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setConnectionFilter("connected")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                connectionFilter === "connected"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Connected ({connectedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setConnectionFilter("pending")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                connectionFilter === "pending"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Pending ({pendingCount})</span>
            </button>
          </div>

          {/* Real Dynamic Statistics Chips */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-purple-200/60 dark:border-white/10 text-slate-800 dark:text-white shadow-xs">
              <Users className="w-3.5 h-3.5 text-brand-600 dark:text-purple-400" />
              <span className="text-xs font-bold">
                {filteredPeers.length} {filteredPeers.length === 1 ? "Learner" : "Learners"}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-purple-200/60 dark:border-white/10 text-slate-800 dark:text-white shadow-xs">
              <Globe2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold">
                {representedCountriesCount} {representedCountriesCount === 1 ? "Country" : "Countries"}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-purple-200/60 dark:border-white/10 text-slate-800 dark:text-white shadow-xs">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold">
                {representedCategoriesCount} Categories
              </span>
            </div>
          </div>

          {/* Compact Category Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {CATEGORY_SHORTCUTS.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition backdrop-blur-md border ${
                    isActive
                      ? "bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-purple-600 dark:to-indigo-600 text-white border-transparent shadow-md shadow-brand-500/25 ring-2 ring-brand-500/30"
                      : "bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/80 border-slate-200/80 dark:border-white/10 shadow-2xs"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-800/40 transition shadow-2xs ml-1"
                title="Reset all filters"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: Large Prominent Search Bar & Location / Filter Controls */}
        <div className="w-full lg:w-auto lg:min-w-[420px] xl:min-w-[500px] max-w-xl space-y-3">
          {/* Prominent Wide Search Bar (Requirement 1) */}
          <div className="relative group/search">
            <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-brand-500 dark:text-purple-400 transition-transform group-focus-within/search:scale-110" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search learners, skills or interests..."
              className="w-full h-14 pl-12 pr-11 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-purple-200/80 dark:border-white/15 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm sm:text-base font-medium shadow-lg shadow-purple-500/5 dark:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-purple-500/40 focus:border-brand-400 dark:focus:border-purple-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                title="Clear search"
              >
                <div className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-4 h-4" />
                </div>
              </button>
            )}
          </div>

          {/* Supporting Filter Controls: Location Dropdown & Skill Filter Picker */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Country / Location Filter Dropdown */}
            <div className="relative flex-1 min-w-[160px]">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <MapPin className="w-4 h-4 text-brand-500 dark:text-purple-400" />
              </div>
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full h-11 pl-9 pr-8 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-purple-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 appearance-none cursor-pointer transition hover:bg-white dark:hover:bg-slate-800"
              >
                <option value="all">All Locations</option>
                {availableCountries.map((country) => (
                  <option key={country} value={country}>
                    📍 {country}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Filter by Skill Popover Button */}
            <div className="relative" ref={filterPopoverRef}>
              <button
                type="button"
                onClick={() => setIsSkillFilterOpen(!isSkillFilterOpen)}
                className={`h-11 inline-flex items-center gap-2 px-3.5 rounded-2xl text-xs sm:text-sm font-semibold transition backdrop-blur-xl shadow-sm border ${
                  selectedOfferedSkill
                    ? "bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-purple-600 dark:to-indigo-600 text-white border-transparent ring-2 ring-brand-500/40"
                    : "bg-white/85 dark:bg-slate-900/85 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border-purple-200/80 dark:border-white/10"
                }`}
              >
                <Filter className="w-4 h-4 text-brand-500 dark:text-purple-400 shrink-0" />
                <span className="truncate max-w-[130px]">
                  {selectedOfferedSkill ? selectedOfferedSkill : "All Skills"}
                </span>
                {selectedOfferedSkill ? (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOfferedSkill(null);
                    }}
                    className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-purple-700 text-white"
                    title="Clear skill filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
              </button>

              {/* Skill Filter Popover Dropdown */}
              {isSkillFilterOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 max-h-72 overflow-y-auto rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/15 shadow-2xl p-4 z-40 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-brand-600 dark:text-purple-400" />
                      <span>Select Skill to Filter</span>
                    </span>
                    {selectedOfferedSkill && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOfferedSkill(null);
                          setIsSkillFilterOpen(false);
                        }}
                        className="text-[11px] text-brand-600 dark:text-purple-400 hover:underline font-semibold"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Search inside skills */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={skillSearchQuery}
                      onChange={(e) => setSkillSearchQuery(e.target.value)}
                      placeholder="Search available skills..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-purple-500"
                    />
                  </div>

                  {/* Skill options */}
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto no-scrollbar pt-1">
                    {filteredSkillsForPopover.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">No matching skills found</p>
                    ) : (
                      filteredSkillsForPopover.map((skill) => {
                        const isSelected = selectedOfferedSkill?.toLowerCase() === skill.toLowerCase();
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => {
                              setSelectedOfferedSkill(isSelected ? null : skill);
                              setIsSkillFilterOpen(false);
                            }}
                            className={`px-2.5 py-1 rounded-xl text-xs font-medium transition ${
                              isSelected
                                ? "bg-brand-600 dark:bg-purple-600 text-white shadow-sm"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                            }`}
                          >
                            {skill}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="h-11 inline-flex items-center gap-1.5 px-3 rounded-2xl text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200/80 dark:border-red-800/40 transition shadow-xs shrink-0"
                title="Reset all search & filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE 3D EARTH HERO STAGE (Main Central Attraction — 100% Preserved)     */}
      {/* ========================================================================= */}
      <div className="relative group">
        {/* Ambient atmospheric aura & glow BEHIND the Earth container (Requirement 3 & 4) */}
        <div className="absolute -inset-1.5 sm:-inset-2 rounded-[2.5rem] bg-gradient-to-r from-purple-400/25 via-indigo-400/20 to-teal-300/18 blur-2xl opacity-75 dark:opacity-40 pointer-events-none transition-opacity duration-500" />

        <Earth3DScene
          peers={filteredPeers}
          onSelectPeer={handleSelectPeerOnMap}
          selectedPeerId={activePeer?.id}
          targetLocation={targetLocation}
          connections={connections}
        >
          {/* FLOATING LEARNER PROFILE CARD (Smooth Responsive Overlay When Selected) */}
          {activePeer && isProfileCardOpen && (
            <div className="pointer-events-auto absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-auto sm:w-88 max-w-full sm:max-w-sm z-20 rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-purple-200/80 dark:border-white/10 shadow-2xl p-4 sm:p-5 text-slate-900 dark:text-white space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
              {/* Header: Photo, Name, Username, Location, Navigation & Close Button */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {activePeer.avatar_url ? (
                    <img
                      src={activePeer.avatar_url}
                      alt={activePeer.full_name || "Learner avatar"}
                      className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl object-cover border-2 border-brand-500/60 dark:border-purple-500/60 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md shrink-0">
                      {(activePeer.full_name || activePeer.username || "L").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-extrabold text-xs sm:text-base text-slate-900 dark:text-white truncate">
                        {activePeer.full_name}
                      </h3>
                      {getStatus(activePeer.id) === "connected" && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shrink-0 shadow-xs">
                          <Check className="w-2.5 h-2.5" />
                          Connected
                        </span>
                      )}
                      {getStatus(activePeer.id) === "pending" && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shrink-0 shadow-xs">
                          <Clock className="w-2.5 h-2.5" />
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs font-mono text-brand-600 dark:text-purple-300/80 truncate">@{activePeer.username}</p>
                    {activePeer.city && (
                      <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5 font-medium truncate">
                        <MapPin className="w-3 h-3 text-brand-500 dark:text-purple-400 shrink-0" />
                        <span>
                          {activePeer.city}{activePeer.country ? `, ${activePeer.country}` : ""}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {filteredPeers.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevPeer}
                        className="p-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                        title="Previous peer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextPeer}
                        className="p-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                        title="Next peer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsProfileCardOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition ml-0.5"
                    title="Dismiss card"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bio snippet */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                {activePeer.bio || "Active learner on LearnLync ready for reciprocal skill exchange."}
              </p>

              {/* Skills Offered */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  <GraduationCap className="w-3 h-3" />
                  <span>Skills Offered</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {activePeer.skills_offered.length > 0 ? (
                    activePeer.skills_offered.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                      >
                        ✓ {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No skills listed</span>
                  )}
                </div>
              </div>

              {/* Skills Wanted */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-purple-400">
                  <BookOpen className="w-3 h-3" />
                  <span>Skills Wanted</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {activePeer.skills_needed.length > 0 ? (
                    activePeer.skills_needed.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold bg-brand-50 text-brand-800 dark:bg-purple-950/60 dark:text-purple-300 border border-brand-200 dark:border-purple-800/50"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">Open to all skills</span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Connect, Chat, & Profile */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-white/10">
                {getStatus(activePeer.id) === "connected" ? (
                  <Link
                    href={`/chat/${activePeer.id}`}
                    className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat Now</span>
                  </Link>
                ) : getStatus(activePeer.id) === "pending" ? (
                  <button
                    type="button"
                    disabled
                    className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-700/50 cursor-default"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setExchangePeer(activePeer)}
                    className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Connect</span>
                  </button>
                )}

                {getStatus(activePeer.id) !== "connected" && (
                  <Link
                    href={`/chat/${activePeer.id}`}
                    className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition"
                    title="Direct Chat"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setDetailedModalPeer(activePeer)}
                  className="inline-flex items-center justify-center px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition"
                  title="View Full Profile Details"
                >
                  Profile
                </button>
              </div>
            </div>
          )}
        </Earth3DScene>
      </div>

      {/* ========================================================================= */}
      {/* 3. COMPLETE LEARNERS DIRECTORY (Full Discoverability for all Peers)        */}
      {/* ========================================================================= */}
      <div className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Learners Directory
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 dark:bg-purple-950/60 text-brand-700 dark:text-purple-300 border border-brand-200 dark:border-purple-800/60">
                {filteredPeers.length} {filteredPeers.length === 1 ? "peer" : "peers"} found
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Connect with any peer to exchange skills 1-for-1 or fly to their location on the 3D globe.
            </p>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400">
            Click any profile to inspect skills or propose an exchange.
          </span>
        </div>

        {filteredPeers.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <Users className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No learners match your search criteria
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Try adjusting your search query, location filter, or skill category shortcuts to explore more learners worldwide.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 dark:bg-purple-600 text-white hover:bg-brand-500 transition shadow-sm"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPeers.map((peer) => (
              <LearnerCard
                key={peer.id}
                peer={peer}
                connectionStatus={getStatus(peer.id)}
                onSelectPeer={handleSelectPeerOnMap}
                onRequestExchange={(p) => setExchangePeer(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODALS (Detailed Peer Profile & Skill Exchange Request)                */}
      {/* ========================================================================= */}
      <PeerProfileModal
        peer={detailedModalPeer}
        connectionStatus={detailedModalPeer ? getStatus(detailedModalPeer.id) : undefined}
        currentUserId={currentUserId}
        onClose={() => setDetailedModalPeer(null)}
        onRequestExchange={(peer) => {
          setDetailedModalPeer(null);
          setExchangePeer(peer);
        }}
      />

      <ExchangeModal
        peer={exchangePeer}
        currentUserSkillsOffered={currentUserSkillsOffered}
        isOpen={Boolean(exchangePeer)}
        onClose={() => setExchangePeer(null)}
        onSuccess={() => {
          if (exchangePeer) {
            setConnections((prev) => ({ ...prev, [exchangePeer.id]: "pending" }));
          }
          setExchangePeer(null);
        }}
      />
    </div>
  );
}
