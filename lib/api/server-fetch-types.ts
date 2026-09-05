export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
  workspace?: string;
  _retry?: boolean;
}

export interface MutateOptions {
  body: unknown;
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  workspace?: string;
  _retry?: boolean;
}

export class ServerFetchError extends Error {
  constructor(
    public status: number,
    public body: string,
    public path: string
  ) {
    super(`Server fetch failed: ${status} ${path}`);
    this.name = "ServerFetchError";
  }
}
