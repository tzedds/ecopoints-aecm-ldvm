import { defineStore } from "pinia";

interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

export const useHealthStore = defineStore("health", () => {
  const data = ref<HealthResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const config = useRuntimeConfig();

  async function check() {
    loading.value = true;
    error.value = null;
    try {
      data.value = await $fetch<HealthResponse>("/api/health", {
        baseURL: config.public.apiBase,
      });
    } catch {
      data.value = null;
      error.value = "No se pudo conectar con la API";
    } finally {
      loading.value = false;
    }
  }

  return { data, loading, error, check };
});