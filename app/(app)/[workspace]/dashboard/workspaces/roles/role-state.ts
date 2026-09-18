export interface RoleActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialRoleState: RoleActionState = { status: "idle" };
