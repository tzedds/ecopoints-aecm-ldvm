import { defineStore } from "pinia";
import { useAuthStore } from "~/stores/auth";

export interface NewEntry {
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
  const auth = useAuthStore();

  // Devuelve true si la entrega se guardó, false si hubo error
  async function createEntry(payload: NewEntry) {
    submitting.value = true;
    error.value = null;
    lastEntry.value = null;
    try {
      lastEntry.value = await $fetch<Entry>("/api/entries", {
        method: "POST",
        baseURL: config.public.apiBase as string,
        headers: { Authorization: `Bearer ${auth.token}` },
        body: payload,
      });
      return true;
    } catch (e) {
            const err = e as { statusCode?: number; data?: { error?: string } };
      // Sesion vencida o tokens invalidos, redirige al login
      if (err.statusCode === 401) {
        auth.logout();
        await navigateTo("/login");
        return false;
      }
      // si la API respondio con un error, muestra su mensaje, si no no hubo conexión
      error.value = err.data?.error ?? "No se pudo conectar con la API";
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