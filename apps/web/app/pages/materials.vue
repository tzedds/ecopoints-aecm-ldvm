<script setup lang="ts">
import { useMaterialsStore } from "~/stores/materials";

const materials = useMaterialsStore();

// onMounted solo corre en el navegador, igual que en la página de inicio
onMounted(() => materials.fetchMaterials());
</script>

<template>
  <section class="rounded-lg bg-white p-6 shadow">
    <h2 class="mb-2 text-lg font-semibold">Catálogo de materiales</h2>
    <p class="mb-4 text-sm text-gray-500">
      Materiales aceptados y los puntos que otorga cada unidad entregada.
    </p>

    <p v-if="materials.loading" class="text-gray-500">Cargando catálogo...</p>

    <div v-else-if="materials.error" class="rounded bg-red-100 p-3 text-red-700">
      <p>{{ materials.error }}</p>
      <button
        class="mt-3 rounded bg-green-700 px-4 py-2 text-white hover:bg-green-800"
        @click="materials.fetchMaterials()"
      >
        Reintentar
      </button>
    </div>

    <p v-else-if="materials.items.length === 0" class="text-gray-500">
      No hay materiales disponibles por ahora.
    </p>

    <ul v-else class="grid gap-3 sm:grid-cols-2">
      <li
        v-for="material in materials.items"
        :key="material.id"
        class="flex items-center justify-between rounded border border-gray-200 p-4"
      >
        <div>
          <p class="font-medium">{{ material.name }}</p>
          <p class="text-sm text-gray-500">por {{ material.unit }}</p>
        </div>
        <p class="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
          {{ material.points_per_unit }} pts
        </p>
      </li>
    </ul>
  </section>
</template>