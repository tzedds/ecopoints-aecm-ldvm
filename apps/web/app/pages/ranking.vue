<script setup lang="ts">
import { useRankingStore } from "~/stores/ranking";
import { useAuthStore } from "~/stores/auth";

const ranking = useRankingStore();
const auth = useAuthStore();

onMounted(() => ranking.fetchRanking());
</script>

<template>
  <section class="rounded-lg bg-white p-6 shadow">
    <h2 class="mb-2 text-lg font-semibold">Ranking de participantes</h2>
    <p class="mb-4 text-sm text-gray-500">
      Puntos acumulados por entregas aprobadas. Si hay empate, comparten posición.
    </p>

    <p v-if="ranking.loading" class="text-gray-500">Cargando ranking...</p>

    <div v-else-if="ranking.error" class="rounded bg-red-100 p-3 text-red-700">
      <p>{{ ranking.error }}</p>
      <button
        class="mt-3 rounded bg-green-700 px-4 py-2 text-white hover:bg-green-800"
        @click="ranking.fetchRanking()"
      >
        Reintentar
      </button>
    </div>

    <p v-else-if="ranking.items.length === 0" class="text-gray-500">
      Todavía no hay participantes en el ranking.
    </p>

    <ol v-else class="space-y-2">
      <li
        v-for="row in ranking.items"
        :key="row.user_id"
        class="flex items-center justify-between rounded border p-4"
        :class="
          row.user_id === auth.user?.id
            ? 'border-green-600 bg-green-50'
            : 'border-gray-200'
        "
      >
        <div class="flex items-center gap-4">
          <span
            class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
            :class="row.position === 1 ? 'bg-yellow-300 text-yellow-900' : 'bg-gray-100 text-gray-700'"
          >
            {{ row.position }}
          </span>
          <p class="font-medium">
            {{ row.name }}
            <span
              v-if="row.user_id === auth.user?.id"
              class="ml-2 rounded-full bg-green-700 px-2 py-0.5 text-xs font-semibold text-white"
            >
              Tú
            </span>
          </p>
        </div>
        <p class="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
          {{ row.total_points }} pts
        </p>
      </li>
    </ol>
  </section>
</template>