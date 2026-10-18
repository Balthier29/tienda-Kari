<script setup>
import { useProducts } from '@/composables/useProducts'
import Navbar from '@/components/NavBar.vue'
import ProductCard from '@/components/productCard.vue'
import { useSession } from '@/composables/useSession'

const { session } = useSession()

// La tienda solo necesita leer productos y registrar vistas
const { products, loading, loadError, incrementView } = useProducts()

const currentYear = new Date().getFullYear()
</script>

<template>
  <div class="store-page">
    <Navbar />

    <main class="main-content">
      <!-- Hero Section con Identidad de la Pyme -->
      <section class="hero-section">
        <div class="container hero-container">
          <div class="hero-text">
            <h1 class="hero-title">SHOPS K&D</h1>
            <p class="hero-tagline">Frutas Deshidratadas</p>
            <p class="hero-description">
              Productos elavorados con mucho cariño, cuidando cada detalle para llevar hasta ti lo mejor de nuestras frutas. Haz clic en
              <strong style="color: var(--primary);">"Pedir por WS"</strong>
              o revisa los detalles para coordinar tu compra directamente con nosotros.
            </p>
          </div>
          <div class="hero-logo-wrapper">
            <img src="/logo-pyme.jpeg" alt="Logo SHOPS K&D" class="hero-logo-img" />
          </div>
        </div>
      </section>

      <!-- Grilla de Productos -->
      <section class="container catalog-section">
        <div class="flex-between catalog-header">
          <h2>Catálogo Disponible</h2>
          <span v-if="!loading && !loadError" class="product-count">{{ products.length }} productos</span>
        </div>

        <!-- Cargando: tarjetas esqueleto -->
        <div v-if="loading" class="products-grid" aria-busy="true" aria-label="Cargando catálogo">
          <div v-for="n in 6" :key="n" class="skeleton-card"></div>
        </div>

        <div v-else-if="loadError" class="empty-catalog" role="alert">
          <p>{{ loadError }}</p>
        </div>

        <div v-else-if="products.length > 0" class="products-grid">
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
            @register-view="incrementView"
          />
        </div>

        <div v-else class="empty-catalog">
          <p>No hay productos disponibles en este momento. Vuelve pronto o contacta al administrador.</p>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="container text-center">
        <p>&copy; {{ currentYear }} SHOPS K&D - Confitería y Salado. Todos los derechos reservados.</p>
        <p class="footer-sub">Ventas y tratos coordinados vía WhatsApp.</p>
        <p v-if="!session" class="footer-admin">
          <router-link to="/admin/login" class="admin-link">Acceso encargado</router-link>
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.store-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex-grow: 1;
}

.hero-section {
  background: linear-gradient(135deg, var(--secondary) 0%, #FFFFFF 100%);
  padding: 3rem 0;
  border-bottom: 1px solid var(--border-color);
}

.hero-container {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 2rem;
  text-align: center;
}

@media (min-width: 768px) {
  .hero-container {
    flex-direction: row;
    text-align: left;
    justify-content: space-between;
  }
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--primary);
  margin-bottom: 0.5rem;
  letter-spacing: 1px;
}

.hero-tagline {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--secondary-dark);
  margin-bottom: 1rem;
}

.hero-description {
  font-size: 1rem;
  color: var(--text-muted);
  max-width: 600px;
  line-height: 1.6;
}

.hero-logo-wrapper {
  flex-shrink: 0;
}

.hero-logo-img {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--primary);
  box-shadow: 0 10px 25px rgba(208, 0, 111, 0.2);
}

.catalog-section {
  padding: 3rem 0;
}

.catalog-header {
  margin-bottom: 1.5rem;
}

.catalog-header h2 {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-main);
}

.product-count {
  background-color: var(--secondary);
  color: var(--secondary-dark);
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.88rem;
}

.empty-catalog {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-muted);
  font-size: 1.1rem;
  background-color: var(--bg-surface);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--border-color);
}

.skeleton-card {
  height: 420px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: linear-gradient(90deg, var(--bg-surface) 25%, var(--secondary) 50%, var(--bg-surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite linear;
}

@keyframes shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-card { animation: none; }
}

.site-footer {
  background-color: var(--text-main);
  color: #FFFFFF;
  padding: 2rem 0;
  margin-top: auto;
  text-align: center;
}

.site-footer p {
  font-size: 0.9rem;
  opacity: 0.9;
}

.footer-sub {
  font-size: 0.8rem;
  opacity: 0.6;
  margin-top: 0.25rem;
}

.footer-admin {
  margin-top: 0.75rem;
}

.admin-link {
  font-size: 0.8rem;
  color: #d4d4d4;
  text-decoration: underline;
}

.admin-link:hover {
  color: #ffffff;
}
</style>