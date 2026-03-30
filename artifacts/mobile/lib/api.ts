import Constants from "expo-constants";

const DEV_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN || Constants.expoConfig?.extra?.domain || "";

function getBaseUrl(): string {
  if (DEV_DOMAIN) {
    return `https://${DEV_DOMAIN}/api-server/api`;
  }
  return "http://localhost:8080/api";
}

const BASE = getBaseUrl();

async function request<T = any>(path: string, opts?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts?.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body: any) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};
