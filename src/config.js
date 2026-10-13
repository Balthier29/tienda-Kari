// Solo dígitos, por si alguien lo escribe con +, espacios o guiones
export const WHATSAPP_NUMBER = (process.env.VUE_APP_WHATSAPP_NUMBER || '').replace(/\D/g, '')

export const buildWhatsAppUrl = (message) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`