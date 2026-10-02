import { getWorkspaceContext } from "./workspace";

export async function getApiContext() {
  const context = await getWorkspaceContext();
  if (!context) return { ok: false as const, status: 401, error: "Non authentifié." };
  if (context.error) return { ok: false as const, status: 503, error: context.error };
  if (!context.tenant || !context.membership) {
    return { ok: false as const, status: 409, error: "Espace entreprise non configuré." };
  }
  return { ok: true as const, context };
}
