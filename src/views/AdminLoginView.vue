<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { signIn } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)

// Solo se permite volver a rutas internas del panel (evita redirecciones a otros sitios)
const getSafeRedirect = () => {
  const target = route.query.redirect
  return typeof target === 'string' && target.startsWith('/admin') && !target.startsWith('/admin/login')
    ? target
    : '/admin'
}

const handleLogin = async () => {
  errorMessage.value = ''

  if (!email.value.trim() || !password.value) {
    errorMessage.value = 'Ingresa tu correo y tu contraseña.'
    return
  }

  isLoading.value = true
  const result = await signIn(email.value, password.value)
  isLoading.value = false

  if (result.ok) {
    router.replace(getSafeRedirect())
  } else {
    errorMessage.value = result.message
    password.value = ''
    document.getElementById('login-password')?.focus()
  }
}
</script>

<template>
  <main class="login-page">
    <div class="login-card">
      <div class="login-header">
        <img src="/logo-pyme.jpeg" alt="" class="login-logo" />
        <h1 class="login-title">Acceso del encargado</h1>
        <p class="login-subtitle">SHOPS K&D · Panel de administración</p>
      </div>

      <form class="login-form" novalidate @submit.prevent="handleLogin">
        <div v-if="errorMessage" class="error-banner" role="alert">
          {{ errorMessage }}
        </div>

        <div class="form-group">
          <label for="login-email">Correo electrónico</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            inputmode="email"
            placeholder="tucorreo@ejemplo.com"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
          />
        </div>

        <div class="form-group">
          <label for="login-password">Contraseña</label>
          <div class="password-wrapper">
            <input
              id="login-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="toggle-password"
              :aria-pressed="showPassword"
              :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? 'Ocultar' : 'Mostrar' }}
            </button>
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="isLoading">
          {{ isLoading ? 'Ingresando...' : 'Iniciar sesión' }}
        </button>
      </form>

      <router-link to="/" class="back-link">← Volver a la tienda</router-link>
    </div>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--secondary) 0%, #ffffff 100%);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background-color: var(--bg-main);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.12);
}

.login-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.login-logo {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--primary);
  margin-bottom: 0.75rem;
}

.login-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary);
}

.login-subtitle {
  font-size: 0.88rem;
  color: var(--text-muted);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.error-banner {
  background-color: #fee2e2;
  color: #b91c1c;
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  border: 1px solid #fca5a5;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-main);
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  background-color: var(--bg-surface);
  font-family: inherit;
  transition: var(--transition);
}

.form-group input:focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(208, 0, 111, 0.15);
}

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  padding-right: 5.5rem;
}

.toggle-password {
  position: absolute;
  top: 50%;
  right: 0.5rem;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 0.4rem 0.6rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--secondary-dark);
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.toggle-password:hover {
  color: var(--primary);
}

.btn-block {
  width: 100%;
  margin-top: 0.25rem;
}

.btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.back-link {
  display: block;
  margin-top: 1.25rem;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--secondary-dark);
  text-decoration: none;
}

.back-link:hover {
  color: var(--primary);
  text-decoration: underline;
}
</style>