<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

const auth = useAuthStore();

interface NavLink {
  to: string;
  label: string;
  roles?: Array<"participant" | "manager">;
}

const links: NavLink[] = [
  { to: "/entries/new", label: "Registrar entrega", roles: ["participant"] },
  { to: "/entries/mine", label: "Mis entregas", roles: ["participant"] },
  { to: "/", label: "Inicio" },
  { to: "/materials", label: "Materiales" },
];

const visibleLinks = computed(() =>
  links.filter(
    (link) => !link.roles || (auth.user && link.roles.includes(auth.user.role)),
  ),
);

async function onLogout() {
  auth.logout();
  await navigateTo("/login");
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 text-gray-900">
    <header class="bg-green-700 text-white shadow">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <h1 class="text-xl font-bold">EcoPoints</h1>

        <nav class="flex items-center gap-4 text-sm">
          <NuxtLink
            v-for="link in visibleLinks"
            :key="link.to"
            :to="link.to"
            class="hover:underline"
          >
            {{ link.label }}
          </NuxtLink>

          <template v-if="auth.user">
            <span class="rounded bg-green-800 px-2 py-1 text-xs">
              {{ auth.user.name }}
              ({{ auth.user.role === "manager" ? "Encargado" : "Participante" }})
            </span>
            <button class="rounded bg-white/20 px-3 py-1 hover:bg-white/30" @click="onLogout">
              Salir
            </button>
          </template>
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <slot />
    </main>

    <footer class="border-t border-gray-200 py-4 text-center text-sm text-gray-500">
      Proyecto de Cómputo en la Nube
    </footer>
  </div>
</template>