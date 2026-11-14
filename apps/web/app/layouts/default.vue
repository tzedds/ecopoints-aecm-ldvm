<template>
  <div class="min-h-screen flex flex-col bg-gray-50 text-gray-900">
    <header class="bg-green-700 text-white shadow">
      <div class="mx-auto max-w-5xl px-4 py-4">
        <h1 class="text-xl font-bold">EcoPoints</h1>
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