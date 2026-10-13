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
    };
    Views: { [_ in never]: never };
    Functions: {
      claim_site_achievement: { Args: { p_code: SiteAchievementCode }; Returns: boolean };
      delete_my_account: { Args: Record<PropertyKey, never>; Returns: undefined };
      can_view_user: { Args: { owner: string }; Returns: boolean };
    };
    Enums: {
      profile_visibility: ProfileVisibility;
      city_kind: CityKind;
      report_reason: ReportReason;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
