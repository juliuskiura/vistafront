export type NextStatus = "development" | "staging" | "production";

export const APP_BASE_URL = "https://app.vistasolve.net";

const DEV_BACKEND_URL = "http://127.0.0.1:8000";
const DEV_PUBLIC_BACKEND_URL = "http://localhost:8000";

function resolveStatus(value: string | undefined): NextStatus {
  if (value === "staging" || value === "production") return value;
  return "development";
}

export const NEXT_STATUS: NextStatus = resolveStatus(
  process.env.NEXT_PUBLIC_STATUS ?? process.env.NEXT_STATUS,
);

export const isDeployedBuild = NEXT_STATUS === "staging" || NEXT_STATUS === "production";

export const BACKEND_URL =
  process.env.BACKEND_URL ?? (isDeployedBuild ? APP_BASE_URL : DEV_BACKEND_URL);

export const PUBLIC_BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  (isDeployedBuild ? APP_BASE_URL : DEV_PUBLIC_BACKEND_URL);

export const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET ?? (isDeployedBuild ? APP_BASE_URL : DEV_BACKEND_URL);