// Types for the tables in supabase/migrations (hand-written in the shape `supabase gen types`
// produces; regenerate with `supabase gen types typescript --project-id <ref>` once the project
// exists and keep the names). Types only: nothing here reaches the bundle.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProfileVisibility = "public" | "members" | "private";
export type CityKind = "main" | "farm" | "alt";
export type ReportReason =
  | "minor_safety"
  | "harassment"
  | "hate"
  | "sexual"
  | "impersonation"
  | "spam"
  | "selling_or_cheating"
  | "other";
export type AchievementSource = "site" | "self";
/** 1 declared (unverified), 2 screenshot-checked, 3 ownership-proven. */
export type VerificationLevel = 1 | 2 | 3;
export type VerificationStatus = "awaiting_screenshots" | "pending_review" | "approved" | "rejected" | "expired" | "cancelled";
export type SiteAchievementCode = "onboarded" | "farm_keeper" | "profile_complete" | "data_saved";

export type ProfileRow = {
  id: string;
  handle: string | null;
  display_name: string | null;
  bio: string | null;
  kingdom_number: number | null;
  avatar_path: string | null;
  banner_path: string | null;
  visibility: ProfileVisibility;
  /** Highest verification level among the player's cities (badge). Set by moderators only. */
  verified_level: VerificationLevel;
  created_at: string;
  updated_at: string;
};

export type AccountRow = {
  id: string;
  user_id: string;
  kind: CityKind;
  name: string;
  city_hall: number | null;
  kingdom_stage: string | null;
  spending: string | null;
  profile_code: string | null;
  commanders: Json;
  local_id: string | null;
  sort_order: number;
  /** Set by moderators only (review_verification). */
  verification_level: VerificationLevel;
  governor_id: string | null;
  governor_name: string | null;
  verified_values: Json | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AchievementRow = {
  id: string;
  user_id: string;
  source: AchievementSource;
  code: string;
  title: string;
  detail: string | null;
  verified: boolean;
  earned_at: string;
};

export type ReportRow = {
  id: number;
  reporter_id: string | null;
  target_id: string;
  reason: ReportReason;
  details: string | null;
  target_snapshot: Json | null;
  status: "open" | "reviewing" | "actioned" | "dismissed";
  created_at: string;
};

export type BlockRow = {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};

export type LocalImportRow = {
  id: string;
  user_id: string;
  created_at: string;
  device_label: string | null;
  payload: Json;
};

export type VerificationRequestRow = {
  id: string;
  user_id: string;
  account_id: string;
  requested_level: 2 | 3;
  code: string;
  code_expires_at: string;
  code_used_at: string | null;
  status: VerificationStatus;
  claimed_values: Json | null;
  auto_check: Json | null;
  screenshot_paths: string[];
  approved_values: Json | null;
  granted_level: VerificationLevel | null;
  reviewer_id: string | null;
  review_note: string | null;
  created_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  purge_screenshots_after: string | null;
};

type Table<Row, Insert, Update = Partial<Insert>> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, Partial<ProfileRow> & { id: string }>;
      accounts: Table<AccountRow, Partial<AccountRow> & { name: string }>;
      achievements: Table<AchievementRow, Partial<AchievementRow> & { source: AchievementSource; code: string; title: string }>;
      reports: Table<ReportRow, Partial<Omit<ReportRow, "id">> & { target_id: string; reason: ReportReason }>;
      blocks: Table<BlockRow, Partial<BlockRow> & { blocked_id: string }>;
      local_imports: Table<LocalImportRow, Partial<LocalImportRow> & { payload: Json }>;
      // No insert/update for players: rows change only through the functions below.
      verification_requests: Table<VerificationRequestRow, never, never>;
    };
    Views: { [_ in never]: never };
    Functions: {
      claim_site_achievement: { Args: { p_code: SiteAchievementCode }; Returns: boolean };
      delete_my_account: { Args: Record<PropertyKey, never>; Returns: undefined };
      can_view_user: { Args: { owner: string }; Returns: boolean };
      is_moderator: { Args: Record<PropertyKey, never>; Returns: boolean };
      start_verification: { Args: { p_account_id: string; p_level?: 2 | 3 }; Returns: VerificationRequestRow };
      submit_verification: { Args: { p_request_id: string; p_claimed: Json; p_paths: string[]; p_album_code?: string | null }; Returns: VerificationRequestRow };
      cancel_verification: { Args: { p_request_id: string }; Returns: undefined };
      review_verification: { Args: { p_request_id: string; p_approve: boolean; p_level: 2 | 3; p_values: Json; p_note?: string | null }; Returns: VerificationRequestRow };
    };
    Enums: {
      profile_visibility: ProfileVisibility;
      city_kind: CityKind;
      report_reason: ReportReason;
      verification_status: VerificationStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
