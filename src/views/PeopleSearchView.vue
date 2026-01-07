<template>
  <div class="min-h-screen bg-gray-950 text-gray-100 p-6">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div class="text-xs text-gray-500">Люди</div>
          <h1 class="text-2xl font-semibold">Поиск пользователей</h1>
        </div>

        <div class="flex gap-2">
          <button
            class="rounded-xl border border-gray-800 px-4 py-2 hover:bg-gray-900 disabled:opacity-60"
            @click="loadRandom"
            :disabled="loading"
          >
            {{ loading ? "Загружаю..." : "Рандом" }}
          </button>

          <RouterLink class="rounded-xl border border-gray-800 px-4 py-2 hover:bg-gray-900" to="/">
            Назад
          </RouterLink>
        </div>
      </div>

      <!-- Search bar -->
      <div class="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 mb-4">
        <form class="flex gap-2" @submit.prevent="onSearch">
          <input
            v-model="query"
            class="flex-1 rounded-xl bg-gray-950 border border-gray-800 px-3 py-2 outline-none focus:border-gray-600"
            placeholder="Поиск по username… (например: vas)"
          />
          <button
            class="rounded-xl bg-white text-gray-900 font-medium px-4 py-2 hover:bg-gray-100 disabled:opacity-60"
            type="submit"
            :disabled="loading || query.trim().length === 0"
          >
            Найти
          </button>
          <button
            class="rounded-xl border border-gray-800 px-4 py-2 hover:bg-gray-900 disabled:opacity-60"
            type="button"
            @click="reset"
            :disabled="loading"
          >
            Сброс
          </button>
        </form>
      </div>

      <!-- Error -->
      <div v-if="error" class="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-900/50 rounded-xl p-3">
        {{ error }}
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 6" :key="i" class="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
          <div class="h-4 w-44 bg-gray-800 rounded mb-2"></div>
          <div class="h-3 w-64 bg-gray-800 rounded"></div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="people.length === 0" class="rounded-2xl border border-gray-800 bg-gray-900/40 p-6">
        <div class="text-gray-300">Никого не нашёл.</div>
        <div class="text-sm text-gray-500 mt-1">Попробуй другой запрос или нажми “Рандом”.</div>
      </div>

      <!-- List -->
      <div v-else class="space-y-3">
        <div
          v-for="u in people"
          :key="u.id"
          class="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 hover:bg-gray-900/60 transition flex items-start justify-between gap-4"
        >
          <div class="flex items-start gap-3">
            <div class="w-11 h-11 rounded-2xl bg-gray-800 flex items-center justify-center text-sm font-semibold">
              {{ initials(u.username) }}
            </div>

            <div>
              <div class="font-medium text-gray-100">
                {{ u.username }}
                <span class="text-xs text-gray-500">#{{ u.id }}</span>
                <span
                  v-if="me && u.id === me.id"
                  class="ml-2 text-xs px-2 py-0.5 rounded-full border border-blue-700 text-blue-300 bg-blue-500/10"
                >
                  вы
                </span>
              </div>

              <div class="text-xs text-gray-500 mt-1 break-all">
                public_key: <span class="text-gray-400">{{ u.public_key || "—" }}</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col items-end gap-2">
            <RouterLink
              class="text-sm rounded-xl border border-gray-800 px-3 py-1.5 hover:bg-gray-900"
              :to="{ name: 'user', params: { id: u.id } }"
            >
              Профиль
            </RouterLink>

            <button
              v-if="me && u.id !== me.id"
              class="text-sm rounded-xl bg-white text-gray-900 font-medium px-3 py-1.5 hover:bg-gray-100 disabled:opacity-60"
              @click="message(u.id)"
              :disabled="startingChatId === u.id"
            >
              {{ startingChatId === u.id ? "..." : "Написать" }}
            </button>
          </div>
        </div>

        <div class="mt-6 text-xs text-gray-600">
          Показано: {{ people.length }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { apiGet, apiPost } from "../lib/api";

const router = useRouter();

const me = ref(null);
const people = ref([]);

const query = ref("");
const loading = ref(false);
const error = ref(null);

const startingChatId = ref(null);

function initials(name) {
  if (!name) return "?";
  return String(name).trim().slice(0, 2).toUpperCase();
}

async function loadMe() {
  me.value = await apiGet("/api/users/me");
}

async function loadRandom() {
  error.value = null;
  loading.value = true;
  try {
    await loadMe();
    const data = await apiGet("/api/users/random?limit=20");
    people.value = Array.isArray(data) ? data : [];
  } catch (e) {
    error.value = e?.message || "Не удалось загрузить пользователей";
    people.value = [];
  } finally {
    loading.value = false;
  }
}

async function onSearch() {
  const q = query.value.trim();
  if (!q) return;

  error.value = null;
  loading.value = true;
  try {
    await loadMe();
    const url = `/api/users/search?username=${encodeURIComponent(q)}&limit=20`;
    const data = await apiGet(url);
    people.value = Array.isArray(data) ? data : [];
  } catch (e) {
    error.value = e?.message || "Ошибка поиска";
    people.value = [];
  } finally {
    loading.value = false;
  }
}

function reset() {
  query.value = "";
  loadRandom();
}

async function message(peerUserId) {
  startingChatId.value = peerUserId;
  error.value = null;

  try {
    const resp = await apiPost("/api/chats", { peer_user_id: peerUserId });
    const chatId = resp?.id;
    if (!chatId) throw new Error("Сервер не вернул id чата");
    router.push({ name: "chat", params: { chatId } });
  } catch (e) {
    error.value = e?.message || "Не удалось открыть чат";
  } finally {
    startingChatId.value = null;
  }
}

onMounted(() => {
  loadRandom();
});
</script>