<script setup>
import { ref } from 'vue'
import { optimizeImage } from '@/utils/optimizeImage'

const props = defineProps({
  products: { type: Array, required: true },
  addProduct: { type: Function, required: true },
  updateProduct: { type: Function, required: true },
  deleteProduct: { type: Function, required: true },
  toggleAvailability: { type: Function, required: true }
})

const emit = defineEmits(['close-dashboard'])

// Límites de validación (los mismos deben respetarse en la base de datos)
const NAME_MIN = 3
const NAME_MAX = 80
const DETAIL_MIN = 10
const DETAIL_MAX = 500
const PRICE_MAX = 10000000

const newProduct = ref({
  id: null,
  name: '',
  price: '',
  image: '',
  detail: '',
  available: true
})

const fieldErrors = ref({ name: '', price: '', detail: '' })

const imageFile = ref(null)      // Blob optimizado, pendiente de subir
const imagePreview = ref('')
const successMessage = ref('')
const errorMessage = ref('')
const isUploading = ref(false)   // optimizando la foto
const isSaving = ref(false)      // guardando en Supabase
const isEditing = ref(false)

const formatPrice = (price) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(price)

const showMessage = (type, text, ms = 3000) => {
  successMessage.value = ''
  errorMessage.value = ''
  if (type === 'success') successMessage.value = text
  else errorMessage.value = text

  setTimeout(() => {
    successMessage.value = ''
    errorMessage.value = ''
  }, ms)
}

// ---------- Validación ----------
const validate = () => {
  const errors = { name: '', price: '', detail: '' }
  const name = newProduct.value.name.trim()
  const detail = newProduct.value.detail.trim()
  const price = Number(newProduct.value.price)

  if (!name) errors.name = 'Escribe el nombre del producto.'
  else if (name.length < NAME_MIN) errors.name = `El nombre debe tener al menos ${NAME_MIN} caracteres.`
  else if (name.length > NAME_MAX) errors.name = `El nombre no puede superar los ${NAME_MAX} caracteres.`

  if (!Number.isInteger(price) || price <= 0) errors.price = 'Ingresa un precio entero mayor a 0, sin decimales.'
  else if (price > PRICE_MAX) errors.price = 'El precio es demasiado alto. Revísalo.'

  if (!detail) errors.detail = 'Escribe una descripción del producto.'
  else if (detail.length < DETAIL_MIN) errors.detail = `La descripción debe tener al menos ${DETAIL_MIN} caracteres.`
  else if (detail.length > DETAIL_MAX) errors.detail = `La descripción no puede superar los ${DETAIL_MAX} caracteres.`

  fieldErrors.value = errors
  return !Object.values(errors).some(Boolean)
}

// Limpia el error de un campo apenas el usuario lo corrige
const clearError = (field) => {
  if (fieldErrors.value[field]) fieldErrors.value[field] = ''
}

const focusFirstError = () => {
  const order = [['name', 'p-name'], ['price', 'p-price'], ['detail', 'p-detail']]
  const first = order.find(([field]) => fieldErrors.value[field])
  if (first) document.getElementById(first[1])?.focus()
}

// ---------- Imagen ----------
// Libera la URL temporal de la vista previa
const revokePreview = () => {
  if (imagePreview.value.startsWith('blob:')) URL.revokeObjectURL(imagePreview.value)
}

const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    alert('Por favor selecciona un archivo de imagen válido')
    return
  }
  if (file.size > 25 * 1024 * 1024) {
    alert('La imagen es demasiado grande. Máximo 25 MB')
    return
  }

  isUploading.value = true
  try {
    const blob = await optimizeImage(file)
    revokePreview()
    imageFile.value = blob
    imagePreview.value = URL.createObjectURL(blob)
  } catch (err) {
    console.error('Error al optimizar la imagen:', err)
    alert('No se pudo procesar la imagen. Prueba con otra foto.')
  } finally {
    isUploading.value = false
  }
}

// Si pega una URL, descarta el archivo pendiente
const onUrlInput = () => {
  revokePreview()
  imageFile.value = null
  imagePreview.value = newProduct.value.image
}

const removeImage = () => {
  revokePreview()
  imageFile.value = null
  newProduct.value.image = ''
  imagePreview.value = ''
  const fileInput = document.getElementById('p-image-file')
  if (fileInput) fileInput.value = ''
}

// ---------- Formulario ----------
const resetForm = () => {
  revokePreview()
  newProduct.value = { id: null, name: '', price: '', image: '', detail: '', available: true }
  fieldErrors.value = { name: '', price: '', detail: '' }
  imageFile.value = null
  imagePreview.value = ''
  const fileInput = document.getElementById('p-image-file')
  if (fileInput) fileInput.value = ''
}

const startEdit = (product) => {
  revokePreview()
  isEditing.value = true
  imageFile.value = null
  fieldErrors.value = { name: '', price: '', detail: '' }
  newProduct.value = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    detail: product.detail,
    available: product.available !== false
  }
  imagePreview.value = product.image
  window.scrollTo({ top: document.querySelector('.form-section').offsetTop - 20, behavior: 'smooth' })
}

const cancelEdit = () => {
  isEditing.value = false
  resetForm()
}

const handleSubmit = async () => {
  if (!validate()) {
    focusFirstError()
    return
  }

  isSaving.value = true
  const payload = {
    ...newProduct.value,
    name: newProduct.value.name.trim(),
    detail: newProduct.value.detail.trim(),
    price: Number(newProduct.value.price),
    imageFile: imageFile.value
  }
  const wasEditing = isEditing.value

  const result = wasEditing
    ? await props.updateProduct(payload)
    : await props.addProduct(payload)

  isSaving.value = false

  if (result.ok) {
    showMessage('success', wasEditing
      ? '¡Producto actualizado correctamente!'
      : '¡Producto agregado exitosamente al catálogo!')
    isEditing.value = false
    resetForm()
  } else {
    // El formulario NO se limpia: no se pierde lo que escribió
    showMessage('error', result.message, 5000)
  }
}

// ---------- Acciones sobre la lista ----------
const handleToggle = async (product) => {
  const makeAvailable = product.available === false
  const result = await props.toggleAvailability(product.id, makeAvailable)

  if (result.ok) {
    showMessage('success', `"${product.name}" marcado como ${makeAvailable ? 'disponible' : 'agotado'}.`)
  } else {
    showMessage('error', result.message, 5000)
  }
}

const handleDelete = async (product) => {
  if (!confirm(`¿Estás seguro de que quieres eliminar "${product.name}"?`)) return

  const result = await props.deleteProduct(product.id)

  if (result.ok) {
    if (newProduct.value.id === product.id) cancelEdit()
    showMessage('success', 'Producto eliminado correctamente')
  } else {
    showMessage('error', result.message || 'No se pudo eliminar el producto.', 4000)
  }
}

const sortedProductsByViews = () =>
  [...props.products].sort((a, b) => (b.views || 0) - (a.views || 0))
</script>

<template>
  <div class="dashboard-wrapper">
    <div class="container">
      <!-- Header -->
      <div class="dashboard-header">
        <div>
          <h1 class="dashboard-title">Panel de Encargado - SHOPS K&D</h1>
          <p class="dashboard-subtitle">Gestiona tu catálogo de confitería y salados</p>
        </div>
        <button class="btn btn-secondary" @click="emit('close-dashboard')">
          ← Volver a la Tienda
        </button>
      </div>

      <!-- Mensajes globales (quedan visibles aunque estés más abajo en la página) -->
      <div class="message-area">
        <div v-if="successMessage" class="success-banner" role="status">
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="error-banner" role="alert">
          {{ errorMessage }}
        </div>
      </div>

      <!-- Métricas -->
      <section class="metrics-section">
        <h2 class="section-heading">📊 Productos Más Vistos</h2>
        <div class="table-container">
          <table class="metrics-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th class="text-center">Vistas</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in sortedProductsByViews()" :key="product.id">
                <td class="product-info-cell">
                  <img :src="product.image" :alt="product.name" class="table-thumb" loading="lazy" />
                  <span class="product-name-text">{{ product.name }}</span>
                </td>
                <td>{{ formatPrice(product.price) }}</td>
                <td class="text-center">
                  <span class="badge-views">{{ product.views || 0 }}</span>
                </td>
              </tr>
              <tr v-if="products.length === 0">
                <td colspan="3" class="text-center text-muted">No hay productos registrados.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Lista de productos + acciones -->
      <section class="products-list-section">
        <h2 class="section-heading">🗂️ Gestión de Productos</h2>

        <div v-if="products.length === 0" class="empty-state">
          No hay productos. ¡Agrega el primero!
        </div>

        <div v-else class="admin-products-grid">
          <div v-for="product in products" :key="product.id" class="admin-product-card">
            <img
              :src="product.image"
              :alt="product.name"
              class="admin-product-img"
              :class="{ 'is-soldout': product.available === false }"
              loading="lazy"
            />
            <div class="admin-product-info">
              <h3>
                {{ product.name }}
                <span v-if="product.available === false" class="status-pill">Agotado</span>
              </h3>
              <p class="admin-price">{{ formatPrice(product.price) }}</p>
              <p class="admin-detail">{{ product.detail }}</p>
              <div class="admin-actions">
                <button class="btn btn-edit" @click="startEdit(product)">✏️ Editar</button>
                <button class="btn btn-toggle" @click="handleToggle(product)">
                  {{ product.available === false ? '✅ Marcar disponible' : '🚫 Marcar agotado' }}
                </button>
                <button class="btn btn-delete" @click="handleDelete(product)">🗑️ Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Formulario Agregar / Editar -->
      <section class="form-section">
        <h2 class="section-heading">
          {{ isEditing ? '✏️ Editar Producto' : '➕ Agregar Nuevo Producto' }}
        </h2>

        <form @submit.prevent="handleSubmit" class="product-form" novalidate>
          <div class="form-grid">
            <div class="form-group">
              <label for="p-name">Nombre del Producto</label>
              <input
                id="p-name"
                v-model="newProduct.name"
                type="text"
                placeholder="Ej: Trufas Artesanales K&D"
                :maxlength="NAME_MAX"
                aria-required="true"
                :aria-invalid="fieldErrors.name ? 'true' : 'false'"
                aria-describedby="err-name"
                @input="clearError('name')"
              />
              <div class="field-meta">
                <p id="err-name" class="field-error" role="alert">{{ fieldErrors.name }}</p>
                <span class="char-count">{{ newProduct.name.length }}/{{ NAME_MAX }}</span>
              </div>
            </div>

            <div class="form-group">
              <label for="p-price">Precio (CLP)</label>
              <input
                id="p-price"
                v-model.number="newProduct.price"
                type="number"
                inputmode="numeric"
                placeholder="Ej: 3500"
                min="1"
                step="1"
                aria-required="true"
                :aria-invalid="fieldErrors.price ? 'true' : 'false'"
                aria-describedby="err-price"
                @input="clearError('price')"
              />
              <div class="field-meta">
                <p id="err-price" class="field-error" role="alert">{{ fieldErrors.price }}</p>
              </div>
            </div>
          </div>

          <!-- Imagen -->
          <div class="form-group">
            <label>Imagen del Producto</label>

            <div class="image-upload-area">
              <input
                id="p-image-file"
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                class="file-input"
              />

              <label for="p-image-file" class="file-label">
                <span v-if="isUploading">⏳ Optimizando imagen...</span>
                <span v-else-if="!imagePreview">📷 Seleccionar imagen</span>
                <span v-else>🔄 Cambiar imagen</span>
              </label>
              <p class="hint">Sube la foto tal cual, se optimiza sola (WebP, 800px).</p>
            </div>

            <div v-if="imagePreview" class="image-preview-container">
              <img :src="imagePreview" alt="Vista previa" class="image-preview" />
              <button type="button" class="btn-remove-image" @click="removeImage">
                ✕ Quitar imagen
              </button>
            </div>

            <div class="url-option">
              <label for="p-image-url">O pega una URL de imagen</label>
              <input
                id="p-image-url"
                v-model="newProduct.image"
                type="text"
                placeholder="https://ejemplo.com/imagen.jpg"
                @input="onUrlInput"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="p-detail">Detalle / Descripción</label>
            <textarea
              id="p-detail"
              v-model="newProduct.detail"
              rows="4"
              placeholder="Describe el producto..."
              :maxlength="DETAIL_MAX"
              aria-required="true"
              :aria-invalid="fieldErrors.detail ? 'true' : 'false'"
              aria-describedby="err-detail"
              @input="clearError('detail')"
            ></textarea>
            <div class="field-meta">
              <p id="err-detail" class="field-error" role="alert">{{ fieldErrors.detail }}</p>
              <span class="char-count">{{ newProduct.detail.length }}/{{ DETAIL_MAX }}</span>
            </div>
          </div>

          <div class="form-group form-check">
            <label class="check-label" for="p-available">
              <input id="p-available" v-model="newProduct.available" type="checkbox" />
              Producto disponible para la venta
            </label>
            <p class="hint">Si lo desmarcas, la tienda lo muestra como "Agotado" y oculta el botón de WhatsApp.</p>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="isUploading || isSaving">
              {{ isSaving ? 'Guardando...' : isUploading ? 'Optimizando imagen...' : (isEditing ? 'Guardar Cambios' : 'Publicar Producto') }}
            </button>

            <button
              v-if="isEditing"
              type="button"
              class="btn btn-secondary"
              @click="cancelEdit"
            >
              Cancelar
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.dashboard-wrapper {
  padding: 2.5rem 0 4rem 0;
  background-color: var(--bg-surface);
  min-height: calc(100vh - 75px);
}

.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2.5rem;
  align-items: flex-start;
}

@media (min-width: 768px) {
  .dashboard-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.dashboard-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--primary);
  margin-bottom: 0.25rem;
}

.dashboard-subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.section-heading {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 1rem;
}

/* Mensajes: pegados bajo el navbar para verse en cualquier punto de la página */
.message-area {
  position: sticky;
  top: 84px;
  z-index: 50;
}

.success-banner {
  background-color: #d1fae5;
  color: #065f46;
  padding: 0.85rem;
  border-radius: var(--radius-sm);
  margin-bottom: 1.25rem;
  font-weight: 600;
  border: 1px solid #a7f3d0;
  text-align: center;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
}

.error-banner {
  background-color: #fee2e2;
  color: #b91c1c;
  padding: 0.85rem;
  border-radius: var(--radius-sm);
  margin-bottom: 1.25rem;
  font-weight: 600;
  border: 1px solid #fca5a5;
  text-align: center;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
}

/* Métricas */
.metrics-section {
  background-color: var(--bg-main);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}

.table-container {
  overflow-x: auto;
}

.metrics-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.metrics-table th,
.metrics-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.95rem;
}

.metrics-table th {
  background-color: var(--secondary);
  color: var(--secondary-dark);
  font-weight: 700;
}

.product-info-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.table-thumb {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-color);
}

.product-name-text {
  font-weight: 600;
}

.text-center {
  text-align: center;
}

.badge-views {
  background-color: var(--secondary);
  color: var(--secondary-dark);
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.85rem;
}

/* Lista de productos para gestionar */
.products-list-section {
  background-color: var(--bg-main);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
}

.admin-products-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

@media (min-width: 768px) {
  .admin-products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.admin-product-card {
  display: flex;
  gap: 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1rem;
  background-color: var(--bg-surface);
}

.admin-product-img {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.admin-product-img.is-soldout {
  filter: grayscale(1);
  opacity: 0.6;
}

.admin-product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.admin-product-info h3 {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.status-pill {
  display: inline-block;
  margin-left: 0.35rem;
  padding: 2px 8px;
  border-radius: 10px;
  background-color: #595959;
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  vertical-align: middle;
}

.admin-price {
  font-weight: 800;
  color: var(--primary);
  margin-bottom: 0.35rem;
}

.admin-detail {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.admin-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: auto;
}

.btn-edit {
  background-color: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.btn-edit:hover {
  background-color: #bfdbfe;
}

.btn-toggle {
  background-color: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.btn-toggle:hover {
  background-color: #fde68a;
}

.btn-delete {
  background-color: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.btn-delete:hover {
  background-color: #fecaca;
}

/* Formulario */
.form-section {
  background-color: var(--bg-main);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}

.product-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

@media (min-width: 640px) {
  .form-grid {
    grid-template-columns: 2fr 1fr;
  }
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

.form-group input,
.form-group textarea {
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  background-color: var(--bg-surface);
  font-family: inherit;
  transition: var(--transition);
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(208, 0, 111, 0.15);
}

/* Campo con error */
.form-group input[aria-invalid="true"],
.form-group textarea[aria-invalid="true"] {
  border-color: #b91c1c;
  background-color: #fff5f5;
}

.field-meta {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 1.1rem;
}

.field-error {
  color: #b91c1c;
  font-size: 0.82rem;
  font-weight: 600;
}

.char-count {
  margin-left: auto;
  color: var(--text-muted);
  font-size: 0.78rem;
}

/* Checkbox de disponibilidad */
.form-group.form-check .check-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
}

.form-group.form-check input[type="checkbox"] {
  width: 20px;
  height: 20px;
  padding: 0;
  accent-color: var(--primary);
}

/* Subida de imagen */
.image-upload-area {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-input {
  display: none;
}

.file-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1.25rem;
  background-color: var(--secondary);
  color: var(--secondary-dark);
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  transition: var(--transition);
  text-align: center;
}

.file-label:hover {
  background-color: #dcb1eb;
  border-color: var(--primary);
}

.hint {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.image-preview-container {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

.image-preview {
  max-width: 220px;
  max-height: 220px;
  border-radius: var(--radius-md);
  object-fit: contain;
  background-color: var(--bg-surface);
  border: 2px solid var(--border-color);
}

.btn-remove-image {
  background-color: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-remove-image:hover {
  background-color: #fecaca;
}

.url-option {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.url-option label {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 0.4rem;
  display: block;
}

.form-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-secondary {
  background-color: var(--secondary);
  color: var(--secondary-dark);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background-color: #dcb1eb;
}
</style>