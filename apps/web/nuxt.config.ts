import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@pinia/nuxt"],
  css: ["~/assets/css/main.css"],
  devServer: { port: 3001 },
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    public: {
      // Se puede sobreescribir con la variable NUXT_PUBLIC_API_BASE
      apiBase: "http://localhost:3000",
    },
  },
});