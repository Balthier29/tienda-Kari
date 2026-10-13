import { supabase } from '@/supabase'

// Traduce los errores de Supabase a mensajes claros.
// A propósito NO se distingue entre "correo inexistente" y "contraseña mala".
const friendlyError = (error) => {
  const msg = (error?.message || '').toLowerCase()

  if (msg.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (msg.includes('email not confirmed')) return 'Esta cuenta aún no está confirmada. Pídele al administrador del sitio que la active.'
  if (msg.includes('rate limit') || error?.status === 429) return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
  if (msg.includes('network') || msg.includes('failed to fetch')) return 'Sin conexión. Revisa tu internet e inténtalo otra vez.'
  return 'No se pudo iniciar sesión. Inténtalo de nuevo.'
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  })

  if (error) {
    console.error('Error de login:', error.message)
    return { ok: false, message: friendlyError(error) }
  }
  return { ok: true }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) console.error('Error al cerrar sesión:', error.message)
}