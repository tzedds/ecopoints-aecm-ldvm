import { defineStore } from "pinia";
import { useAuthStore } from "~/stores/auth";

export interface PendingEntry {
  id: number;
  user_name: string;
  material_name: string;
  unit: string;
  quantity: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export const usePendingEntriesStore = defineStore("pendingEntries", () => {
  const config = useRuntimeConfig();
  const auth = useAuthStore();
  const apiBase = config.public.apiBase as string;

  const items = ref<PendingEntry[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const feedback = ref<{ type: "ok" | "error"; text: string } | null>(null);
  const processingId = ref<number | null>(null);

  function authHeaders() {
    return { Authorization: `Bearer ${auth.token}` };
  }

  // Sesión vencida: se cierra y se manda al login
  async function handleExpired(e: unknown) {
    const err = e as { statusCode?: number };
    if (err.statusCode === 401) {
      auth.logout();
      await navigateTo("/login");
      return true;
    }
    return false;
  }

  async function fetchPending() {
    loading.value = true;
    error.value = null;
    try {
      items.value = await $fetch<PendingEntry[]>("/api/entries", {
        baseURL: apiBase,
        headers: authHeaders(),
        query: { status: "pending" },
      });
    } catch (e) {
      if (await handleExpired(e)) return;
      error.value = "No se pudieron cargar las entregas pendientes";
    } finally {
      loading.value = false;
    }
  }

  async function review(id: number, action: "approve" | "reject") {
    processingId.value = id;
    feedback.value = null;
    try {
      await $fetch(`/api/entries/${id}/${action}`, {
        method: "PATCH",
        baseURL: apiBase,
        headers: authHeaders(),
      });
      items.value = items.value.filter((item) => item.id !== id);
      feedback.value = {
        type: "ok",
        text: action === "approve" ? "Entrega aprobada" : "Entrega rechazada",
      };
    } catch (e) {
      if (await handleExpired(e)) return;
      const err = e as { statusCode?: number; data?: { error?: string } };
      if (err.statusCode === 409) {
        feedback.value = { type: "error", text: "Esta entrega ya fue procesada" };
        await fetchPending();
      } else {
        feedback.value = {
          type: "error",
          text: err.data?.error ?? "No se pudo completar la acción",
        };
      }
    } finally {
      processingId.value = null;
    }
  }

  return { items, loading, error, feedback, processingId, fetchPending, review };
});