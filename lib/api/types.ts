/**
 * Shared TypeScript types for the Vistasolve backend API.
 *
 * These mirror the payloads returned by Django. The backend is the source
 * of truth; if a field shape changes, update it here and fix the call site
 * that broke.
 */

export type WorkspaceRole = "owner" | "admin" | "member";
export type InvitationRole = "admin" | "member";

export interface Workspace {
  nanoid: string;
  name: string;
  /** Path-based routing slug (`/{domain}/...`). */
  domain: string;
  is_active: boolean;
  my_role: WorkspaceRole | null;
  /** Fully-prepared dashboard URL, computed by the backend. */
  url: string;
  /** App keys the org is entitled to under its active subscription. */
  app_access: string[];
}

export interface ClientBusiness {
  refid: string;
  nanoid: string;
  legal_name: string;
  registration_number: string;
  tax_id: string;
  country: string;
  city: string;
  location: string;
  phone_country_code: string;
  phone_number: string;
  business_email: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateClientBusinessBody {
  legal_name: string;
  registration_number?: string;
  tax_id?: string;
  country?: string;
  city?: string;
  location?: string;
  phone_country_code?: string;
  phone_number?: string;
  business_email?: string;
}

export interface UpdateClientBusinessBody {
  legal_name?: string;
  registration_number?: string;
  tax_id?: string;
  country?: string;
  city?: string;
  location?: string;
  phone_country_code?: string;
  phone_number?: string;
  business_email?: string;
}

export interface CreateWorkspaceBody {
  name: string;
  domain: string;
  client_business: string;
}

export interface UpdateWorkspaceBody {
  name?: string;
  domain?: string;
}

export interface Invitation {
  nanoid: string;
  workspace: string;
  workspace_name: string;
  code: string;
  role: InvitationRole;
  email: string;
  first_name: string;
  last_name: string;
  issued_by: string;
  created_at: string;
  expires_at: string | null;
  redeemed_at: string | null;
  revoked: boolean;
  is_redeemed: boolean;
  is_expired: boolean;
  is_redeemable: boolean;
}

export interface CreateInvitationBody {
  workspace: string;
  role?: InvitationRole;
  email: string;
  first_name: string;
  last_name: string;
  expires_in_days?: number;
}

export interface RedeemInvitationBody {
  code: string;
}

export interface RedeemInvitationResult {
  workspace_nanoid: string;
  workspace_name: string;
  redirect_url: string;
}

export interface WorkspaceMember {
  nanoid: string;
  user_nanoid: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: WorkspaceRole;
  joined_at: string;
}

export interface PersonalDetails {
  nanoid: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  country: string;
  city: string;
  location: string;
  phone_country_code: string;
  phone_number: string;
}

export type PersonalDetailsPatch = Partial<
  Pick<
    PersonalDetails,
    | "first_name"
    | "last_name"
    | "email"
    | "country"
    | "city"
    | "location"
    | "phone_country_code"
    | "phone_number"
  >
>;

export interface BillingProfile {
  nanoid: string;
  client_business: string;
  billing_contact_name: string;
  billing_email: string;
  tax_id: string;
  country: string;
  city: string;
  location: string;
  payment_method_note: string;
  created_at: string;
  updated_at: string;
}

export interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  params?: Record<string, string>;
  resource?: string | null;
  children?: NavItem[];
}

export type DashboardWidgetKind = "stat" | "recent" | "actions";

export interface DashboardStatData {
  value: number | string;
  subtitle: string | null;
}

export interface DashboardRecentItem {
  label: string;
  subtitle: string;
  to: string;
}

export interface DashboardRecentData {
  title: string;
  items: DashboardRecentItem[];
}

export interface DashboardActionItem {
  label: string;
  to: string;
  variant: string;
}

export interface DashboardActionData {
  title: string;
  items: DashboardActionItem[];
}

export type DashboardWidgetData =
  | DashboardStatData
  | DashboardRecentData
  | DashboardActionData;

export interface DashboardWidget {
  id: string;
  kind: DashboardWidgetKind;
  label: string;
  icon: string;
  order: number;
  accent: string;
  to: string | null;
  data: DashboardWidgetData;
}

export interface DomainAvailability {
  available: boolean;
  reason: string | null;
}

/* ──────────────────────────────────────────────────────────────────────
 * CRM types
 *
 * Mirrors the Django serializers in the CRM app. Field names match
 * `frontapp/src/features/crm/apptypes/crm.ts`. Keep them in sync if the
 * backend payload changes.
 * ────────────────────────────────────────────────────────────────────── */

export type ProspectStatus =
  | "identified"
  | "researching"
  | "contact_ready"
  | "outreach_sent"
  | "engaged"
  | "qualified"
  | "customer"
  | "lost";

/**
 * Django REST Framework's default pagination response. Some list endpoints
 * return a flat array, others return this paginated envelope; callers
 * should treat the response as `T[] | Paginated<T>` and unwrap.
 */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CompanySocialLink {
  name?: string;
  url: string;
  is_primary?: boolean;
}

export interface Company {
  nanoid: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  phone_numbers?: string[];
  social_links?: CompanySocialLink[];
  about?: string;
  email?: string;
  country?: string;
  city?: string;
  address?: string;
  tier?: string | null;
  tier_label?: string | null;
  status: ProspectStatus;
  total_listings?: number | null;
  verified?: boolean;
  contact_count?: number;
  deal_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  nanoid: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position?: string;
  company: string;
  company_name: string;
  notes?: string;
  status: "active" | "inactive" | "lead";
  social_links?: CompanySocialLink[];
  deal_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Pipeline {
  nanoid: string;
  name: string;
  stages: string[];
  description?: string;
  is_default?: boolean;
  deal_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  nanoid: string;
  title: string;
  value: number;
  contact: string | null;
  contact_name: string | null;
  company: string | null;
  company_name: string | null;
  pipeline: string;
  pipeline_name: string | null;
  stage: string;
  status: "open" | "won" | "lost";
  expected_close_date: string | null;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Country {
  code: string;
  name: string;
  phone_code: string;
}

export interface Industry {
  id: number;
  nanoid: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TierClassification {
  id: number;
  nanoid: string;
  title: string;
  label: string;
  description?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CompanyStatusBreakdown {
  total: number;
  counts: Partial<Record<ProspectStatus, number>>;
}

export type CreateCompanyBody = {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  tier?: string | null;
  phone_numbers?: string[];
  social_links?: { url: string; name?: string; is_primary?: boolean }[];
  email?: string;
  country?: string;
  city?: string;
  address?: string;
  about?: string;
  status?: ProspectStatus;
  verified?: boolean;
  total_listings?: number | null;
};

/* ──────────────────────────────────────────────────────────────────────
 * Notebook types
 *
 * Mirrors the Django serializers in the notebook app. Field names match
 * `frontapp/src/features/notebook/apptypes/Note.ts`. Keep them in sync if
 * the backend payload changes.
 * ────────────────────────────────────────────────────────────────────── */

export type NoteTypeKey = "general" | "meeting" | "idea" | "research" | "sop";

export interface NoteTypeOption {
  nanoid: string;
  id: number;
  key: NoteTypeKey | string;
  name: string;
  order: number;
  color_code: { text?: string; bg?: string };
}

export interface NoteRelation {
  nanoid: string;
  relatable_nanoid: string | null;
  relatable_key: string | null;
  object_nanoid: string | null;
  label: string;
  created_at: string;
}

export interface Note {
  nanoid: string;
  title: string;
  slug: string;
  note_type: NoteTypeKey | string;
  note_type_display: string | null;
  content: Record<string, unknown> | string;
  favorite: boolean;
  archived: boolean;
  tag_names: string[];
  relations: NoteRelation[];
  attachment_count?: number;
  excerpt: string;
  created_at: string;
  updated_at: string;
}

export interface NoteAttachment {
  nanoid: string;
  note: string;
  file: string;
  original_name: string;
  size: number | null;
  mime_type: string;
  uploaded_by_name: string | null;
  created_at: string;
}

export interface CreateNoteBody {
  title: string;
  note_type: string;
  content?: Record<string, unknown> | string;
  tags?: string[];
}

export interface UpdateNoteBody {
  title?: string;
  note_type?: string;
  content?: Record<string, unknown> | string;
  tags?: string[];
  favorite?: boolean;
  archived?: boolean;
}

export interface CreateNoteTypeBody {
  name: string;
  key: string;
  order: number;
  color_code?: { text?: string; bg?: string };
}

/* ──────────────────────────────────────────────────────────────────────
 * Schedules types
 *
 * Mirrors the merged-calendar payload returned by the Django `schedules`
 * app. The engine itself owns no business data — it asks each registered
 * provider (crm, projectmanager, socialmanager, …) for its dated items
 * between `start` and `end`, then sorts and returns them.
 * ────────────────────────────────────────────────────────────────────── */

export type ScheduleItemType =
  | "task"
  | "deliverable"
  | "project_deadline"
  | "activity"
  | "post";

export interface ScheduleItem {
  date: string;
  start: string;
  end: string;
  all_day?: boolean;
  type: ScheduleItemType;
  nanoid: string;
  title: string;
  source?: string;
  tags?: string[];
  project_name?: string;
  project_id?: string;
  priority?: string;
  status?: string;
  deliverable_type?: string;
  action_type?: string;
  contact_name?: string;
  company_id?: string;
  url: string;
  content?: string;
  campaign_name?: string;
  campaign_nanoid?: string;
  scheduled_at?: string;
  published_at?: string;
  platforms?: string[];
}

export interface ScheduleResponse {
  items: ScheduleItem[];
  start: string;
  end: string;
}

export interface ScheduleFilters {
  sources?: string[];
  types?: ScheduleItemType[];
  tags?: string[];
}

export interface ScheduleTaskSummary {
  nanoid: string;
  title: string;
  priority: string;
  due_date: string | null;
  project: string | null;
  project_name: string;
}

export interface ScheduleDeliverableSummary {
  nanoid: string;
  title: string;
  status: string;
  deliverable_type: string;
  project_name: string;
  project_id: string;
}

export interface ScheduleProjectSummary {
  nanoid: string;
  name: string;
  deadline: string | null;
  priority: string;
}

export interface TodaySummary {
  overdue_tasks: ScheduleTaskSummary[];
  today_tasks: ScheduleTaskSummary[];
  needs_review: ScheduleDeliverableSummary[];
  upcoming_projects: ScheduleProjectSummary[];
}

/* ──────────────────────────────────────────────────────────────────────
 * Project Manager types
 *
 * Mirrors the Django serializers in the `projectmanager` app. Field names
 * match `ProjectSerializer` / `ProjectListSerializer` /
 * `TaskSerializer` / `DeliverableSerializer`.
 * ────────────────────────────────────────────────────────────────────── */

export type ProjectStatus =
  | "planning"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled";

export type ProjectPriority = "low" | "medium" | "high" | "urgent";

export interface Project {
  id: number;
  nanoid: string;
  name: string;
  description: string;
  category: string | null;
  client: string | null;
  client_name: string | null;
  company: string;
  company_name: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string | null;
  deadline: string | null;
  task_count: number;
  completed_tasks: number;
  deliverable_count: number;
  completed_deliverables: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectSummary {
  id: number;
  nanoid: string;
  name: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  category: string | null;
  client: string | null;
  client_name: string | null;
  company: string;
  company_name: string | null;
  deadline: string | null;
  task_count: number;
  completed_tasks: number;
  deliverable_count: number;
  completed_deliverables: number;
  created_at: string;
}

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = ProjectPriority;

export interface Task {
  id: number;
  nanoid: string;
  title: string;
  description: string;
  project: string | null;
  project_name: string | null;
  assignee: string | null;
  assignee_name: string | null;
  assignees: Array<{ nanoid: string; name: string }>;
  deliverable: string | null;
  deliverable_title: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export type DeliverableStatus =
  | "draft"
  | "review"
  | "revisions"
  | "approved"
  | "published"
  | "cancelled";

export interface Deliverable {
  id: number;
  nanoid: string;
  project: string;
  project_name: string | null;
  tasks: Task[];
  project_tasks: Task[];
  deliverable_type: string | null;
  title: string;
  description: string;
  status: DeliverableStatus;
  metadata: Record<string, unknown>;
  due_date: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  reviewed_by: string | null;
  reviewed_by_name: string | null;
  review_notes: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface DeliverableSummary {
  id: number;
  nanoid: string;
  project: string;
  project_name: string | null;
  deliverable_type: string | null;
  title: string;
  status: DeliverableStatus;
  metadata: Record<string, unknown>;
  due_date: string | null;
  order: number;
  created_at: string;
}

export interface CreateProjectBody {
  name: string;
  description?: string;
  company: string;
  client?: string | null;
  category?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  start_date?: string | null;
  deadline?: string | null;
}

/* ──────────────────────────────────────────────────────────────────────
 * Social Manager types
 *
 * Mirrors the Django serializers in the `socialmanager` app. Field names
 * match `frontapp/src/features/socialmanager/apptypes/socialmanager.ts`.
 * All endpoints are tenant-scoped; the active workspace slug is forwarded
 * as the ``X-Workspace`` header on every call.
 * ────────────────────────────────────────────────────────────────────── */

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "x"
  | "linkedin"
  | "tiktok"
  | "pinterest"
  | "youtube"
  | "threads"
  | "bluesky"
  | "mastodon"
  | "google_business"
  | "start_page";

export interface SocialMediaPlatform {
  id: string;
  nanoid: string;
  name: string;
  slug: string;
  svg: string;
  color: string | null;
  text_color: string | null;
  hover_color: string | null;
  client_id: string | null;
  redirect_uri: string | null;
  scopes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformContentFormat {
  id: string;
  nanoid: string;
  platform: string;
  format: string;
  code: string;
  display_name: string;
  is_active: boolean;
}

export interface MediaConstraint {
  id: string;
  nanoid: string;
  content_constraint: string;
  media_type: "image" | "video" | "text";
  min_width: number | null;
  max_width: number | null;
  min_height: number | null;
  max_height: number | null;
  aspect_ratio: string;
  min_duration: number | null;
  max_duration: number | null;
  max_file_size: number | null;
  allowed_formats: string[] | null;
  extra_rules: Record<string, unknown> | null;
}

export interface ContentConstraint {
  id: string;
  nanoid: string;
  platform: string;
  content_format: string;
  format_code: string;
  display_name: string;
  character_limit: number | null;
  max_hashtags: number | null;
  is_ephemeral: boolean;
  publishing_api: string;
  publishing_endpoint: string;
  reference_url: string;
  extra_rules: Record<string, unknown> | null;
  media_constraints: MediaConstraint[];
}

export interface ManagedChannel {
  id: string;
  nanoid: string;
  social_account: string;
  platform: string;
  platform_name: string;
  account_name: string;
  page_id: string;
  page_name: string;
  username: string;
  link: string;
  bio: string;
  category: string;
  website: string;
  profile_picture_url: string;
  cover_photo_url: string;
  token_expires_at: string | null;
  is_active: boolean;
  follower_count: number;
  created_at: string;
  updated_at: string;
}

export interface SocialAccount {
  nanoid: string;
  platform: string;
  social_account_uid: string;
  account_name: string;
  account_first_name: string;
  account_last_name: string;
  short_name: string;
  profile_picture_url: string;
  token_expires_at: string | null;
  is_active: boolean;
  extra_data: Record<string, unknown>;
  connected_at: string;
  managed_pages: ManagedChannel[];
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  nanoid: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PostRecipientStatus = "pending" | "published" | "failed";

export interface PostRecipient {
  id: string;
  nanoid: string;
  scheduled_post: string;
  managed_page: string;
  managed_page_name: string;
  content: string | null;
  media_urls: string[];
  media_image_urls?: string[];
  link_url: string;
  status: PostRecipientStatus;
  external_post_id: string;
  error_message: string;
  published_at: string | null;
}

export type PostCommentType = "internal" | "audience";
export type PostCommentStatus = "pending" | "published" | "failed" | "received";

export interface PostComment {
  id: string;
  nanoid: string;
  scheduled_post: string;
  managed_page: string;
  comment_type: PostCommentType;
  author_name: string;
  author_platform_id: string;
  external_comment_id: string;
  content: string;
  status: PostCommentStatus;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ScheduledPostStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "canceled";

export interface ScheduledPost {
  id: string;
  nanoid: string;
  campaign: string | null;
  campaign_name: string | null;
  content: string;
  media_urls: string[];
  media_image_urls?: string[];
  scheduled_at: string;
  status: ScheduledPostStatus;
  external_post_id: string;
  error_message: string;
  published_at: string | null;
  is_queue_item: boolean;
  synced_from_channel: boolean;
  comments_count: number;
  reactions_count: number;
  recipients: PostRecipient[];
  created_at: string;
  updated_at: string;
}

export interface Hashtag {
  id: string;
  nanoid: string;
  tag: string;
  category: string;
  usage_count: number;
}

export interface PostQueue {
  id: string;
  nanoid: string;
  name: string;
  managed_page: string | null;
  is_active: boolean;
}

export interface PostQueueItem {
  id: string;
  nanoid: string;
  queue: string;
  scheduled_post: string | null;
  position: number;
  interval_minutes: number;
}

export interface MetricSnapshot {
  id: string;
  nanoid: string;
  managed_page: string;
  metric: string;
  value: number;
  period: string;
  end_time: string;
}

/* ── Payloads and forms ──────────────────────────────────────────────── */

export interface SocialAccountForm {
  platform: string;
  name: string;
  username?: string;
  external_id: string;
  token_expires_at?: string | null;
}

export interface CampaignForm {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface ScheduledPostRecipientInput {
  managed_page: string;
  content?: string;
  media_urls?: string[];
  media_assets?: string[];
  link_url?: string;
  format?: string;
}

export interface ScheduledPostForm {
  campaign?: string | null;
  content: string;
  media_urls?: string[];
  media_assets?: string[];
  scheduled_at?: string;
  status?: string;
  format?: string;
  recipients?: ScheduledPostRecipientInput[];
  first_comments?: Record<string, string>;
}

export interface RecipientVariant {
  page: ManagedChannel;
  content: string;
  media_urls: string[];
  link_url?: string;
  format?: string;
}

export interface OauthInitResult {
  auth_url: string;
  state: string;
}

export interface OauthRedirectUriResult {
  platform: string;
  redirect_uri: string;
  secret_env_var: string;
}

export interface DiscoverChannelEntity {
  entity_id: string;
  name: string;
  username?: string;
  picture_url?: string;
  category?: string;
  follower_count?: number;
  already_connected: boolean;
}

export interface DiscoverChannelsResult {
  entities: DiscoverChannelEntity[];
  notes?: { page_id?: string; page_name?: string; reason: string }[];
}

export interface SyncChannelSelectionResult {
  channels: ManagedChannel[];
}

export interface RevokeAccountResult {
  revoked: boolean;
  account: SocialAccount;
  warning?: string;
}

export interface ConnectedInstagramResult {
  page_id: string | null;
  instagram_business_account: { id: string } | null;
  connected: boolean;
}

export interface TaskResponse {
  task_id: string;
  status?: string;
  result?: string | null;
}

export interface SyncTaskResult {
  task_id: string;
}

export interface PostsSyncStatusResult {
  status: string;
  result?: {
    created: number;
    skipped: number;
    errors: { page: string; error: string }[];
  } | null;
}

export interface CommentsSyncResult {
  task_id: string;
}

export interface AnalyticsSyncStatusResult {
  status: string;
  result?: {
    created: number;
    updated: number;
    since: string;
    until: string;
    errors: { page: string; error: string }[];
  } | null;
}
