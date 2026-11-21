import { defineStore } from "pinia";
import { useAuthStore } from "~/stores/auth";

export interface MyEntry {
  id: number;
  material_name: string;
  unit: string;
  quantity: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export const useMyEntriesStore = defineStore("myEntries", () => {
  const config = useRuntimeConfig();
  const auth = useAuthStore();

  const items = ref<MyEntry[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchMine() {
    loading.value = true;
    error.value = null;
    try {
      items.value = await $fetch<MyEntry[]>("/api/entries/mine", {
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
      error.value = "No se pudieron cargar tus entregas";
    } finally {
      loading.value = false;
    }
  }

    return { items, loading, error, fetchMine };
});