export interface CreateCompanyActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export const initialCreateCompanyState: CreateCompanyActionState = {
  status: "idle",
};

export interface CreateTierClassificationActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export const initialCreateTierClassificationState: CreateTierClassificationActionState = {
  status: "idle",
};
