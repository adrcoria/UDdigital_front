/**
 * IDs estáticos del catálogo de ganadería.
 * Fuente: GET /bovine-type y GET /batch-type
 */

// ── Tipos de Bovino (bovine-type) ─────────────────────────────────────────────
export const BOVINE_TYPE_IDS = {
  BECERRO:  "d9dd64e4-0698-45c6-a266-f36e24f67db0",
  BECERRA:  "fe00664b-b4c5-4e79-a1ff-b8784f580da4",
  TORETE:   "36e898e6-4809-4daa-8fa1-4dc8106afb59",
  VAQUILLA: "f6317edc-7d03-42e7-9d3b-e2a2b27f52c8",
  TORO:     "5c0e981b-ee94-47f4-b7d8-9579a6baaf30",
  VACA:     "4aaa292c-939a-4db1-8611-68e21915dfb5",
  SEMENTAL: "02727dec-0faa-40b6-9f7f-057729c3d8d6",
} as const;

// ── Tipos de Lote (batch-type) ────────────────────────────────────────────────
export const BATCH_TYPE_IDS = {
  ENGORDA:          "5ed37fc4-28a6-4e21-9541-0ab072b8186e",
  PRODUCCION_LECHE: "e5c750ea-b81d-46e3-92fb-5237df6f4418",
} as const;
