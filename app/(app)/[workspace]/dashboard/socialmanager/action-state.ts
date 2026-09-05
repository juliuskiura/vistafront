export interface CampaignActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialCampaignState: CampaignActionState = { status: "idle" };

export interface PostActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialPostState: PostActionState = { status: "idle" };

export interface QueueActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialQueueState: QueueActionState = { status: "idle" };

export interface QueueItemActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export const initialQueueItemState: QueueItemActionState = { status: "idle" };

export interface AccountActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export const initialAccountState: AccountActionState = { status: "idle" };

export interface PlatformActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialPlatformState: PlatformActionState = { status: "idle" };
