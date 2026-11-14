<script setup lang="ts">
import { useHealthStore } from "~/stores/health";

const health = useHealthStore();

// onMounted solo corre en el navegador, así se prueba la conexión real con la API
onMounted(() => health.check());
</script>

<template>
  <section class="rounded-lg bg-white p-6 shadow">
    <h2 class="mb-4 text-lg font-semibold">Estado de la API</h2>

    <p v-if="health.loading" class="text-gray-500">Consultando...</p>

    <div v-else-if="health.error" class="rounded bg-red-100 p-3 text-red-700">
      {{ health.error }}
    </div>

    <div v-else-if="health.data" class="rounded bg-green-100 p-3 text-green-800">
      <p>
        Estado: <strong>{{ health.data.status }}</strong>
      </p>
      <p>Servicio: {{ health.data.service }}</p>
      <p class="text-sm">{{ health.data.timestamp }}</p>
    </div>

    <button
      class="mt-4 rounded bg-green-700 px-4 py-2 text-white hover:bg-green-800"
      @click="health.check()"
    >
      Volver a consultar
    </button>
  </section>
</template>