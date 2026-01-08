<template>
  <RouterLink
    :to="to"
    class="rounded-xl px-3 py-1.5 text-sm transition"
    :class="
      isActive ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-gray-100 hover:bg-gray-900'
    "
  >
    {{ label }}
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  to: { type: String, required: true },
  label: { type: String, required: true },
  mobile: Boolean,
})

const route = useRoute()
const isActive = computed(() => route.path === props.to)
</script>
