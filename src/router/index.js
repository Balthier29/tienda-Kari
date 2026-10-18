import { createRouter, createWebHashHistory } from 'vue-router'
import { supabase } from '@/supabase'
import StoreView from '../views/StoreView.vue'

const routes = [
  {
    path: '/',
    name: 'store',
    component: StoreView,
    meta: { title: 'SHOPS K&D | Frutas Deshidratadas' }
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    // Las vistas del panel se cargan solo al entrar: el público nunca descarga ese código
    component: () => import(/* webpackChunkName: "admin" */ '../views/AdminLoginView.vue'),
    meta: { title: 'Acceso del encargado | SHOPS K&D', noindex: true }
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import(/* webpackChunkName: "admin" */ '../views/AdminView.vue'),
    meta: { requiresAuth: true, title: 'Panel del encargado | SHOPS K&D', noindex: true }
  },
  // Cualquier dirección desconocida vuelve a la tienda
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

// Guard: protege el panel y evita mostrar el login a quien ya tiene sesión
router.beforeEach(async (to) => {
  const { data } = await supabase.auth.getSession()
  const loggedIn = !!data.session

  if (to.meta.requiresAuth && !loggedIn) {
    return { name: 'admin-login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'admin-login' && loggedIn) {
    return { name: 'admin' }
  }
})

// Título de la pestaña y "no indexar" para las páginas del panel
router.afterEach((to) => {
  if (to.meta.title) document.title = to.meta.title

  let robots = document.querySelector('meta[name="robots"]')
  if (to.meta.noindex) {
    if (!robots) {
      robots = document.createElement('meta')
      robots.setAttribute('name', 'robots')
      document.head.appendChild(robots)
    }
    robots.setAttribute('content', 'noindex, nofollow')
  } else if (robots) {
    robots.remove()
  }
})

export default router