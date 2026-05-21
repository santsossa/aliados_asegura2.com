/**
 * SSE (Server-Sent Events) — broadcast de notificaciones en tiempo real.
 * Mantiene un mapa aliado_id → Set<Response> con todas las conexiones activas.
 */
import { Response } from 'express'

const clients = new Map<string, Set<Response>>()

export function sseAdd(aliadoId: string, res: Response): void {
  if (!clients.has(aliadoId)) clients.set(aliadoId, new Set())
  clients.get(aliadoId)!.add(res)
}

export function sseRemove(aliadoId: string, res: Response): void {
  const set = clients.get(aliadoId)
  if (!set) return
  set.delete(res)
  if (set.size === 0) clients.delete(aliadoId)
}

/** Envía un evento SSE a todas las pestañas abiertas de un aliado. */
export function ssePush(aliadoId: string, event: string, data: object): void {
  const conns = clients.get(aliadoId)
  if (!conns || conns.size === 0) return
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  conns.forEach(res => {
    try { res.write(payload) } catch { /* cliente ya desconectado */ }
  })
}
