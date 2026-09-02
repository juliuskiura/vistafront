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
