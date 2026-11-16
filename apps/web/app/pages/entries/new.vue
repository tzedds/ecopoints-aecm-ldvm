<script setup lang="ts">
import { useMaterialsStore } from "~/stores/materials";
import { useEntriesStore } from "~/stores/entries";

const materials = useMaterialsStore();
const entries = useEntriesStore();

// TODO semana 2: quitar el user_id fijo cuando exista el login (saldrá del token)
const DEMO_USER_ID = 1;

const materialId = ref<number | null>(null);
const quantity = ref<number | "">("");
const formError = ref<string | null>(null);

onMounted(() => {
  entries.reset();
  if (materials.items.length === 0) materials.fetchMaterials();
});

const selectedMaterial = computed(
  () => materials.items.find((m) => m.id === materialId.value) ?? null,
);

async function submit() {
  formError.value = null;
  entries.reset();

  if (materialId.value === null) {
    formError.value = "Selecciona un material";
    return;
  }
  if (
    typeof quantity.value !== "number" ||
    !Number.isInteger(quantity.value) ||
    quantity.value <= 0
  ) {
    formError.value = "La cantidad debe ser un número entero mayor a 0";
    return;
  }

  const ok = await entries.createEntry({
    user_id: DEMO_USER_ID,
    material_id: materialId.value,
    quantity: quantity.value,
  });

  if (ok) {
    materialId.value = null;
    quantity.value = "";
  }
}
</script>

<template>
  <section class="rounded-lg bg-white p-6 shadow">
    <h2 class="mb-2 text-lg font-semibold">Registrar entrega</h2>
    <p class="mb-4 text-sm text-gray-500">
      Registra el material que entregaste. Un encargado la revisará y, si la aprueba,
      recibirás tus puntos.
    </p>

    <p v-if="materials.loading" class="text-gray-500">Cargando materiales...</p>

    <div v-else-if="materials.error" class="rounded bg-red-100 p-3 text-red-700">
      <p>{{ materials.error }}</p>
      <button
        class="mt-3 rounded bg-green-700 px-4 py-2 text-white hover:bg-green-800"
        @click="materials.fetchMaterials()"
      >
        Reintentar
      </button>
    </div>

    <form v-else class="space-y-4" @submit.prevent="submit">
      <div>
        <label for="material" class="mb-1 block text-sm font-medium">Material</label>
        <select
          id="material"
          v-model="materialId"
          class="w-full rounded border border-gray-300 p-2"
        >
          <option :value="null" disabled>Selecciona un material</option>
          <option v-for="m in materials.items" :key="m.id" :value="m.id">
            {{ m.name }}
          </option>
        </select>
      </div>

      <div>
        <label for="quantity" class="mb-1 block text-sm font-medium">
          Cantidad<span v-if="selectedMaterial"> ({{ selectedMaterial.unit }})</span>
        </label>
        <input
          id="quantity"
          v-model.number="quantity"
          type="number"
          min="1"
          step="1"
          class="w-full rounded border border-gray-300 p-2"
          placeholder="Ej. 5"
        />
        <p class="mt-1 text-xs text-gray-500">Solo números enteros.</p>
      </div>

      <div v-if="formError" class="rounded bg-red-100 p-3 text-red-700">
        {{ formError }}
      </div>

      <div v-if="entries.error" class="rounded bg-red-100 p-3 text-red-700">
        {{ entries.error }}
      </div>

      <div v-if="entries.lastEntry" class="rounded bg-green-100 p-3 text-green-800">
        Entrega registrada (n.º {{ entries.lastEntry.id }}). Quedó pendiente de revisión.
      </div>

      <button
        type="submit"
        :disabled="entries.submitting"
        class="rounded bg-green-700 px-4 py-2 text-white hover:bg-green-800 disabled:opacity-50"
      >
        {{ entries.submitting ? "Enviando..." : "Registrar entrega" }}
      </button>
    </form>
  </section>
</template>