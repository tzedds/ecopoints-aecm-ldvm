import { defineStore } from "pinia";
import { useAuthStore } from "~/stores/auth";

export interface RankingRow {
  position: number;
  user_id: number;
  name: string;
  total_points: number;
}

export const useRankingStore = defineStore("ranking", () => {
  const config = useRuntimeConfig();
  const auth = useAuthStore();

  const items = ref<RankingRow[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchRanking() {
    loading.value = true;
    error.value = null;
    try {
      items.value = await $fetch<RankingRow[]>("/api/ranking", {
        baseURL: config.public.apiBase as string,
        headers: { Authorization: `Bearer ${auth.token}` },
      });
    } catch (e) {
      const err = e as { statusCode?: number };
      // Sesión vencida o token inválido: se manda al login
      if (err.statusCode === 401) {
        auth.logout();
        await navigateTo("/login");
        return;
      }
      error.value = "No se pudo cargar el ranking";
    } finally {
      loading.value = false;
    }
  }

  return { items, loading, error, fetchRanking };
});