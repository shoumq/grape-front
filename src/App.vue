<template>
  <AppHeader v-if="showHeader" />
  <RouterView />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'

const route = useRoute()

const showHeader = computed(() => {
  return !['/login', '/register'].includes(route.path)
})
</script>
