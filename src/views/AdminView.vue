<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { signOut } from '@/composables/useAuth'
import { useProducts } from '@/composables/useProducts'
import AdminDashboard from '@/components/AdminDashboard.vue'

const router = useRouter()

const {
  products,
  addProduct,
  updateProduct,
  toggleAvailability,
  deleteProduct
} = useProducts()

const userEmail = ref('')
const isSigningOut = ref(false)
let authSubscription = null

const handleLogout = async () => {
  isSigningOut.value = true
  await signOut()
  router.replace({ name: 'admin-login' })
}

onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  userEmail.value = data.session?.user?.email || ''

  // Si la sesión se cierra o expira (incluso en otra pestaña), saca al usuario del panel
  const { data: listener } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') router.replace({ name: 'admin-login' })
  })
  authSubscription = listener.subscription
})

onBeforeUnmount(() => {
  authSubscription?.unsubscribe()
})
</script>

<template>
  <div class="admin-shell">
    <header class="admin-topbar">
      <div class="container admin-topbar-inner">
        <router-link to="/" class="admin-brand" aria-label="Ir a la tienda">
          <img src="/logo-pyme.jpeg" alt="" class="admin-logo" />
          <span class="admin-brand-text">SHOPS K&D <small>Panel</small></span>
        </router-link>

        <div class="admin-user">
          <router-link to="/" class="btn btn-store">🏪 Ver tienda</router-link>
          <span v-if="userEmail" class="admin-email">{{ userEmail }}</span>
          <button
            type="button"
            class="btn btn-logout"
            :disabled="isSigningOut"
            @click="handleLogout"
          >
            {{ isSigningOut ? 'Saliendo...' : 'Cerrar sesión' }}
          </button>
        </div>
      </div>
    </header>

    <AdminDashboard
      :products="products"
      :add-product="addProduct"
      :update-product="updateProduct"
      :toggle-availability="toggleAvailability"
      :delete-product="deleteProduct"
      @close-dashboard="router.push('/')"
    />
  </div>
</template>

<style scoped>
.admin-topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--bg-main);
  border-bottom: 2px solid var(--secondary);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.admin-topbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.6rem;
  padding-bottom: 0.6rem;
}

.admin-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: var(--primary);
}

.admin-logo {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary);
}

.admin-brand-text {
  font-weight: 800;
  font-size: 1.05rem;
  letter-spacing: 0.5px;
}

.admin-brand-text small {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--secondary-dark);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-left: 0.25rem;
}

.admin-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.admin-email {
  display: none;
  font-size: 0.85rem;
  color: var(--text-muted);
}

@media (min-width: 640px) {
  .admin-email {
    display: inline;
  }
}

.btn-logout,
.btn-store {
  background-color: var(--bg-surface);
  color: var(--text-main);
  border: 1px solid var(--border-color);
  font-size: 0.88rem;
  padding: 0.5rem 1rem;
}

.btn-logout:hover,
.btn-store:hover {
  border-color: var(--primary);
  color: var(--primary);
  background-color: var(--secondary);
}

.btn-logout:disabled {
  opacity: 0.7;
  cursor: wait;
}
</style>