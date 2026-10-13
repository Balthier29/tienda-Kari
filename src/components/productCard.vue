<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'
import { buildWhatsAppUrl } from '@/config'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['register-view'])

const showDetailModal = ref(false)
const modalRef = ref(null)
const closeBtnRef = ref(null)
let lastFocusedElement = null

// Si la columna "available" no existe o viene null, se considera disponible
const isAvailable = computed(() => props.product.available !== false)

// Formatear precio a CLP ($ 1.000)
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(price)
}

// Link directo de WhatsApp con mensaje personalizado (el número viene de .env)
const getWhatsAppUrl = () =>
  buildWhatsAppUrl(`Hola SHOPS K&D! Me interesa comprar el producto: ${props.product.name}`)

// ---------- Modal accesible ----------
const FOCUSABLE =
  'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'

const onKeydown = (event) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeDetail()
    return
  }

  // Atrapar el foco dentro del modal
  if (event.key === 'Tab' && modalRef.value) {
    const focusables = [...modalRef.value.querySelectorAll(FOCUSABLE)]
    if (focusables.length === 0) return

    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}

// Abrir modal de detalle y registrar métrica de vista
const openDetail = async () => {
  lastFocusedElement = document.activeElement
  showDetailModal.value = true
  emit('register-view', props.product.id)

  document.body.style.overflow = 'hidden'   // bloquea el scroll del fondo
  document.addEventListener('keydown', onKeydown)

  await nextTick()
  closeBtnRef.value?.focus()
}

const closeDetail = () => {
  showDetailModal.value = false
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)

  // Devuelve el foco al elemento que abrió el modal
  nextTick(() => lastFocusedElement?.focus?.())
}

// Por si el componente se destruye con el modal abierto (ej. al borrar el producto)
onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <article class="card">
    <!-- La imagen es un atajo para mouse/táctil; el equivalente de teclado es el título y "Ver detalle" -->
    <div class="card-image-container" @click="openDetail">
      <img
        :src="product.image"
        :alt="product.name"
        class="card-image"
        :class="{ 'is-soldout': !isAvailable }"
        loading="lazy"
      />
      <span class="card-badge" :class="{ 'badge-soldout': !isAvailable }">
        {{ isAvailable ? 'Disponible' : 'Agotado' }}
      </span>
    </div>

    <div class="card-body">
      <h3 class="card-title">
        <button type="button" class="card-title-btn" @click="openDetail">
          {{ product.name }}
        </button>
      </h3>
      <p class="card-price">{{ formatPrice(product.price) }}</p>

      <p class="card-description">
        {{ product.detail }}
      </p>

      <div class="card-actions">
        <button
          type="button"
          class="btn btn-secondary"
          :aria-label="`Ver detalle de ${product.name}`"
          @click="openDetail"
        >
          Ver detalle
        </button>

        <a
          v-if="isAvailable"
          :href="getWhatsAppUrl()"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-whatsapp"
          :aria-label="`Pedir ${product.name} por WhatsApp (se abre en una pestaña nueva)`"
          @click="emit('register-view', product.id)"
        >
          Pedir por WS
        </a>
        <button v-else type="button" class="btn btn-soldout" disabled>
          Agotado
        </button>
      </div>
    </div>

    <!-- Modal fuera del <article>, directamente en <body> -->
    <Teleport to="body">
      <div
        v-if="showDetailModal"
        class="modal-overlay"
        @click.self="closeDetail"
      >
        <div
          ref="modalRef"
          class="modal-content"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="`modal-title-${product.id}`"
        >
          <button
            ref="closeBtnRef"
            type="button"
            class="modal-close"
            aria-label="Cerrar detalle del producto"
            @click="closeDetail"
          >
            <span aria-hidden="true">&times;</span>
          </button>

          <img
            :src="product.image"
            :alt="product.name"
            class="modal-image"
            :class="{ 'is-soldout': !isAvailable }"
          />

          <div class="modal-body">
            <h2 :id="`modal-title-${product.id}`" class="modal-title">{{ product.name }}</h2>
            <p class="modal-price">{{ formatPrice(product.price) }}</p>
            <div class="modal-description-box">
              <p>{{ product.detail }}</p>
            </div>

            <a
              v-if="isAvailable"
              :href="getWhatsAppUrl()"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-whatsapp btn-block"
              @click="emit('register-view', product.id)"
            >
              Comprar vía WhatsApp
              <span class="sr-only">(se abre en una pestaña nueva)</span>
            </a>
            <p v-else class="soldout-note" role="status">
              Este producto está agotado por ahora. Vuelve pronto.
            </p>
          </div>
        </div>
      </div>
    </Teleport>
  </article>
</template>

<style scoped>
.card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.card:hover,
.card:focus-within {
  box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.12);
  border-color: var(--primary);
}

.card-image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  cursor: pointer;
  overflow: hidden;
  background-color: #f0f0f0;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.45s ease;
}

.card-image-container:hover .card-image {
  transform: scale(1.06);
}

/* Producto agotado: imagen apagada */
.is-soldout {
  filter: grayscale(1);
  opacity: 0.6;
}

.card-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: var(--primary);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
}

.card-badge.badge-soldout {
  background-color: #595959;
}

.card-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

/* El título es un botón real, pero se ve como texto */
.card-title-btn {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: var(--text-main);
  text-align: left;
  cursor: pointer;
}

.card-title-btn:hover {
  color: var(--primary);
}

.card-price {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--primary);
  margin-bottom: 0.75rem;
}

.card-description {
  font-size: 0.92rem;
  color: var(--text-muted);
  margin-bottom: 1.25rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex-grow: 1;
}

.card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.btn-secondary {
  background-color: var(--secondary);
  color: var(--secondary-dark);
}

.btn-secondary:hover {
  background-color: #dcb1eb;
}

.btn-soldout {
  background-color: #e5e5e5;
  color: #595959;
  cursor: not-allowed;
}

.btn-block {
  width: 100%;
  margin-top: 1rem;
}

.soldout-note {
  margin-top: 1rem;
  padding: 0.85rem 1rem;
  background-color: #f1f1f1;
  color: #404040;
  border-radius: var(--radius-sm);
  font-weight: 600;
  text-align: center;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.modal-content {
  background-color: var(--bg-main);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: var(--radius-lg);
  position: relative;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
  animation: modalFadeIn 0.25s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  font-size: 1.8rem;
  width: 44px;               /* objetivo táctil mínimo recomendado */
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-main);
  z-index: 10;
}

.modal-close:hover {
  color: var(--primary);
}

.modal-image {
  display: block;
  width: 100%;
  height: auto;
  max-height: 60vh;
  object-fit: contain;
  background-color: var(--bg-surface);
}

.modal-body {
  padding: 1.5rem;
}

.modal-title {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.modal-price {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--primary);
  margin-bottom: 1rem;
}

.modal-description-box {
  background-color: var(--bg-surface);
  padding: 1rem;
  border-radius: var(--radius-sm);
  border-left: 4px solid var(--primary);
  font-size: 0.95rem;
  color: var(--text-main);
}

@media (prefers-reduced-motion: reduce) {
  .modal-content,
  .card-image {
    animation: none;
    transition: none;
  }
}
</style>