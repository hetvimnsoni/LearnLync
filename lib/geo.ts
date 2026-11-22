/**
 * Geographic positioning, city-level coordinate resolution,
 * skill icon categorization, and learner connection network for LearnLync's 3D Global Earth Map.
 *
 * Privacy Notice: Only city-level approximate coordinates are ever utilized.
 * Precise GPS coordinates are strictly forbidden.
 */

import { PeerProfile } from "@/types/learner";

export interface GeoLocation {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
}

// Global tech & cultural hubs for city-level positioning
export const KNOWN_CITIES: Record<string, GeoLocation> = {
  "san francisco": { city: "San Francisco", country: "United States", countryCode: "US", lat: 37.7749, lon: -122.4194 },
  "new york": { city: "New York", country: "United States", countryCode: "US", lat: 40.7128, lon: -74.006 },
  "seattle": { city: "Seattle", country: "United States", countryCode: "US", lat: 47.6062, lon: -122.3321 },
  "austin": { city: "Austin", country: "United States", countryCode: "US", lat: 30.2672, lon: -97.7431 },
  "boston": { city: "Boston", country: "United States", countryCode: "US", lat: 42.3601, lon: -71.0589 },
  "chicago": { city: "Chicago", country: "United States", countryCode: "US", lat: 41.8781, lon: -87.6298 },
  "los angeles": { city: "Los Angeles", country: "United States", countryCode: "US", lat: 34.0522, lon: -118.2437 },
  "toronto": { city: "Toronto", country: "Canada", countryCode: "CA", lat: 43.6532, lon: -79.3832 },
  "vancouver": { city: "Vancouver", country: "Canada", countryCode: "CA", lat: 49.2827, lon: -123.1207 },
  "montreal": { city: "Montreal", country: "Canada", countryCode: "CA", lat: 45.5017, lon: -73.5673 },
  "london": { city: "London", country: "United Kingdom", countryCode: "GB", lat: 51.5074, lon: -0.1278 },
  "manchester": { city: "Manchester", country: "United Kingdom", countryCode: "GB", lat: 53.4808, lon: -2.2426 },
  "edinburgh": { city: "Edinburgh", country: "United Kingdom", countryCode: "GB", lat: 55.9533, lon: -3.1883 },
  "berlin": { city: "Berlin", country: "Germany", countryCode: "DE", lat: 52.52, lon: 13.405 },
  "munich": { city: "Munich", country: "Germany", countryCode: "DE", lat: 48.1351, lon: 11.582 },
  "paris": { city: "Paris", country: "France", countryCode: "FR", lat: 48.8566, lon: 2.3522 },
  "amsterdam": { city: "Amsterdam", country: "Netherlands", countryCode: "NL", lat: 52.3676, lon: 4.9041 },
  "stockholm": { city: "Stockholm", country: "Sweden", countryCode: "SE", lat: 59.3293, lon: 18.0686 },
  "zurich": { city: "Zurich", country: "Switzerland", countryCode: "CH", lat: 47.3769, lon: 8.5417 },
  "barcelona": { city: "Barcelona", country: "Spain", countryCode: "ES", lat: 41.3879, lon: 2.1699 },
  "madrid": { city: "Madrid", country: "Spain", countryCode: "ES", lat: 40.4168, lon: -3.7038 },
  "bengaluru": { city: "Bengaluru", country: "India", countryCode: "IN", lat: 12.9716, lon: 77.5946 },
  "mumbai": { city: "Mumbai", country: "India", countryCode: "IN", lat: 19.076, lon: 72.8777 },
  "delhi": { city: "Delhi", country: "India", countryCode: "IN", lat: 28.7041, lon: 77.1025 },
  "hyderabad": { city: "Hyderabad", country: "India", countryCode: "IN", lat: 17.385, lon: 78.4867 },
  "pune": { city: "Pune", country: "India", countryCode: "IN", lat: 18.5204, lon: 73.8567 },
  "tokyo": { city: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.6762, lon: 139.6503 },
  "kyoto": { city: "Kyoto", country: "Japan", countryCode: "JP", lat: 35.0116, lon: 135.7681 },
  "seoul": { city: "Seoul", country: "South Korea", countryCode: "KR", lat: 37.5665, lon: 126.978 },
  "singapore": { city: "Singapore", country: "Singapore", countryCode: "SG", lat: 1.3521, lon: 103.8198 },
  "sydney": { city: "Sydney", country: "Australia", countryCode: "AU", lat: -33.8688, lon: 151.2093 },
  "melbourne": { city: "Melbourne", country: "Australia", countryCode: "AU", lat: -37.8136, lon: 144.9631 },
  "sao paulo": { city: "São Paulo", country: "Brazil", countryCode: "BR", lat: -23.5505, lon: -46.6333 },
  "rio de janeiro": { city: "Rio de Janeiro", country: "Brazil", countryCode: "BR", lat: -22.9068, lon: -43.1729 },
  "buenos aires": { city: "Buenos Aires", country: "Argentina", countryCode: "AR", lat: -34.6037, lon: -58.3816 },
  "nairobi": { city: "Nairobi", country: "Kenya", countryCode: "KE", lat: -1.2921, lon: 36.8219 },
  "cape town": { city: "Cape Town", country: "South Africa", countryCode: "ZA", lat: -33.9249, lon: 18.4241 },
  "dubai": { city: "Dubai", country: "United Arab Emirates", countryCode: "AE", lat: 25.2048, lon: 55.2708 },
  "tel aviv": { city: "Tel Aviv", country: "Israel", countryCode: "IL", lat: 32.0853, lon: 34.7818 },
  "warsaw": { city: "Warsaw", country: "Poland", countryCode: "PL", lat: 52.2297, lon: 21.0122 },
};

// Preset locations for default seed accounts
const DEFAULT_ACCOUNT_GEOS: Record<string, GeoLocation> = {
  // Elena Rostova (AI/ML)
  "11111111-1111-1111-1111-111111111111": KNOWN_CITIES["berlin"],
  "elena_ml": KNKNOWN_CITIES_CHECK("berlin"),

  // Marcus Chen (Senior Design / UI)
  "22222222-2222-2222-2222-222222222222": KNOWN_CITIES["toronto"],
  "marcus_frontend": KNKNOWN_CITIES_CHECK("toronto"),

  // Priya Sharma (DevOps / Cloud)
  "33333333-3333-3333-3333-333333333333": KNOWN_CITIES["bengaluru"],
  "priya_devops": KNKNOWN_CITIES_CHECK("bengaluru"),

  // Alex Rivera (Fullstack / Microservices)
  "44444444-4444-4444-4444-444444444444": KNOWN_CITIES["san francisco"],
  "alex_fullstack": KNKNOWN_CITIES_CHECK("san francisco"),
};

function KNKNOWN_CITIES_CHECK(name: string): GeoLocation {
  return KNOWN_CITIES[name] || KNOWN_CITIES["san francisco"];
}

const DIVERSE_CITY_POOL: GeoLocation[] = [
  KNOWN_CITIES["bengaluru"],
  KNOWN_CITIES["tokyo"],
  KNOWN_CITIES["berlin"],
  KNOWN_CITIES["london"],
  KNOWN_CITIES["san francisco"],
  KNOWN_CITIES["toronto"],
  KNOWN_CITIES["singapore"],
  KNOWN_CITIES["sydney"],
  KNOWN_CITIES["paris"],
  KNOWN_CITIES["seoul"],
  KNOWN_CITIES["amsterdam"],
  KNOWN_CITIES["austin"],
];

/**
 * Resolves approximate city-level coordinates for a learner profile.
 * Respects user opt-out (`show_on_community_map: false`).
 */
export function resolveLearnerLocation(profile: {
  id: string;
  username?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  show_on_community_map?: boolean;
}): { city: string; country: string; countryCode: string; lat: number; lon: number } | null {
  // Respect explicit opt-out
  if (profile.show_on_community_map === false) {
    return null;
  }

  // 1. Check explicit city field
  if (profile.city) {
    const key = profile.city.trim().toLowerCase();
    if (KNOWN_CITIES[key]) {
      return KNOWN_CITIES[key];
    }
  }

  // 2. Check seed presets
  if (profile.id && DEFAULT_ACCOUNT_GEOS[profile.id]) {
    return DEFAULT_ACCOUNT_GEOS[profile.id];
  }
  if (profile.username && DEFAULT_ACCOUNT_GEOS[profile.username.toLowerCase()]) {
    return DEFAULT_ACCOUNT_GEOS[profile.username.toLowerCase()];
  }

  // 3. Check bio text for known cities
  if (profile.bio) {
    const lowerBio = profile.bio.toLowerCase();
    for (const [cityName, geo] of Object.entries(KNOWN_CITIES)) {
      if (lowerBio.includes(cityName) || lowerBio.includes(geo.country.toLowerCase())) {
        return geo;
      }
    }
  }

  // 4. Deterministic assignment from UUID hash for organic distribution
  if (profile.id) {
    let hash = 0;
    for (let i = 0; i < profile.id.length; i++) {
      hash = (hash << 5) - hash + profile.id.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % DIVERSE_CITY_POOL.length;
    return DIVERSE_CITY_POOL[index];
  }

  return KNOWN_CITIES["san francisco"];
}

/**
 * Applies a slight spatial separation to multiple learners sharing the exact same city coordinates
 * so their pins never overlap directly on top of each other.
 */
export function separateClusteredMarkers<T extends { id: string; latitude?: number | null; longitude?: number | null }>(
  items: T[]
): (T & { displayLat: number; displayLon: number })[] {
  const coordGroups = new Map<string, T[]>();

  items.forEach((item) => {
    if (typeof item.latitude === "number" && typeof item.longitude === "number") {
      const key = `${item.latitude.toFixed(3)},${item.longitude.toFixed(3)}`;
      const list = coordGroups.get(key) || [];
      list.push(item);
      coordGroups.set(key, list);
    }
  });

  return items.map((item) => {
    if (typeof item.latitude !== "number" || typeof item.longitude !== "number") {
      return { ...item, displayLat: 0, displayLon: 0 };
    }

    const key = `${item.latitude.toFixed(3)},${item.longitude.toFixed(3)}`;
    const group = coordGroups.get(key) || [];

    if (group.length <= 1) {
      return { ...item, displayLat: item.latitude, displayLon: item.longitude };
    }

    const index = group.findIndex((g) => g.id === item.id);
    const angle = index * ((2 * Math.PI) / group.length);
    const offsetDistance = 0.8 + index * 0.15; // Small degrees offset

    return {
      ...item,
      displayLat: item.latitude + Math.sin(angle) * offsetDistance,
      displayLon: item.longitude + Math.cos(angle) * offsetDistance,
    };
  });
}

export interface LearnerConnectionTrail {
  id: string;
  fromId: string;
  toId: string;
  fromCity: string;
  toCity: string;
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  skillLabel: string;
}

/**
 * Generates subtle, meaningful 3D connection trails between learners.
 * Requirement 6: e.g. India <-> Japan, Europe <-> India, etc.
 */
export function generateConnectionTrails(peers: PeerProfile[]): LearnerConnectionTrail[] {
  const validPeers = peers.filter(
    (p) =>
      p.show_on_community_map !== false &&
      typeof p.latitude === "number" &&
      typeof p.longitude === "number"
  );

  if (validPeers.length < 2) return [];

  const trails: LearnerConnectionTrail[] = [];
  const connectedPairs = new Set<string>();

  // 1. Connect peers who have complementary skill trades
  for (let i = 0; i < validPeers.length; i++) {
    for (let j = i + 1; j < validPeers.length; j++) {
      const p1 = validPeers[i];
      const p2 = validPeers[j];

      const p1TeachesWhatP2Wants = p1.skills_offered.some((s) =>
        p2.skills_needed.some((n) => n.toLowerCase() === s.toLowerCase())
      );
      const p2TeachesWhatP1Wants = p2.skills_offered.some((s) =>
        p1.skills_needed.some((n) => n.toLowerCase() === s.toLowerCase())
      );

      const pairKey = [p1.id, p2.id].sort().join("---");

      if ((p1TeachesWhatP2Wants || p2TeachesWhatP1Wants) && !connectedPairs.has(pairKey)) {
        connectedPairs.add(pairKey);
        trails.push({
          id: `trail-${p1.id}-${p2.id}`,
          fromId: p1.id,
          toId: p2.id,
          fromCity: p1.city || "Learner Hub",
          toCity: p2.city || "Peer Hub",
          fromLat: p1.latitude!,
          fromLon: p1.longitude!,
          toLat: p2.latitude!,
          toLon: p2.longitude!,
          skillLabel: p1TeachesWhatP2Wants
            ? p1.skills_offered[0] || "Skill Exchange"
            : p2.skills_offered[0] || "Skill Exchange",
        });
      }

      if (trails.length >= 6) break;
    }
    if (trails.length >= 6) break;
  }

  // 2. If fewer than 2 connections, connect the first few distinct regional hubs
  if (trails.length < 2 && validPeers.length >= 2) {
    for (let i = 0; i < Math.min(3, validPeers.length - 1); i++) {
      const p1 = validPeers[i];
      const p2 = validPeers[i + 1];
      const pairKey = [p1.id, p2.id].sort().join("---");

      if (!connectedPairs.has(pairKey)) {
        connectedPairs.add(pairKey);
        trails.push({
          id: `trail-${p1.id}-${p2.id}`,
          fromId: p1.id,
          toId: p2.id,
          fromCity: p1.city || "Peer Hub",
          toCity: p2.city || "Peer Hub",
          fromLat: p1.latitude!,
          fromLon: p1.longitude!,
          toLat: p2.latitude!,
          toLon: p2.longitude!,
          skillLabel: p1.skills_offered[0] || "Knowledge Sharing",
        });
      }
    }
  }

  return trails;
}

/**
 * Categorizes a skill into an elegant, tasteful skill icon.
 * Requirement 4 & 5:
 * 💻 Programming, 🎨 Design, 🎵 Music, 📸 Photography, 📚 Academics, 🧪 Science, 🗣️ Languages, 🤖 AI/ML, ✍️ Writing.
 */
export function getSkillIcon(skill: string): { icon: string; category: string } {
  const s = skill.toLowerCase().trim();

  // AI & Machine Learning
  if (
    s.includes("ai") ||
    s.includes("machine learning") ||
    s.includes("pytorch") ||
    s.includes("tensorflow") ||
    s.includes("nlp") ||
    s.includes("llm") ||
    s.includes("deep learning") ||
    s.includes("data science") ||
    s.includes("neural") ||
    s.includes("langchain")
  ) {
    return { icon: "🤖", category: "AI & ML" };
  }

  // Writing & Copywriting
  if (
    s.includes("writing") ||
    s.includes("copywriting") ||
    s.includes("creative writing") ||
    s.includes("journalism") ||
    s.includes("blogging") ||
    s.includes("author")
  ) {
    return { icon: "✍️", category: "Writing" };
  }

  // Design, 3D, UI/UX
  if (
    s.includes("design") ||
    s.includes("ui") ||
    s.includes("ux") ||
    s.includes("figma") ||
    s.includes("illustrator") ||
    s.includes("photoshop") ||
    s.includes("3d") ||
    s.includes("blender") ||
    s.includes("animation")
  ) {
    return { icon: "🎨", category: "Design" };
  }

  // Languages
  if (
    s.includes("language") ||
    s.includes("spanish") ||
    s.includes("french") ||
    s.includes("german") ||
    s.includes("japanese") ||
    s.includes("mandarin") ||
    s.includes("chinese") ||
    s.includes("english") ||
    s.includes("korean") ||
    s.includes("italian") ||
    s.includes("arabic") ||
    s.includes("linguistics")
  ) {
    return { icon: "🗣️", category: "Languages" };
  }

  // Music & Audio
  if (
    s.includes("music") ||
    s.includes("guitar") ||
    s.includes("piano") ||
    s.includes("audio") ||
    s.includes("sound") ||
    s.includes("production") ||
    s.includes("singing") ||
    s.includes("drums") ||
    s.includes("composition")
  ) {
    return { icon: "🎵", category: "Music" };
  }

  // Photography & Film
  if (
    s.includes("photo") ||
    s.includes("camera") ||
    s.includes("lighting") ||
    s.includes("cinematography") ||
    s.includes("video") ||
    s.includes("editing") ||
    s.includes("film")
  ) {
    return { icon: "📸", category: "Photography" };
  }

  // Science & Math
  if (
    s.includes("science") ||
    s.includes("physics") ||
    s.includes("chemistry") ||
    s.includes("biology") ||
    s.includes("math") ||
    s.includes("calculus") ||
    s.includes("statistics")
  ) {
    return { icon: "🧪", category: "Science" };
  }

  // Academics & Humanities
  if (
    s.includes("history") ||
    s.includes("philosophy") ||
    s.includes("economics") ||
    s.includes("literature") ||
    s.includes("academics") ||
    s.includes("tutoring") ||
    s.includes("essay")
  ) {
    return { icon: "📚", category: "Academics" };
  }

  // Default: Programming / Tech
  return { icon: "💻", category: "Programming" };
}

/**
 * Returns a list of distinct skill icons for a learner's offered skills (max 3).
 */
export function getTopSkillIcons(skills: string[]): string[] {
  if (!skills || skills.length === 0) return ["💻"];
  const set = new Set<string>();
  for (const s of skills) {
    const { icon } = getSkillIcon(s);
    set.add(icon);
    if (set.size >= 3) break;
  }
  return Array.from(set);
}
