// getAnnouncementsByType only accepts these four values (see
// getAnnouncementsByType in app/controllers/tenant/announcements.js) — the
// tenant Announcements.visibility_scope.type column also stores "All" /
// "Department" / "Team" / "Personal" for legacy rows, but new announcements
// created from this portal always use one of the four audience types below so
// the type-scoped list endpoint can find them again.
export type AnnouncementAudienceType = "parent" | "teacher" | "student" | "accountant";

export const ANNOUNCEMENT_AUDIENCE_OPTIONS: { value: AnnouncementAudienceType; label: string }[] = [
  { value: "parent", label: "Parents" },
  { value: "teacher", label: "Teachers" },
  { value: "student", label: "Students" },
  { value: "accountant", label: "Accountants" },
];

export interface AnnouncementVisibilityScope {
  type: string;
  departmentId?: string | null;
  teamId?: string | null;
  userId?: string | null;
}

export interface Announcement {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  message: string;
  visible_until?: string | null;
  visibility_scope?: AnnouncementVisibilityScope | null;
  created_at?: string;
  updated_at?: string;
}

export interface AnnouncementFormValues {
  title: string;
  message: string;
  visible_until?: string;
  audience: AnnouncementAudienceType;
}