/**
 * Assistant provider configuration, read from env. Defaults target the
 * z.ai Anthropic-compatible endpoint (GLM Coding Plan key works as
 * ASSISTANT_API_KEY with ASSISTANT_AUTH_MODE="authToken"). Swapping to the
 * standard z.ai platform or real Anthropic is a matter of these three vars —
 * no code changes.
 *
 * NOTE: layouts of statically prerendered pages (marketing, auth) bake the
 * enabled flag at build time — adding the key on Vercel requires a redeploy
 * for the widget to appear there.
 */

export type AssistantConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  authMode: "authToken" | "apiKey";
};

export function getAssistantConfig(): AssistantConfig | null {
  const apiKey = process.env.ASSISTANT_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    baseUrl: process.env.ASSISTANT_BASE_URL?.trim() || "https://api.z.ai/api/anthropic",
    apiKey,
    model: process.env.ASSISTANT_MODEL?.trim() || "glm-5.3-flash",
    authMode: process.env.ASSISTANT_AUTH_MODE === "apiKey" ? "apiKey" : "authToken",
  };
}

/** Server-component gate used by layouts mounting the widget. */
export function assistantEnabled(): boolean {
  return getAssistantConfig() !== null;
}
