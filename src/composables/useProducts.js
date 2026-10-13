import { ref, onMounted } from 'vue'
import { supabase } from '@/supabase'

const BUCKET = 'product-images'
const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80'

export function useProducts() {
  const products = ref([])
  const loading = ref(true)
  const loadError = ref('')

  // ---------- Storage ----------
  const uploadImage = async (blob) => {
    const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: blob.type, cacheControl: '31536000' })

    if (error) throw error

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  }

  // Solo borra si la URL pertenece a nuestro bucket (ignora URLs externas)
  const removeImage = async (url) => {
    const marker = `/object/public/${BUCKET}/`
    const i = url ? url.indexOf(marker) : -1
    if (i === -1) return
    const path = url.slice(i + marker.length)
    const { error } = await supabase.storage.from(BUCKET).remove([path])
    if (error) console.error('Error al borrar imagen:', error.message)
  }

  // ---------- Productos ----------
  const loadProducts = async () => {
    loading.value = true
    loadError.value = ''

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.error('Error al cargar productos:', error.message)
      loadError.value = 'No se pudo cargar el catálogo. Intenta recargar la página.'
    } else {
      products.value = data || []
    }
    loading.value = false
  }

  const addProduct = async (newProduct) => {
    let uploadedUrl = null
    try {
      let image = newProduct.image || DEFAULT_IMAGE
      if (newProduct.imageFile) {
        uploadedUrl = await uploadImage(newProduct.imageFile)
        image = uploadedUrl
      }

      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: newProduct.name,
          price: Number(newProduct.price),
          image,
          detail: newProduct.detail,
          available: newProduct.available !== false,
          views: 0
        }])
        .select()

      if (error) throw error

      products.value.push(data[0])
      return { ok: true }
    } catch (err) {
      console.error('Error al agregar producto:', err.message)
      if (uploadedUrl) await removeImage(uploadedUrl) // no dejar archivos huérfanos
      return { ok: false, message: 'No se pudo guardar el producto. Revisa tu conexión y los permisos.' }
    }
  }

  const updateProduct = async (updatedProduct) => {
    const current = products.value.find(p => p.id === updatedProduct.id)
    let uploadedUrl = null
    try {
      let image = updatedProduct.image || DEFAULT_IMAGE
      if (updatedProduct.imageFile) {
        uploadedUrl = await uploadImage(updatedProduct.imageFile)
        image = uploadedUrl
      }

      const { data, error } = await supabase
        .from('products')
        .update({
          name: updatedProduct.name,
          price: Number(updatedProduct.price),
          detail: updatedProduct.detail,
          available: updatedProduct.available !== false,
          image
        })
        .eq('id', updatedProduct.id)
        .select()

      if (error) throw error
      if (!data || data.length === 0) throw new Error('Sin filas actualizadas (revisa RLS)')

      const index = products.value.findIndex(p => p.id === updatedProduct.id)
      if (index !== -1) products.value[index] = { ...data[0] }

      // Si la imagen cambió, borra la anterior del bucket
      if (current && current.image !== image) await removeImage(current.image)

      return { ok: true }
    } catch (err) {
      console.error('Error al actualizar el producto:', err.message)
      if (uploadedUrl) await removeImage(uploadedUrl)
      return { ok: false, message: 'No se pudo actualizar el producto. Revisa tu conexión y los permisos.' }
    }
  }

  // Marcar un producto como disponible / agotado sin tocar el resto de sus datos
  const toggleAvailability = async (productId, available) => {
    const { data, error } = await supabase
      .from('products')
      .update({ available })
      .eq('id', productId)
      .select()

    if (error) {
      console.error('Error al cambiar disponibilidad:', error.message)
      return { ok: false, message: 'No se pudo cambiar la disponibilidad. ¿Existe la columna "available"?' }
    }
    if (!data || data.length === 0) {
      return { ok: false, message: 'No se actualizó. Revisa las políticas (RLS) de Supabase.' }
    }

    const index = products.value.findIndex(p => p.id === productId)
    if (index !== -1) products.value[index] = { ...products.value[index], ...data[0] }
    return { ok: true }
  }

  const deleteProduct = async (productId) => {
    const current = products.value.find(p => p.id === productId)

    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .select()

    if (error) {
      console.error('Error al eliminar producto:', error.message)
      return { ok: false, message: 'No se pudo eliminar el producto.' }
    }
    if (!data || data.length === 0) {
      return { ok: false, message: 'No se eliminó. Revisa las políticas (RLS) de Supabase.' }
    }

    products.value = products.value.filter(p => p.id !== productId)
    if (current) await removeImage(current.image)
    return { ok: true }
  }

  // Suma la vista con una función SQL (increment_views): es atómica y no exige permiso de UPDATE
  const incrementView = async (productId) => {
    const product = products.value.find(p => p.id === productId)
    if (product) product.views = (product.views || 0) + 1   // se refleja al instante

    const { error } = await supabase.rpc('increment_views', { product_id: productId })
    if (error) console.error('Error al registrar vista:', error.message)
  }

  onMounted(loadProducts)

  return {
    products,
    loading,
    loadError,
    addProduct,
    updateProduct,
    toggleAvailability,
    deleteProduct,
    incrementView,
    loadProducts
  }
}