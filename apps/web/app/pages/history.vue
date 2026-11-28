<script setup lang="ts">
import { useHistoryStore } from "~/stores/history";
import { useAuthStore } from "~/stores/auth";

const store = useHistoryStore();
const auth = useAuthStore();

const statusInfo = {
  pending: { label: "Pendiente", classes: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Aprobada", classes: "bg-green-100 text-green-800" },
  rejected: { label: "Rechazada", classes: "bg-red-100 text-red-800" },
} as const;

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("es-MX") : "—";
}

onMounted(() => store.start());
</script>

<template>
  <section class="rounded-lg bg-white p-6 shadow">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-semibold">Historial de entregas</h2>

      <label class="flex items-center gap-2 text-sm">
        Estado
        <select
          v-model="store.status"
          class="rounded border border-gray-300 px-2 py-1"
          @change="store.applyFilter()"
        >
          <option value="">Todos</option>
          <option value="pending">Pendiente</option>
          <option value="approved">Aprobada</option>
          <option value="rejected">Rechazada</option>
        </select>
      </label>
    </div>

    <!-- Cargando -->
    <div v-if="store.loading" class="flex items-center gap-3 text-gray-500">
      <div class="h-5 w-5 animate-spin rounded-full border-2 border-green-700 border-t-transparent"></div>
      Cargando historial...
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="rounded bg-red-100 p-3 text-red-700">
      <p class="mb-2">{{ store.error }}</p>
      <button
        class="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
        @click="store.fetchHistory()"
      >
        Reintentar
      </button>
    </div>

    <!-- Sin resultados -->
    <p v-else-if="store.items.length === 0" class="text-gray-500">
      No hay entregas para mostrar.
    </p>

    <!-- Tabla -->
    <div v-else>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b text-gray-500">
            <tr>
              <th v-if="auth.isManager" class="py-2 pr-4">Participante</th>
              <th class="py-2 pr-4">Material</th>
              <th class="py-2 pr-4">Cantidad</th>
              <th class="py-2 pr-4">Estado</th>
              <th class="py-2 pr-4">Puntos</th>
              <th class="py-2 pr-4">Fecha</th>
              <th v-if="auth.isManager" class="py-2 pr-4">Validada por</th>
              <th v-if="auth.isManager" class="py-2">Fecha de validación</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in store.items" :key="entry.id" class="border-b last:border-0">
              <td v-if="auth.isManager" class="py-2 pr-4">{{ entry.user_name }}</td>
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
              <td class="py-2 pr-4">
                <span v-if="entry.points !== null" class="font-semibold text-green-700">
                  +{{ entry.points }}
                </span>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="py-2 pr-4">{{ formatDate(entry.created_at) }}</td>
              <td v-if="auth.isManager" class="py-2 pr-4">{{ entry.validated_by_name ?? "—" }}</td>
              <td v-if="auth.isManager" class="py-2">{{ formatDate(entry.validated_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div class="mt-4 flex items-center justify-between text-sm">
        <span class="text-gray-500">
          Página {{ store.page }} de {{ store.totalPages }} ({{ store.total }} entregas)
        </span>
        <div class="flex gap-2">
          <button
            class="rounded border border-gray-300 px-3 py-1 hover:bg-gray-100 disabled:opacity-40"
            :disabled="store.page <= 1"
            @click="store.goToPage(store.page - 1)"
          >
            Anterior
          </button>
          <button
            class="rounded border border-gray-300 px-3 py-1 hover:bg-gray-100 disabled:opacity-40"
            :disabled="store.page >= store.totalPages"
            @click="store.goToPage(store.page + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  </section>
</template>