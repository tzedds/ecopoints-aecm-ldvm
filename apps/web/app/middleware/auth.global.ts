import { useAuthStore } from "~/stores/auth";

// Rutas que se pueden ver sin iniciar sesión
const publicRoutes = ["/login"];

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore();

  // Hay token pero aún no sabemos quién es: se consulta /api/auth/me
  if (auth.isLoggedIn && !auth.user) {
    await auth.fetchMe();
  }

  const isPublic = publicRoutes.includes(to.path);

  if (!auth.isLoggedIn && !isPublic) {
    return navigateTo("/login");
  }
  if (auth.isLoggedIn && to.path === "/login") {
    return navigateTo("/");
  }
});