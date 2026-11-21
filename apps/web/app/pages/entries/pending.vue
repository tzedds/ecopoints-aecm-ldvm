<script setup lang="ts">
import { usePendingEntriesStore } from "~/stores/pendingEntries";
import { useAuthStore } from "~/stores/auth";

// Solo el encargado puede ver este panel
definePageMeta({
  middleware: () => {
    const auth = useAuthStore();
    if (auth.user?.role !== "manager") {
      return navigateTo("/");
    }
  },
});

const store = usePendingEntriesStore();

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-MX");
}

onMounted(() => store.fetchPending());
</script>

<template>
  <section class="rounded-lg bg-white p-6 shadow">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold">Entregas pendientes</h2>
      <button
        class="rounded bg-green-700 px-3 py-1 text-sm text-white hover:bg-green-800"
        @click="store.fetchPending()"
      >
        Actualizar
      </button>
    </div>

    <p
      v-if="store.feedback"
      class="mb-4 rounded p-3 text-sm"
      :class="store.feedback.type === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'"
    >
      {{ store.feedback.text }}
    </p>

    <p v-if="store.loading" class="text-gray-500">Cargando...</p>

    <div v-else-if="store.error" class="rounded bg-red-100 p-3 text-red-700">
      {{ store.error }}
    </div>

    <p v-else-if="store.items.length === 0" class="text-gray-500">
      No hay entregas pendientes.
    </p>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="border-b text-gray-500">
          <tr>
            <th class="py-2 pr-4">Participante</th>
            <th class="py-2 pr-4">Material</th>
            <th class="py-2 pr-4">Cantidad</th>
            <th class="py-2 pr-4">Fecha</th>
            <th class="py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in store.items" :key="entry.id" class="border-b last:border-0">
            <td class="py-2 pr-4">{{ entry.user_name }}</td>
            <td class="py-2 pr-4">{{ entry.material_name }}</td>
            <td class="py-2 pr-4">{{ entry.quantity }} {{ entry.unit }}</td>
            <td class="py-2 pr-4">{{ formatDate(entry.created_at) }}</td>
            <td class="flex gap-2 py-2">
              <button
                class="rounded bg-green-700 px-3 py-1 text-white hover:bg-green-800 disabled:opacity-50"
                :disabled="store.processingId === entry.id"
                @click="store.review(entry.id, 'approve')"
              >
                Aprobar
              </button>
              <button
                class="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700 disabled:opacity-50"
                :disabled="store.processingId === entry.id"
                @click="store.review(entry.id, 'reject')"
              >
                Rechazar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>