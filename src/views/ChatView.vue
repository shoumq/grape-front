<template>
  <div class="min-h-screen bg-gray-950 text-gray-100">
    <div class="max-w-4xl mx-auto p-4 sm:p-6">
      <div class="flex items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div class="text-xs text-gray-500">Диалог</div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-semibold">Chat #{{ chatId || '—' }}</h1>
            <span
              class="text-xs px-2 py-1 rounded-full border"
              :class="
                wsConnected
                  ? 'border-green-700 text-green-300 bg-green-500/10'
                  : 'border-gray-800 text-gray-400 bg-gray-900/40'
              "
            >
              {{ wsConnected ? 'WS online' : 'WS offline' }}
            </span>
          </div>
          <div class="text-sm text-gray-400 mt-1">
            <template v-if="peerUserId">peer_user_id: {{ peerUserId }}</template>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            class="rounded-xl border border-gray-800 px-4 py-2 hover:bg-gray-900 disabled:opacity-60"
            @click="reload"
            :disabled="loading"
          >
            {{ loading ? 'Загружаю...' : 'Обновить' }}
          </button>
          <RouterLink class="rounded-xl border border-gray-800 px-4 py-2 hover:bg-gray-900" to="/">
            Назад
          </RouterLink>
        </div>
      </div>

      <div
        v-if="error"
        class="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-900/50 rounded-xl p-3"
      >
        {{ error }}
      </div>

      <!-- Open chat by peer -->
      <div v-if="!chatId" class="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
        <div class="text-sm text-gray-300">
          Чат ещё не открыт. Введи <span class="text-gray-200 font-medium">peer_user_id</span> и
          нажми «Открыть».
        </div>

        <div class="mt-3 flex gap-2">
          <input
            v-model="peerInput"
            class="w-44 rounded-xl bg-gray-950 border border-gray-800 px-3 py-2 outline-none focus:border-gray-600"
            placeholder="peer_user_id"
            inputmode="numeric"
          />
          <button
            class="rounded-xl bg-white text-gray-900 font-medium px-4 py-2 hover:bg-gray-100 disabled:opacity-60"
            @click="openChatByPeer"
            :disabled="loading || !peerInput"
          >
            Открыть
          </button>
        </div>
      </div>

      <div v-else class="rounded-2xl border border-gray-800 bg-gray-900/40 overflow-hidden">
        <div
          class="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-800 bg-gray-900/30"
        >
          <div class="text-sm text-gray-300">
            Сообщения: <span class="text-gray-100 font-medium">{{ messages.length }}</span>
          </div>

          <button
            class="text-sm rounded-xl border border-gray-800 px-3 py-1.5 hover:bg-gray-900 disabled:opacity-60"
            @click="loadMore"
            :disabled="loadingMore || !canLoadMore"
          >
            {{ loadingMore ? 'Гружу...' : canLoadMore ? 'Загрузить ещё' : 'Больше нет' }}
          </button>
        </div>

        <div ref="scrollEl" class="p-4 space-y-3 max-h-[65vh] overflow-auto">
          <div v-if="loading && messages.length === 0" class="text-sm text-gray-400">
            Загружаю историю…
          </div>

          <div v-else-if="messages.length === 0" class="text-sm text-gray-400">
            Сообщений пока нет.
          </div>

          <div
            v-for="m in messages"
            :key="m.id"
            class="rounded-2xl border border-gray-800 bg-gray-950/60 p-3 mt-4"
          >
            <div class="flex items-center justify-between gap-2 ">
              <div class="text-xs text-gray-500">id: {{ m.id }} • sender_id: {{ m.sender_id }}</div>
              <div class="text-xs text-gray-500">{{ formatDate(m.created_at) }}</div>
            </div>

            <div class="mt-2 text-sm text-gray-200 whitespace-pre-wrap break-words">
              {{ m.ciphertext }}
            </div>
          </div>
        </div>

        <div class="px-4 py-3 border-t border-gray-800 bg-gray-900/30">
          <form class="flex gap-2" @submit.prevent="sendMessage">
            <input
              v-model="draft"
              class="flex-1 rounded-xl bg-gray-950 border border-gray-800 px-3 py-2 outline-none focus:border-gray-600"
              placeholder="печатать..."
              :disabled="sending || !wsConnected"
            />
            <button
              class="rounded-xl bg-white text-gray-900 font-medium px-4 py-2 hover:bg-gray-100 disabled:opacity-60"
              type="submit"
              :disabled="sending || !wsConnected || !draft"
            >
              {{ sending ? '...' : 'Send' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiGet, apiPost } from '../lib/api'
import { getBearerToken } from '../lib/auth'

const route = useRoute()
const router = useRouter()

const chatId = computed(() => {
  const raw = route.params.chatId
  return raw ? Number(raw) : null
})

const peerUserId = computed(() => {
  const q = route.query.peer_user_id
  return q ? Number(q) : null
})

const peerInput = ref(peerUserId.value ? String(peerUserId.value) : '')

const messages = ref([])
const loading = ref(false)
const error = ref(null)

const loadingMore = ref(false)
const canLoadMore = ref(true)

const scrollEl = ref(null)

// Composer
const draft = ref('')
const nonce = ref('test')
const sending = ref(false)

// WS
const wsConnected = ref(false)
let ws = null

// ВАЖНО: подключаемся к /ws относительным путём, чтобы Vite proxy мог добавить Authorization header
const wsUrl = computed(() => {
  if (!chatId.value) return ''
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'

  const bearer = getBearerToken() || '' // "Bearer xxx" или ""
  const tokenOnly = bearer.startsWith('Bearer ') // вытаскиваем чистый токен
    ? bearer.slice(7)
    : bearer

  return `${proto}://5.129.194.222:8081/ws?chat_id=${chatId.value}&token=${encodeURIComponent(tokenOnly)}`
})

function formatDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

function scrollToBottom() {
  const el = scrollEl.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

function normalizeMessage(m) {
  return {
    id: m.id,
    chat_id: m.chat_id,
    sender_id: m.sender_id,
    ciphertext: m.ciphertext,
    nonce: m.nonce,
    created_at: m.created_at,
  }
}

function mergeIncoming(msg) {
  if (!msg?.id) return
  if (messages.value.some((x) => x.id === msg.id)) return
  messages.value.push(msg)
}

async function openChatByPeer() {
  error.value = null
  loading.value = true
  try {
    const resp = await apiPost('/api/chats', { peer_user_id: Number(peerInput.value) })
    const id = resp?.id
    if (!id) throw new Error('Сервер не вернул id чата')
    await router.replace({ name: 'chat', params: { chatId: id } })
  } catch (e) {
    error.value = e?.message || 'Не удалось открыть чат'
  } finally {
    loading.value = false
  }
}

async function loadHistory({ limit = 50, beforeId = 0, mode = 'replace' } = {}) {
  if (!chatId.value) return []

  const url = `/api/chats/${chatId.value}/messages?limit=${limit}&before_id=${beforeId}`
  const data = await apiGet(url)
  const list = Array.isArray(data) ? data.map(normalizeMessage) : []

  list.sort((a, b) => a.id - b.id)

  if (mode === 'replace') {
    messages.value = list
  } else if (mode === 'prepend') {
    const existing = new Set(messages.value.map((m) => m.id))
    const toAdd = list.filter((m) => !existing.has(m.id))
    messages.value = [...toAdd, ...messages.value]
  }

  if (list.length < limit) canLoadMore.value = false
  return list
}

async function reload() {
  error.value = null

  // пришли по ?peer_user_id=2 — открыть чат и редиректнуть на /chat/:id
  if (!chatId.value && peerUserId.value) {
    peerInput.value = String(peerUserId.value)
    await openChatByPeer()
    return
  }

  if (!chatId.value) return

  loading.value = true
  try {
    canLoadMore.value = true
    await loadHistory({ limit: 50, beforeId: 0, mode: 'replace' })
    await nextTick()
    scrollToBottom()
    connectWs()
  } catch (e) {
    error.value = e?.message || 'Ошибка загрузки истории'
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (!chatId.value || messages.value.length === 0) return

  loadingMore.value = true
  try {
    const minId = Math.min(...messages.value.map((m) => m.id))
    const older = await loadHistory({ limit: 50, beforeId: minId, mode: 'prepend' })
    if (!older || older.length === 0) canLoadMore.value = false
  } catch (e) {
    error.value = e?.message || 'Ошибка подгрузки'
  } finally {
    loadingMore.value = false
  }
}

function connectWs() {
  disconnectWs()
  if (!chatId.value) return

  try {
    ws = new WebSocket(wsUrl.value)
    wsConnected.value = false

    ws.onopen = () => {
      wsConnected.value = true
    }

    ws.onclose = () => {
      wsConnected.value = false
    }

    ws.onerror = () => {
      wsConnected.value = false
    }

    ws.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data)
        const msg = payload?.data ?? payload
        if (!msg?.id) return

        mergeIncoming(normalizeMessage(msg))
        nextTick().then(scrollToBottom)
      } catch {
        // ignore
      }
    }
  } catch {
    error.value = 'Не удалось подключить WebSocket'
  }
}

function disconnectWs() {
  if (!ws) return
  try {
    ws.close()
  } catch {}
  ws = null
  wsConnected.value = false
}

function genNonce() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function sendMessage() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return
  if (!draft.value) return

  sending.value = true
  try {
    ws.send(
      JSON.stringify({
        type: 'send',
        ciphertext: draft.value,
        nonce: genNonce(),
      }),
    )
    draft.value = ''
  } finally {
    sending.value = false
  }
}

watch(
  () => route.fullPath,
  () => {
    reload()
  },
)

onMounted(() => {
  reload()
})

onBeforeUnmount(() => {
  disconnectWs()
})
</script>
