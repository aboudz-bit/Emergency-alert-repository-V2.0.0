// Typed fetch client for the KEAS backend of record (api-server /api/keas).
const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

/** GET /api/keas/list/:entity -> records[] */
export async function listEntity<T>(entity: string): Promise<T[]> {
  const data = await apiGet<{ records: T[] }>(`/keas/list/${entity}`);
  return data.records ?? [];
}
