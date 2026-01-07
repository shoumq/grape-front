<template>
  <div class="min-h-screen bg-gray-950 text-gray-100 p-6">
    <div class="app-container">
      <!-- Header -->
      <div class="flex items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div class="text-xs text-gray-500">Профиль</div>
          <h1 class="text-2xl font-semibold">
            {{ user?.username || '—' }}
            <span v-if="user?.id" class="text-sm text-gray-500 font-normal">#{{ user.id }}</span>
          </h1>
          <div class="text-sm text-gray-400 mt-1">
            <span v-if="isMe">Это ваш профиль</span>
            <span v-else>Профиль пользователя</span>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            class="rounded-xl border border-gray-800 px-4 py-2 hover:bg-gray-900 disabled:opacity-60"
            @click="load"
            :disabled="loading"
          >
            {{ loading ? 'Загружаю...' : 'Обновить' }}
          </button>

          <RouterLink class="rounded-xl border border-gray-800 px-4 py-2 hover:bg-gray-900" to="/">
            Назад
          </RouterLink>
        </div>
      </div>

      <!-- Error -->
      <div
        v-if="error"
        class="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-900/50 rounded-xl p-3"
      >
        {{ error }}
      </div>

      <!-- Loading -->
      <div v-if="loading" class="rounded-2xl border border-gray-800 bg-gray-900/40 p-6">
        <div class="h-4 w-40 bg-gray-800 rounded mb-3"></div>
        <div class="h-3 w-64 bg-gray-800 rounded mb-2"></div>
        <div class="h-3 w-52 bg-gray-800 rounded"></div>
      </div>

      <!-- Card -->
      <div
        v-else-if="user"
        class="rounded-2xl border border-gray-800 bg-gray-900/40 overflow-hidden"
      >
        <div class="p-6 flex items-start justify-between gap-4">
          <div class="flex items-start gap-4">
            <div
              class="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center text-lg font-semibold"
            >
              {{ initials(user.username) }}
            </div>

            <div>
              <div class="text-xl font-semibold">{{ user.username }}</div>
              <div class="text-sm text-gray-400 mt-1">
                id: <span class="text-gray-200">{{ user.id }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col items-end gap-2">
            <span
              class="text-xs px-2 py-1 rounded-full border"
              :class="
                isMe
                  ? 'border-blue-700 text-blue-300 bg-blue-500/10'
                  : 'border-gray-800 text-gray-400 bg-gray-950/60'
              "
            >
              {{ isMe ? 'Вы' : 'Контакт' }}
            </span>

            <button
              v-if="!isMe"
              class="rounded-xl bg-white text-gray-900 font-medium px-4 py-2 hover:bg-gray-100 disabled:opacity-60"
              @click="messageUser"
              :disabled="startingChat"
            >
              {{ startingChat ? 'Открываю чат...' : 'Написать' }}
            </button>
          </div>
        </div>

        <div class="border-t border-gray-800 p-6 space-y-3">
          <div>
            <div class="text-xs text-gray-500">Public key</div>
            <div
              class="mt-1 text-sm text-gray-200 break-all bg-gray-950/60 border border-gray-800 rounded-xl p-3"
            >
              {{ user.public_key || '—' }}
            </div>
          </div>

          <!-- Можно расширить, если в API появятся поля -->
          <div class="text-xs text-gray-600">
            Данные берутся из:
            <span class="text-gray-500">/api/users/me</span> и
            <span class="text-gray-500">/api/users/:id</span>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else class="rounded-2xl border border-gray-800 bg-gray-900/40 p-6 text-gray-400">
        Пользователь не найден.
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiGet, apiPost } from '../lib/api'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const startingChat = ref(false)
const error = ref(null)

const me = ref(null)
const user = ref(null)

const routeUserId = computed(() => {
  const raw = route.params.id
  return raw ? Number(raw) : null
})

const isMe = computed(() => {
  if (!me.value || !user.value) return false
  return me.value.id === user.value.id
})

function initials(name) {
  if (!name) return '?'
  return String(name).trim().slice(0, 2).toUpperCase()
}

async function load() {
  error.value = null
  loading.value = true

  try {
    // 1) кто я
    me.value = await apiGet('/api/users/me')

    // 2) чей профиль открываем
    if (routeUserId.value) {
      user.value = await apiGet(`/api/users/${routeUserId.value}`)
    } else {
      user.value = me.value
    }
  } catch (e) {
    error.value = e?.message || 'Ошибка загрузки профиля'
    user.value = null
  } finally {
    loading.value = false
  }
}

async function messageUser() {
  if (!user.value?.id) return

  startingChat.value = true
  error.value = null

  try {
    const resp = await apiPost('/api/chats', { peer_user_id: user.value.id })
    const chatId = resp?.id
    if (!chatId) throw new Error('Сервер не вернул id чата')

    router.push({ name: 'chat', params: { chatId } })
  } catch (e) {
    error.value = e?.message || 'Не удалось открыть чат'
  } finally {
    startingChat.value = false
  }
}

watch(
  () => route.fullPath,
  () => {
    load()
  },
)

onMounted(() => {
  load()
})
</script>
