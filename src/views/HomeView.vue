<template>
  <div class="min-h-screen bg-gray-950 text-gray-100 p-6">
    <div class="app-container py-6">
      <!-- Header -->
      <div class="flex items-start sm:items-center justify-between gap-4 mb-6">
        <div class="flex gap-2">
          <button
            class="rounded-xl border border-gray-800 px-4 py-2 hover:bg-gray-900 disabled:opacity-60"
            @click="loadChats"
            :disabled="loading"
          >
            {{ loading ? 'Обновляю...' : 'Обновить' }}
          </button>

          <button
            class="rounded-xl border border-gray-800 px-4 py-2 hover:bg-gray-900"
            @click="onLogout"
          >
            Выйти
          </button>
        </div>
      </div>

      <div
        v-if="error"
        class="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-900/50 rounded-xl p-3"
      >
        {{ error }}
      </div>

      <div v-if="loading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
          <div class="h-4 w-40 bg-gray-800 rounded mb-3"></div>
          <div class="h-3 w-64 bg-gray-800 rounded mb-2"></div>
          <div class="h-3 w-32 bg-gray-800 rounded"></div>
        </div>
      </div>

      <div v-if="chats.length === 0" class="rounded-2xl border border-gray-800 bg-gray-900/40 p-6">
        <p class="text-gray-300">Чатов пока нет.</p>
        <p class="text-sm text-gray-500 mt-1">Когда появятся — они будут здесь.</p>
      </div>

      <div class="h-4"></div>

      <div v-if="chats.length !== 0" class="flex flex-col gap-4">
        <RouterLink
          :to="{ name: 'chat', params: { chatId: chat.id } }"
          v-for="chat in chats"
          :key="chat.id"
        >
          <div
            class="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 hover:bg-gray-900/60 transition"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <div
                    class="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center text-sm font-semibold"
                  >
                    {{ initials(chat.peer?.username) }}
                  </div>
                  <div>
                    <div class="font-medium">
                      {{ chat.peer?.username || 'unknown' }}
                      <span class="text-xs text-gray-500">#{{ chat.id }}</span>
                    </div>
                    <div class="text-xs text-gray-500">
                      peer_id: {{ chat.peer?.id ?? '-' }}
                      <span class="mx-1">•</span>
                      created: {{ formatDate(chat.created_at) }}
                    </div>
                  </div>
                </div>

                <div class="mt-3">
                  <div class="text-sm text-gray-300">
                    <span class="text-gray-500">Последнее:</span>
                    <span v-if="chat.last_message?.ciphertext">
                      {{ chat.last_message.ciphertext }}</span
                    >
                    <span v-else class="text-gray-500">нет сообщений</span>
                  </div>

                  <div v-if="chat.last_message" class="text-xs text-gray-500 mt-1">
                    sender_id: {{ chat.last_message.sender_id }}
                    <span class="mx-1">•</span>
                    {{ formatDate(chat.last_message.created_at) }}
                  </div>
                </div>
              </div>

              <div class="text-right">
                <div class="text-xs text-gray-500">public_key</div>
                <div
                  class="max-w-[220px] text-xs text-gray-300 break-all bg-gray-950/60 border border-gray-800 rounded-xl p-2"
                >
                  {{ chat.peer?.public_key || '-' }}
                </div>
              </div>
            </div>
          </div>
        </RouterLink>
      </div>

      <!-- Footer -->
      <div class="mt-8 text-xs text-gray-600">Всего чатов: {{ chats.length }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet } from '../lib/api'
import { getBearerToken, logout } from '../lib/auth'

const router = useRouter()
const token = computed(() => getBearerToken())

const chats = ref([])
const loading = ref(false)
const error = ref(null)

function initials(name) {
  if (!name) return '?'
  const s = String(name).trim()
  if (!s) return '?'
  return s.slice(0, 2).toUpperCase()
}

function formatDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

async function loadChats() {
  error.value = null
  loading.value = true
  try {
    const data = await apiGet('/api/chats')
    // ожидаем массив как в твоём примере
    chats.value = Array.isArray(data) ? data : []
  } catch (e) {
    error.value = e?.message || 'Не удалось загрузить чаты'
  } finally {
    loading.value = false
  }
}

function onLogout() {
  logout()
  router.push({ name: 'login' })
}

onMounted(() => {
  loadChats()
})
</script>
