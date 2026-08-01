/*
  CAPA DE ALMACENAMIENTO  —  el único archivo que cambia al migrar a la Raspberry Pi.

  HOY (provisional en Vercel):
    Los datos se guardan en el navegador del dispositivo (localStorage).
    Funciona sin servidor, pero cada dispositivo tiene sus propios datos
    y no hay fotos todavía.

  MAÑANA (Raspberry Pi + PocketBase):
    Sustituye el INTERIOR de estas funciones por llamadas a PocketBase.
    Las firmas (get / set / remove) NO cambian, así que App.jsx no se toca.
    Correspondencia de claves -> colecciones de PocketBase:
      "profile"          -> colección "perfil"    (1 registro)
      "weights"          -> colección "pesos"     (fecha, kg)
      "log:AAAA-MM-DD"   -> colección "registros" (fecha, comidas marcadas)
    Ejemplo con el SDK de PocketBase:
      import PocketBase from "pocketbase";
      const pb = new PocketBase("http://IP-DE-TU-PI:8090");
      export async function get(key) { ...pb.collection(...).getFirstListItem... }
*/

const PREFIX = "miplan:";

export async function get(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function set(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {}
}

export async function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {}
}
