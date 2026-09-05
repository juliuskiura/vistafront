import { serverFetch, serverMutate } from "./server-fetch";
import type {
  ClientBusiness,
  CreateClientBusinessBody,
  UpdateClientBusinessBody,
} from "./types";

export async function listClientBusinesses(): Promise<ClientBusiness[]> {
  return serverFetch<ClientBusiness[]>("/apis/workspaces/client-businesses/");
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
