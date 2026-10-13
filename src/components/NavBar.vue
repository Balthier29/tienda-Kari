<script setup>
import { useSession } from '@/composables/useSession'

// Solo hay sesión si el visitante es un administrador: el público nunca ve el enlace
const { session } = useSession()
</script>

<template>
  <header class="navbar-header">
    <div class="container navbar-container">
      <!-- Brand Logo / Nombre -->
      <router-link to="/" class="navbar-brand" aria-label="SHOPS K&D, ir al inicio">
        <img src="/logo-pyme.jpeg" alt="" class="navbar-logo" />
        <div class="brand-text">
          <span class="brand-title">SHOPS K&D</span>
          <span class="brand-subtitle">Confitería y Salado</span>
        </div>
      </router-link>

      <!-- Acciones: solo para el administrador con sesión iniciada -->
      <nav v-if="session" class="navbar-actions" aria-label="Administración">
        <router-link to="/admin" class="btn btn-admin">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>Ir al panel</span>
        </router-link>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.navbar-header {
  background-color: var(--bg-main);
  border-bottom: 2px solid var(--secondary);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.navbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  user-select: none;
}

.navbar-logo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary);
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--primary);
  line-height: 1.1;
  letter-spacing: 0.5px;
}

.brand-subtitle {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--secondary-dark);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-admin {
  background-color: var(--bg-surface);
  color: var(--text-main);
  border: 1px solid var(--border-color);
  font-size: 0.88rem;
  padding: 0.5rem 1rem;
}

.btn-admin:hover {
  border-color: var(--primary);
  color: var(--primary);
  background-color: var(--secondary);
}

@media (max-width: 480px) {
  .brand-title {
    font-size: 1.1rem;
  }

  .brand-subtitle {
    font-size: 0.68rem;
  }

  .navbar-logo {
    width: 40px;
    height: 40px;
  }

  .btn-admin {
    padding: 0.5rem 0.75rem;
  }
}
</style>