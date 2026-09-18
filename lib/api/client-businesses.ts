import { serverFetch, serverMutate } from "./server-fetch";
import type {
  ClientBusiness,
  CreateClientBusinessBody,
  Paginated,
  UpdateClientBusinessBody,
} from "./types";

export async function listClientBusinesses(): Promise<ClientBusiness[]> {
  const payload = await serverFetch<
    Paginated<ClientBusiness> | ClientBusiness[]
  >("/apis/workspaces/client-businesses/");
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

export async function getClientBusiness(nanoid: string): Promise<ClientBusiness> {
  return serverFetch<ClientBusiness>(
    `/apis/workspaces/client-businesses/${nanoid}/`,
  );
}

export async function createClientBusiness(
  body: CreateClientBusinessBody,
): Promise<ClientBusiness> {
  return serverMutate<ClientBusiness>("/apis/workspaces/client-businesses/", {
    body,
    method: "POST",
  });
}

export async function updateClientBusiness(
  nanoid: string,
  patch: UpdateClientBusinessBody,
): Promise<ClientBusiness> {
  return serverMutate<ClientBusiness>(
    `/apis/workspaces/client-businesses/${nanoid}/`,
    { body: patch, method: "PATCH" },
  );
}
