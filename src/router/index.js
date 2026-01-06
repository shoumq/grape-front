import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import HomeView from '../views/HomeView.vue'
import ChatView from '../views/ChatView.vue'

function isAuthed() {
  return !!localStorage.getItem('auth_token')
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterView },
    { path: '/chat/:chatId', name: 'chat', component: ChatView, meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthed()) return { name: 'login' }
  if ((to.name === 'login' || to.name === 'register') && isAuthed()) return { name: 'home' }
})

export default router
