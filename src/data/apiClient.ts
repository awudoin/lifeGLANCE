const DEFAULT_API_BASE = "http://127.0.0.1:3001/api";

function resolveApiBase(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  return typeof configured === "string" && configured.trim().length > 0
    ? configured.replace(/\/$/, "")
    : DEFAULT_API_BASE;
}

const API_BASE = resolveApiBase();

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`API request failed (${response.status} ${response.statusText}): ${bodyText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
