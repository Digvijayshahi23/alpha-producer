/**
 * Live telemetry over one WebSocket: the backend pushes on a single multiplexed channel (see
 * its `realtime.py`) and replays each topic's last message on connect. Reconnects with
 * backoff, because a local backend restarts often.
 */
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

const RECONNECT_MIN = 500
const RECONNECT_MAX = 10_000
/** Silence that means the socket is gone. The backend pings every 25s when nothing else is
 * happening, so this only fires when the connection died without closing — a sleep, a
 * suspended VM, a dropped tunnel — which leaves the socket reading OPEN forever. */
const SILENCE_MS = 60_000
class Telemetry {
  socket = null
  handlers = new Map()
  statusHandlers = new Set()
  delay = RECONNECT_MIN
  connected = false
  silence = null
  connect() {
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const socket = new WebSocket(`${protocol}//${location.host}/ws`)
    this.socket = socket
    socket.onopen = () => {
      this.delay = RECONNECT_MIN
      this.setConnected(true)
      this.heard()
    }
    socket.onmessage = (event) => {
      this.heard()
      let envelope
      try {
        envelope = JSON.parse(event.data)
      } catch {
        return
      }
      if (!envelope.topic || envelope.topic === 'ping') return
      for (const handler of this.handlers.get(envelope.topic) ?? []) handler(envelope.payload)
    }
    socket.onclose = () => {
      if (this.silence) clearTimeout(this.silence)
      this.silence = null
      this.setConnected(false)
      this.socket = null
      setTimeout(() => this.connect(), this.delay)
      this.delay = Math.min(this.delay * 2, RECONNECT_MAX)
    }
    socket.onerror = () => socket.close()
  }
  /** Restart the silence timer. Closing a dead socket is what starts the reconnect. */
  heard() {
    if (this.silence) clearTimeout(this.silence)
    this.silence = setTimeout(() => {
      this.silence = null
      this.socket?.close()
    }, SILENCE_MS)
  }
  setConnected(connected) {
    this.connected = connected
    for (const handler of this.statusHandlers) handler(connected)
  }
  subscribe(topic, handler) {
    const set = this.handlers.get(topic) ?? new Set()
    set.add(handler)
    this.handlers.set(topic, set)
    return () => set.delete(handler)
  }
  onStatus(handler) {
    this.statusHandlers.add(handler)
    // Report the current state at once: the socket opens long before components mount.
    handler(this.connected)
    return () => this.statusHandlers.delete(handler)
  }
}
export const telemetry = new Telemetry()
/** Run `handler` for every message on `topic`. The handler may change freely. */
function useTopic(topic, handler) {
  const ref = useRef(handler)
  useEffect(() => {
    ref.current = handler
  })
  useEffect(() => telemetry.subscribe(topic, (payload) => ref.current(payload)), [topic])
}
/**
 * Refetch queries under `queryKey` whenever `topic` reports a change. The socket is a signal,
 * not state, so a drifting payload shape can never desync the UI; bursts collapse to one
 * refetch per `minGapMs`, with a trailing call so the final state still lands.
 */
export function useRefetchOn(topic, queryKey, minGapMs = 1000) {
  const queryClient = useQueryClient()
  const last = useRef(0)
  const pending = useRef(null)
  const keyRef = useRef(queryKey)
  useEffect(() => {
    keyRef.current = queryKey
  })
  useTopic(topic, () => {
    const fire = () => {
      last.current = Date.now()
      pending.current = null
      void queryClient.invalidateQueries({ queryKey: keyRef.current })
    }
    const since = Date.now() - last.current
    if (since >= minGapMs) fire()
    else if (!pending.current) pending.current = setTimeout(fire, minGapMs - since)
  })
  useEffect(
    () => () => {
      if (pending.current) clearTimeout(pending.current)
    },
    [],
  )
}
