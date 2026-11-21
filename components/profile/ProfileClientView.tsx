"use client";

import { useState } from "react";
import { UserProfile, ProfileStatistics, ProfileTabId } from "@/types/profile";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileNavTabs } from "./ProfileNavTabs";
import { OverviewSection } from "./sections/OverviewSection";
import { PersonalInfoSection } from "./sections/PersonalInfoSection";
import { InterestsSection } from "./sections/InterestsSection";
import { SkillsSection } from "./sections/SkillsSection";
import { PortfolioSection } from "./sections/PortfolioSection";
import { AchievementsSection } from "./sections/AchievementsSection";
import { JourneySection } from "./sections/JourneySection";
import { CommunitySection } from "./sections/CommunitySection";
import { AvailabilitySection } from "./sections/AvailabilitySection";
import { ReviewsSection } from "./sections/ReviewsSection";
import { StatsSection } from "./sections/StatsSection";
import { PrivacySettingsSection } from "./sections/PrivacySettingsSection";

interface ProfileClientViewProps {
  initialProfile: UserProfile;
  initialStats: ProfileStatistics;
  isOwner: boolean;
}

export function ProfileClientView({
  initialProfile,
  initialStats,
  isOwner,
}: ProfileClientViewProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabId>("overview");
  const [isEditMode, setIsEditMode] = useState(false);

  const counts = {
    skills:
      (initialProfile.skills_teach_detailed?.length || 0) +
      (initialProfile.skills_learn_detailed?.length || 0),
    projects: initialProfile.portfolio_projects?.length || 0,
    achievements:
      (initialProfile.achievements || []).filter((a) => a.unlocked).length,
    reviews: initialProfile.reviews?.length || 0,
    connections: 12,
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Header (Banner, Avatar, Tagline, Socials, Actions) */}
      <ProfileHeader
        profile={initialProfile}
        isOwner={isOwner}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
      />

      {/* 2. 12-Section Navigation Bar */}
      <ProfileNavTabs
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        counts={counts}
      />

      {/* 3. Active Section View */}
      <main className="min-h-[400px]">
        {activeTab === "overview" && (
          <OverviewSection
            profile={initialProfile}
            stats={initialStats}
            onNavigateTab={(tab) => setActiveTab(tab)}
            isOwner={isOwner && isEditMode}
          />
        )}

        {activeTab === "personal" && (
          <PersonalInfoSection
            profile={initialProfile}
            isOwner={isOwner && isEditMode}
          />
        )}

        {activeTab === "interests" && (
          <InterestsSection
            profile={initialProfile}
            isOwner={isOwner && isEditMode}
          />
        )}

        {activeTab === "skills" && (
          <SkillsSection
            profile={initialProfile}
            isOwner={isOwner && isEditMode}
          />
        )}

        {activeTab === "portfolio" && (
          <PortfolioSection
            profile={initialProfile}
            isOwner={isOwner && isEditMode}
          />
        )}

        {activeTab === "achievements" && (
          <AchievementsSection profile={initialProfile} />
        )}

        {activeTab === "journey" && (
          <JourneySection
            profile={initialProfile}
            isOwner={isOwner && isEditMode}
          />
        )}

        {activeTab === "community" && (
          <CommunitySection
            profile={initialProfile}
            isOwner={isOwner && isEditMode}
          />
        )}

        {activeTab === "availability" && (
          <AvailabilitySection
            profile={initialProfile}
            isOwner={isOwner && isEditMode}
          />
        )}

        {activeTab === "reviews" && (
          <ReviewsSection
            profile={initialProfile}
            isOwner={isOwner}
          />
        )}

        {activeTab === "statistics" && (
          <StatsSection profile={initialProfile} stats={initialStats} />
        )}

        {activeTab === "privacy" && (
          <PrivacySettingsSection
            profile={initialProfile}
            isOwner={isOwner}
          />
        )}
      </main>
    </div>
  );
}
