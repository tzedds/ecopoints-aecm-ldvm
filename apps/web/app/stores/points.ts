import { defineStore } from "pinia";
import { useAuthStore } from "~/stores/auth";

export interface PointMovement {
  id: number;
  entry_id: number;
  points: number;
  material_name: string;
  unit: string;
  quantity: number;
  created_at: string;
}

interface PointsResponse {
  total: number;
  movements: PointMovement[];
}

export const usePointsStore = defineStore("points", () => {
  const config = useRuntimeConfig();
  const auth = useAuthStore();

  const total = ref(0);
  const movements = ref<PointMovement[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchPoints() {
    loading.value = true;
    error.value = null;
    try {
      const data = await $fetch<PointsResponse>("/api/points/me", {
        baseURL: config.public.apiBase as string,
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      total.value = data.total;
      movements.value = data.movements;
    } catch (e) {
      const err = e as { statusCode?: number };
      // Sin token o token vencido se cierra la sesión y se manda al login
      if (err.statusCode === 401) {
        auth.logout();
        await navigateTo("/login");
        return;
      }
      error.value =
        (err.statusCode ?? 0) >= 500
          ? "Hubo un problema en el servidor. Intenta de nuevo."
          : "No se pudieron cargar tus puntos";
    } finally {
      loading.value = false;
    }
  }

  return { total, movements, loading, error, fetchPoints };
});