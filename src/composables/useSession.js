import { ref } from 'vue'
import { supabase } from '@/supabase'

// Estado compartido de la sesión: cualquier componente puede saber si hay alguien con sesión
// iniciada (por ejemplo, para mostrar el enlace al panel solo a los administradores).
const session = ref(null)
const ready = ref(false)
let started = false

export function useSession() {
  if (!started) {
    started = true

    supabase.auth.getSession().then(({ data }) => {
      session.value = data.session
      ready.value = true
    })

    // Se actualiza solo al iniciar o cerrar sesión, también desde otra pestaña
    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      ready.value = true
    })
  }

  return { session, ready }
}