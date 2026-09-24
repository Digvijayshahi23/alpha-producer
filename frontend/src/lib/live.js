/**
 * Hot state pushed over the socket, held outside React. Components read a slice with a
 * selector (`useLive((s) => s.simulations)`), so a tick re-renders only what reads it.
 */
import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import { buildCores } from './matrix'
import { telemetry } from './ws'

/**
 * One stable core assignment shared by every matrix view, so the Simulation Matrix page and
 * the header preview put each batch on the same core, and a cancel never shifts the rest.
 */
let coreAssignment = new Map()
export function useCores(active, slots, maxBatch) {
  const built = useMemo(
    () => buildCores(active ?? [], slots, maxBatch, coreAssignment),
    [active, slots, maxBatch],
  )
  // Kept after the render commits, never during it: a render may be thrown away (StrictMode
  // runs each one twice), and a discarded pass must not move everyone's core.
  useEffect(() => {
    coreAssignment = built.assignment
  }, [built])
  return built
}
export const useLive = create(() => ({
  connected: false,
  simulations: null,
  tasks: null,
  sync: null,
  verificationUrl: null,
}))
// A snapshot from before a disconnect may be long stale; dropping it re-arms the REST fallbacks.
telemetry.onStatus((connected) =>
  useLive.setState(connected ? { connected } : { connected, simulations: null }),
)
telemetry.subscribe('simulations', (payload) => {
  // The topic also carries `{alphaId, stored}` from backfill; only arrays are snapshots.
  if (Array.isArray(payload)) useLive.setState({ simulations: payload })
})
telemetry.subscribe('tasks', (payload) => useLive.setState({ tasks: payload }))
telemetry.subscribe('sync', (payload) => useLive.setState({ sync: payload }))
