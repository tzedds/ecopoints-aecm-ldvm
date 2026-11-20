<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

// El login no usa el layout con menú
definePageMeta({ layout: false });

const auth = useAuthStore();
const email = ref("");
const password = ref("");
const error = ref<string | null>(null);
const loading = ref(false);

async function onSubmit() {
  error.value = null;
  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    await navigateTo("/");
  } catch (e) {
    const err = e as { data?: { error?: string } };
    error.value = err.data?.error ?? "No se pudo iniciar sesión";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <form
      class="w-full max-w-sm rounded-lg bg-white p-6 shadow"
      @submit.prevent="onSubmit"
    >
      <h1 class="mb-1 text-2xl font-bold text-green-700">EcoPoints</h1>
      <p class="mb-6 text-sm text-gray-500">Inicia sesión para continuar</p>

      <label class="mb-1 block text-sm font-medium" for="email">Correo</label>
      <input
        id="email"
        v-model="email"
        type="email"
        required
        autocomplete="username"
        class="mb-4 w-full rounded border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none"
      />

      <label class="mb-1 block text-sm font-medium" for="password">Contraseña</label>
      <input
        id="password"
        v-model="password"
        type="password"
        required
        autocomplete="current-password"
        class="mb-4 w-full rounded border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none"
      />

      <p v-if="error" class="mb-4 rounded bg-red-100 p-2 text-sm text-red-700">
        {{ error }}
      </p>

      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded bg-green-700 py-2 text-white hover:bg-green-800 disabled:opacity-60"
      >
        {{ loading ? "Entrando..." : "Entrar" }}
      </button>
    </form>
  </div>
</template>