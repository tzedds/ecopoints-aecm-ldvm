<script setup lang="ts">
import { usePointsStore } from "~/stores/points";
import { useAuthStore } from "~/stores/auth";

// Solo el participante puede ver esta pantalla
definePageMeta({
  middleware: () => {
    const auth = useAuthStore();
    if (auth.user?.role !== "participant") {
      return navigateTo("/");
    }
  },
});

const store = usePointsStore();

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-MX");
}

onMounted(() => store.fetchPoints());
</script>

<template>
  <section class="rounded-lg bg-white p-6 shadow">
    <h2 class="mb-4 text-lg font-semibold">Mis puntos</h2>

    <div v-if="store.loading" class="flex items-center gap-3 text-gray-500">
      <div class="h-5 w-5 animate-spin rounded-full border-2 border-green-700 border-t-transparent"></div>
      Cargando tus puntos...
    </div>

    <div v-else-if="store.error" class="rounded bg-red-100 p-3 text-red-700">
      <p class="mb-2">{{ store.error }}</p>
      <button
        class="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
        @click="store.fetchPoints()"
      >
        Reintentar
      </button>
    </div>

    <div v-else>
      <div class="mb-6 rounded-lg bg-green-50 p-4 text-center">
        <p class="text-sm text-gray-500">Puntos acumulados</p>
        <p class="text-4xl font-bold text-green-700">{{ store.total }}</p>
      </div>

      <p v-if="store.movements.length === 0" class="text-gray-500">
        Aún no tienes puntos. Cuando el encargado apruebe una entrega, aparecerá aquí.
      </p>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b text-gray-500">
            <tr>
              <th class="py-2 pr-4">Material</th>
              <th class="py-2 pr-4">Cantidad</th>
              <th class="py-2 pr-4">Puntos</th>
              <th class="py-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in store.movements" :key="m.id" class="border-b last:border-0">
              <td class="py-2 pr-4">{{ m.material_name }}</td>
              <td class="py-2 pr-4">{{ m.quantity }} {{ m.unit }}</td>
              <td class="py-2 pr-4 font-semibold text-green-700">+{{ m.points }}</td>
              <td class="py-2">{{ formatDate(m.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>