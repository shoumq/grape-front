<template>
  <div class="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
    <div class="w-full max-w-md bg-gray-900/60 border border-gray-800 rounded-2xl p-6 shadow">
      <div class="mb-6">
        <h1 class="text-2xl font-semibold">Вход</h1>
        <p class="text-sm text-gray-400 mt-1">Введи логин и пароль, чтобы получить токен.</p>
      </div>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="block text-sm text-gray-300 mb-1">Username</label>
          <input
            v-model.trim="username"
            class="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 outline-none focus:border-gray-600"
            placeholder="alice"
            autocomplete="username"
            required
          />
        </div>

        <div>
          <label class="block text-sm text-gray-300 mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            class="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 outline-none focus:border-gray-600"
            placeholder="password123"
            autocomplete="current-password"
            required
          />
        </div>

        <div
          v-if="error"
          class="text-sm text-red-400 bg-red-500/10 border border-red-900/50 rounded-xl p-3"
        >
          {{ error }}
        </div>

        <button
          type="submit"
          class="w-full rounded-xl bg-white text-gray-900 font-medium py-2.5 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="loading"
        >
          {{ loading ? 'Входим...' : 'Войти' }}
        </button>

        <div class="flex items-center justify-between text-sm text-gray-400">
          <RouterLink class="hover:text-gray-200" to="/register"
            >Нет аккаунта? Регистрация</RouterLink
          >
          <button type="button" class="hover:text-gray-200" @click="fillDemo">Демо</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiPost } from '../lib/api'
import { saveBearerToken } from '../lib/auth'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)

function fillDemo() {
  username.value = 'alice'
  password.value = 'password123'
}

async function onSubmit() {
  error.value = null
  loading.value = true

  try {
    const resp = await apiPost('/api/login', {
      username: username.value,
      password: password.value,
    })

    const token = resp?.token || resp?.access_token || resp?.data?.token
    if (!token) throw new Error('Сервер не вернул token')

    saveBearerToken(token)
    router.push({ name: 'home' })
  } catch (e) {
    error.value = e?.message || 'Ошибка входа'
  } finally {
    loading.value = false
  }
}
</script>
