import { defineStore } from "pinia";
import { useAuthStore } from "~/stores/auth";

export type EntryStatus = "pending" | "approved" | "rejected";

export interface HistoryItem {
  id: number;
  user_name: string;
  material_name: string;
  unit: string;
  quantity: number;
  status: EntryStatus;
  points: number | null;
  created_at: string;
  validated_by_name: string | null;
  validated_at: string | null;
}

interface HistoryResponse {
  data: HistoryItem[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

const PAGE_SIZE = 10;

export const useHistoryStore = defineStore("history", () => {
  const config = useRuntimeConfig();
  const auth = useAuthStore();

  const items = ref<HistoryItem[]>([]);
  const page = ref(1);
  const totalPages = ref(0);
  const total = ref(0);
  const status = ref<"" | EntryStatus>("");
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchHistory() {
    loading.value = true;
    error.value = null;
    try {
      const query: Record<string, string | number> = {
        page: page.value,
        limit: PAGE_SIZE,
      };
      if (status.value) query.status = status.value;

      const res = await $fetch<HistoryResponse>("/api/history", {
        baseURL: config.public.apiBase as string,
        headers: { Authorization: `Bearer ${auth.token}` },
        query,
      });
      items.value = res.data;
      total.value = res.total;
      totalPages.value = res.total_pages;
    } catch (e) {
      const err = e as { statusCode?: number };
      // Sin token o token vencido: se cierra la sesión y se manda al login
      if (err.statusCode === 401) {
        auth.logout();
        await navigateTo("/login");
        return;
      }
      error.value =
        (err.statusCode ?? 0) >= 500
          ? "Hubo un problema en el servidor. Intenta de nuevo."
          : "No se pudo cargar el historial";
    } finally {
      loading.value = false;
    }
  }

  // Al entrar a la pantalla se empieza desde cero
  function start() {
    status.value = "";
    page.value = 1;
    return fetchHistory();
  }

  // Al cambiar el filtro se vuelve a la primera página
  function applyFilter() {
    page.value = 1;
    return fetchHistory();
  }

  function goToPage(n: number) {
    if (n < 1 || n > totalPages.value) return;
    page.value = n;
    return fetchHistory();
  }

  return {
    items, page, totalPages, total, status, loading, error,
    fetchHistory, start, applyFilter, goToPage,
  };
});