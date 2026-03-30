import { Platform } from "react-native";
import Constants from "expo-constants";

function getBaseUrl(): string {
  if (Platform.OS === "web") {
    return "/api";
  }

  const devDomain =
    process.env.EXPO_PUBLIC_DOMAIN ||
    Constants.expoConfig?.extra?.domain ||
    "";
  if (devDomain) {
    return `https://${devDomain}/api`;
  }

  return "http://localhost:8080/api";
}

const BASE = getBaseUrl();

async function request<T = any>(path: string, opts?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`;
  console.log("[API]", opts?.method || "GET", url);
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts?.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    const errMsg = body.error || `HTTP ${res.status}`;
    console.error("[API] Error:", errMsg);
    throw new Error(errMsg);
  }
  return res.json();
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body: any) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};
