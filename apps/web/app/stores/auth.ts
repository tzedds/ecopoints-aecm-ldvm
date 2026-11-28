import { defineStore } from "pinia";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "participant" | "manager";
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const useAuthStore = defineStore("auth", () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase as string;

  // El token vive en una cookie de 8 horas, igual que el token de la API
  const tokenCookie = useCookie<string | null>("ecopoints_token", {
    maxAge: 60 * 60 * 8,
    sameSite: "lax",
    default: () => null,
  });

  const user = ref<AuthUser | null>(null);

  const token = computed(() => tokenCookie.value);
  const isLoggedIn = computed(() => !!tokenCookie.value);
  const isManager = computed(() => user.value?.role === "manager");

  async function login(email: string, password: string) {
    const data = await $fetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      baseURL: apiBase,
      body: { email, password },
    });
    tokenCookie.value = data.token;
    user.value = data.user;
  }

  async function fetchMe() {
    if (!tokenCookie.value) {
      user.value = null;
      return;
    }
    try {
      user.value = await $fetch<AuthUser>("/api/auth/me", {
        baseURL: apiBase,
        headers: { Authorization: `Bearer ${tokenCookie.value}` },
      });
    } catch (e) {
      // Solo un 401 significa token vencido o inválido; un fallo de red no cierra la sesión
      const err = e as { statusCode?: number };
      if (err.statusCode === 401) logout();
    }
  }

  function logout() {
    tokenCookie.value = null;
    user.value = null;
  }

  return { user, token, isLoggedIn, isManager, login, fetchMe, logout };
});