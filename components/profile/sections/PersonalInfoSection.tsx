"use client";

import { useState } from "react";
import { UserProfile, AboutDetails, SocialLinks } from "@/types/profile";
import {
  User,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  Globe,
  GraduationCap,
} from "lucide-react";
import { updateUserProfile } from "@/app/profile/actions";

interface PersonalInfoSectionProps {
  profile: UserProfile;
  isOwner: boolean;
}

export function PersonalInfoSection({ profile, isOwner }: PersonalInfoSectionProps) {
  // Form state
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [username, setUsername] = useState(profile.username || "");
  const [tagline, setTagline] = useState(profile.tagline || "");
  const [pronouns, setPronouns] = useState(profile.pronouns || "");
  const [dob, setDob] = useState(profile.date_of_birth || "");
  const [location, setLocation] = useState(profile.location || "");
  const [education, setEducation] = useState(profile.education || "");
  const [profession, setProfession] = useState(profile.profession || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [bio, setBio] = useState(profile.bio || "");

  // Languages array
  const [languages, setLanguages] = useState<string[]>(
    profile.languages || ["English"]
  );
  const [newLanguage, setNewLanguage] = useState("");

  // Social Links
  const [github, setGithub] = useState(profile.social_links?.github || "");
  const [linkedin, setLinkedin] = useState(profile.social_links?.linkedin || "");
  const [twitter, setTwitter] = useState(profile.social_links?.twitter || "");
  const [discord, setDiscord] = useState(profile.social_links?.discord || "");
  const [portfolio, setPortfolio] = useState(profile.social_links?.portfolio || "");

  // About Details
  const [intro, setIntro] = useState(profile.about_details?.introduction || "");
  const [background, setBackground] = useState(profile.about_details?.background || "");
  const [passions, setPassions] = useState(profile.about_details?.passions || "");
  const [hobbies, setHobbies] = useState(profile.about_details?.hobbies || "");
  const [personalGoals, setPersonalGoals] = useState(
    profile.about_details?.personal_goals || ""
  );
  const [careerAspirations, setCareerAspirations] = useState(
    profile.about_details?.career_aspirations || ""
  );
  const [motivation, setMotivation] = useState(profile.about_details?.motivation || "");
  const [lookingFor, setLookingFor] = useState(profile.about_details?.looking_for || "");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddLanguage = () => {
    if (!newLanguage.trim()) return;
    if (!languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
    }
    setNewLanguage("");
  };

  const handleRemoveLanguage = (lang: string) => {
    setLanguages(languages.filter((l) => l !== lang));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    setSaving(true);
    setSuccess(null);
    setError(null);

    const social_links: SocialLinks = {
      github: github.trim() || undefined,
      linkedin: linkedin.trim() || undefined,
      twitter: twitter.trim() || undefined,
      discord: discord.trim() || undefined,
      portfolio: portfolio.trim() || undefined,
    };

    const about_details: AboutDetails = {
      introduction: intro.trim() || undefined,
      background: background.trim() || undefined,
      passions: passions.trim() || undefined,
      hobbies: hobbies.trim() || undefined,
      personal_goals: personalGoals.trim() || undefined,
      career_aspirations: careerAspirations.trim() || undefined,
      motivation: motivation.trim() || undefined,
      looking_for: lookingFor.trim() || undefined,
    };

    const res = await updateUserProfile({
      full_name: fullName.trim(),
      username: username.trim(),
      tagline: tagline.trim(),
      pronouns: pronouns.trim(),
      date_of_birth: dob.trim(),
      location: location.trim(),
      education: education.trim(),
      profession: profession.trim(),
      website: website.trim(),
      bio: bio.trim(),
      languages,
      social_links,
      about_details,
    });

    setSaving(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess("Personal identity & About Me updated successfully!");
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  if (!isOwner) {
    // Read-only view for peer viewers
    return (
      <div className="space-y-6 animate-fade-in transition-colors">
        <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-6">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-brand-500 dark:text-brand-400" />
            <span>Personal Identity &amp; Story</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {profile.location && (
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Location
                </span>
                <p className="text-slate-900 dark:text-white font-medium">{profile.location}</p>
              </div>
            )}
            {profile.profession && (
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Profession
                </span>
                <p className="text-slate-900 dark:text-white font-medium">{profile.profession}</p>
              </div>
            )}
            {profile.education && (
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Education
                </span>
                <p className="text-slate-900 dark:text-white font-medium">{profile.education}</p>
              </div>
            )}
            {profile.languages && (
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Languages
                </span>
                <p className="text-slate-900 dark:text-white font-medium">{profile.languages.join(", ")}</p>
              </div>
            )}
          </div>

          {profile.about_details && (
            <div className="space-y-4 pt-4 border-t border-slate-200/90 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">In-Depth Story</h3>
              <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {profile.about_details.background && (
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-200">Background &amp; Journey</h4>
                    <p>{profile.about_details.background}</p>
                  </div>
                )}
                {profile.about_details.passions && (
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-200">Passions &amp; Interests</h4>
                    <p>{profile.about_details.passions}</p>
                  </div>
                )}
                {profile.about_details.career_aspirations && (
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-200">Career Aspirations</h4>
                    <p>{profile.about_details.career_aspirations}</p>
                  </div>
                )}
                {profile.about_details.looking_for && (
                  <div>
                    <h4 className="font-bold text-brand-600 dark:text-brand-400">Looking For on LearnLync</h4>
                    <p>{profile.about_details.looking_for}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-fade-in transition-colors">
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Core Identity & Demographics */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-5">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <User className="w-5 h-5 text-brand-500 dark:text-brand-400" />
          <span>Core Identity &amp; Information</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Unique Username *
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Personal Tagline (Appears in hero header)
          </label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g. AI/ML Research Engineer | Transformer Architecture & PyTorch Specialist"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Pronouns (Optional)
            </label>
            <input
              type="text"
              value={pronouns}
              onChange={(e) => setPronouns(e.target.value)}
              placeholder="she/her, he/him, they/them"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Berlin, Germany / Remote"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Profession / Occupation
            </label>
            <input
              type="text"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="e.g. Senior Machine Learning Engineer"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Education / Degree
            </label>
            <input
              type="text"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="e.g. M.S. in Computer Science, TU Munich"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Languages Tag Editor */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Languages Spoken
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {languages.map((lang, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60"
              >
                <span>{lang}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(lang)}
                  className="hover:text-red-500 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddLanguage();
                }
              }}
              placeholder="Type language (e.g. Spanish - Fluent) and hit Add"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={handleAddLanguage}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
            >
              Add
            </button>
          </div>
        </div>

        {/* Short Bio */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Short Bio / Elevator Pitch
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* 2. Web & Social Profiles */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-5">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Globe className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          <span>Web &amp; Social Profiles</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Personal Website URL
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://mywebsite.dev"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              GitHub URL
            </label>
            <input
              type="url"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              LinkedIn Profile
            </label>
            <input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Twitter / X Handle or URL
            </label>
            <input
              type="text"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="https://twitter.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Discord Handle (For peer study sync)
            </label>
            <input
              type="text"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              placeholder="username#0000 or username"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* 3. Detailed About Me Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-5">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <GraduationCap className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          <span>Detailed About Me &amp; Aspirations</span>
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Personal Introduction
            </label>
            <textarea
              rows={2}
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              placeholder="How do you introduce yourself to the community?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Background &amp; Technical Journey
            </label>
            <textarea
              rows={2}
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="Where did you start? What projects shaped your journey?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Passions &amp; Creative Drive
              </label>
              <textarea
                rows={2}
                value={passions}
                onChange={(e) => setPassions(e.target.value)}
                placeholder="What topics get you excited to code or build?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Hobbies &amp; Personal Interests
              </label>
              <textarea
                rows={2}
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
                placeholder="Chess, analog photography, music, hiking..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Personal Goals
              </label>
              <textarea
                rows={2}
                value={personalGoals}
                onChange={(e) => setPersonalGoals(e.target.value)}
                placeholder="What are you currently trying to master or build?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Career Aspirations
              </label>
              <textarea
                rows={2}
                value={careerAspirations}
                onChange={(e) => setCareerAspirations(e.target.value)}
                placeholder="Where do you see yourself in 2-3 years?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              What are you looking for in the LearnLync community?
            </label>
            <textarea
              rows={2}
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              placeholder="e.g. Peer pair programming partners, mentorship in cloud infra, React UI coaching..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-xl shadow-brand-500/25 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving Changes..." : "Save Identity Changes"}</span>
        </button>
      </div>
    </form>
  );
}
