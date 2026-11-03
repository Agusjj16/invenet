// =====================================
// EVENTO GLOBAL DE NOTIFICACIONES
// =====================================

export const EVENTO_NOTIFICACIONES_ACTUALIZADAS =
  "invenet:notificaciones-actualizadas";

// =====================================
// EMITIR EVENTO DE ACTUALIZACIÓN
// =====================================

export function emitirNotificacionesActualizadas() {
  window.dispatchEvent(
    new Event(EVENTO_NOTIFICACIONES_ACTUALIZADAS)
  );
}