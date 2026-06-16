import { api } from "@/lib/api";

// Additive write-through sync to the KEAS backend of record (POST /api/keas/sync).
// No-op for empty batches. Errors are the caller's responsibility to swallow.
export async function pushEntity(entity: string, records: unknown[]): Promise<void> {
  if (!Array.isArray(records) || records.length === 0) return;
  await api.post("/keas/sync", { entity, records });
}
