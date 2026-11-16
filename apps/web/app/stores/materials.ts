import { defineStore } from "pinia";

export interface Material {
  id: number;
  name: string;
  unit: string;
  points_per_unit: number;
}

export const useMaterialsStore = defineStore("materials", () => {
  const items = ref<Material[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const config = useRuntimeConfig();

  async function fetchMaterials() {
    loading.value = true;
    error.value = null;
    try {
      items.value = await $fetch<Material[]>("/api/materials", {
        baseURL: config.public.apiBase,
      });
    } catch {
      items.value = [];
      error.value = "No se pudo cargar el catálogo de materiales";
    } finally {
      loading.value = false;
    }
  }

  return { items, loading, error, fetchMaterials };
});