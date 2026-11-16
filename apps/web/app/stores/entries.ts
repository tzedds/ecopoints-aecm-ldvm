import { defineStore } from "pinia";

export interface NewEntry {
  user_id: number;
  material_id: number;
  quantity: number;
}

export interface Entry {
  id: number;
  user_id: number;
  material_id: number;
  quantity: number;
  status: string;
  created_at: string;
}

export const useEntriesStore = defineStore("entries", () => {
  const submitting = ref(false);
  const error = ref<string | null>(null);
  const lastEntry = ref<Entry | null>(null);

  const config = useRuntimeConfig();

  // Devuelve true si la entrega se guardó, false si hubo error
  async function createEntry(payload: NewEntry) {
    submitting.value = true;
    error.value = null;
    lastEntry.value = null;
    try {
      lastEntry.value = await $fetch<Entry>("/api/entries", {
        method: "POST",
        baseURL: config.public.apiBase,
        body: payload,
      });
      return true;
    } catch (e: any) {
      // Si la API respondió con un error, muestra su mensaje; si no, no hubo conexión
      error.value = e?.data?.error ?? "No se pudo conectar con la API";
      return false;
    } finally {
      submitting.value = false;
    }
  }

  function reset() {
    error.value = null;
    lastEntry.value = null;
  }

  return { submitting, error, lastEntry, createEntry, reset };
});