<script setup lang="ts">
import { useMyEntriesStore } from "~/stores/myEntries";

const store = useMyEntriesStore();

const statusInfo = {
  pending: { label: "Pendiente", classes: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Aprobada", classes: "bg-green-100 text-green-800" },
  rejected: { label: "Rechazada", classes: "bg-red-100 text-red-800" },
} as const;

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-MX");
}

onMounted(() => store.fetchMine());
</script>

<template>
  <section class="rounded-lg bg-white p-6 shadow">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold">Mis entregas</h2>
      <button
        class="rounded bg-green-700 px-3 py-1 text-sm text-white hover:bg-green-800"
        @click="store.fetchMine()"
      >
        Actualizar
      </button>
    </div>

    <p v-if="store.loading" class="text-gray-500">Cargando...</p>

    <div v-else-if="store.error" class="rounded bg-red-100 p-3 text-red-700">
      {{ store.error }}
    </div>

    <div v-else-if="store.items.length === 0" class="text-gray-500">
      Aún no has registrado entregas.
      <NuxtLink to="/entries/new" class="text-green-700 underline">
        Registrar una entrega
      </NuxtLink>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="border-b text-gray-500">
          <tr>
            <th class="py-2 pr-4">Material</th>
            <th class="py-2 pr-4">Cantidad</th>
            <th class="py-2 pr-4">Estado</th>
            <th class="py-2">Fecha</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in store.items" :key="entry.id" class="border-b last:border-0">
            <td class="py-2 pr-4">{{ entry.material_name }}</td>
            <td class="py-2 pr-4">{{ entry.quantity }} {{ entry.unit }}</td>
            <td class="py-2 pr-4">
              <span
                class="rounded px-2 py-1 text-xs font-medium"
                :class="statusInfo[entry.status].classes"
              >
                {{ statusInfo[entry.status].label }}
              </span>
            </td>
            <td class="py-2">{{ formatDate(entry.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>