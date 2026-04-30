// ── Chat WebSocket ────────────────────────────────────────────
let ws: WebSocket | null = null
type MessageHandler = (data: unknown) => void

export function connectWebSocket(
  sessionId: string,
  onMessage: MessageHandler,
  onError?: (e: Event) => void,
) {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host = window.location.hostname
  const url = `${protocol}://${host}:8000/ws/chat/${sessionId}`

  ws = new WebSocket(url)

  ws.onopen = () => {
    console.log('[WS] Connected:', sessionId)
  }

  ws.onmessage = e => {
    try {
      const data = JSON.parse(e.data)
      onMessage(data)
    } catch {
      onMessage(e.data)
    }
  }

  ws.onerror = e => {
    console.error('[WS] Error:', e)
    onError?.(e)
  }

  ws.onclose = () => {
    console.log('[WS] Disconnected')
    ws = null
  }

  return ws
}

export function sendWebSocketMessage(payload: unknown) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload))
    return true
  }
  return false
}

export function disconnectWebSocket() {
  ws?.close()
  ws = null
}

// ── Processing WebSocket ──────────────────────────────────────
export interface ProcessingEvent {
  type: 'progress' | 'complete' | 'error'
  doc_id: string
  stage?: string
  progress?: number
  chunk_count?: number
  message?: string
}

const processingConnections = new Map<string, WebSocket>()

export function connectProcessingWS(
  docId: string,
  onEvent: (event: ProcessingEvent) => void,
  onDone?: () => void,
): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host = window.location.hostname
  const url = `${protocol}://${host}:8000/ws/processing/${docId}`

  const socket = new WebSocket(url)
  processingConnections.set(docId, socket)

  socket.onmessage = e => {
    try {
      const event = JSON.parse(e.data) as ProcessingEvent
      onEvent(event)
      if (event.type === 'complete' || event.type === 'error') {
        onDone?.()
        socket.close()
        processingConnections.delete(docId)
      }
    } catch {
      console.error('[WS-Processing] Parse error:', e.data)
    }
  }

  socket.onerror = () => {
    onEvent({ type: 'error', doc_id: docId, message: 'WebSocket bağlantı hatası' })
    processingConnections.delete(docId)
  }

  socket.onclose = () => {
    processingConnections.delete(docId)
  }

  return socket
}

export function disconnectProcessingWS(docId: string) {
  processingConnections.get(docId)?.close()
  processingConnections.delete(docId)
}

