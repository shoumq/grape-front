<template>
  <header class="sticky top-0 z-50 border-b border-gray-800 bg-gray-950 backdrop-blur mb-20">
    <div class="app-container py-3 flex items-center justify-between gap-4">
      <!-- Left: Logo -->
      <RouterLink to="/" class="flex items-center font-semibold text-lg text-gray-50">
        <img
          src="../assets/icon.png"
          alt=""
          class="w-10 h-10 rounded-xl flex items-center justify-center"
        />
        <span>Grape</span>
      </RouterLink>

      <!-- Center: Navigation -->
      <nav class="hidden md:flex items-center gap-1">
        <NavLink to="/" label="Чаты" />
        <NavLink to="/people" label="Люди" />
      </nav>

      <!-- Right: Profile -->
      <div class="flex items-center gap-3">
        <RouterLink
          v-if="me"
          :to="{ name: 'me' }"
          class="flex items-center gap-2 rounded-xl border border-gray-800 px-3 py-1.5 hover:bg-gray-900 text-gray-50"
        >
          <div
            class="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center text-xs font-semibold"
          >
            {{ initials(me.username) }}
          </div>
          <span class="text-sm">{{ me.username }}</span>
        </RouterLink>

        <button
          class="rounded-xl border border-gray-800 px-3 py-1.5 text-sm hover:bg-gray-900 text-gray-50"
          @click="logout"
        >
          Выйти
        </button>
      </div>
    </div>

    <!-- Mobile nav -->
    <div class="md:hidden border-t border-gray-800 px-4 py-2 flex gap-2">
      <NavLink to="/" label="Чаты" mobile />
      <NavLink to="/people" label="Люди" mobile />
    </div>
  </header>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet } from '../lib/api'
import { logout as doLogout } from '../lib/auth'
import NavLink from './NavLink.vue'

const router = useRouter()
const me = ref(null)

function initials(name) {
  if (!name) return '?'
  return name.slice(0, 2).toUpperCase()
}

async function loadMe() {
  try {
    me.value = await apiGet('/api/users/me')
  } catch {
    me.value = null
  }
}

function logout() {
  doLogout()
  router.replace('/login')
}

onMounted(() => {
  loadMe()
})
</script>
