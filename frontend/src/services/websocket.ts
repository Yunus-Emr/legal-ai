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
