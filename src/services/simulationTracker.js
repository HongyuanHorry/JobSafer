// Lightweight front-end tracking for simulation events.
// Stores events in localStorage queue and attempts async POST to /api/simulation/event.

const QUEUE_KEY = 'stepsafe_event_queue'
const CLIENT_KEY = 'stepsafe_client_id'

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function getClientId() {
  let id = localStorage.getItem(CLIENT_KEY)
  if (!id) {
    id = uuidv4()
    try {
      localStorage.setItem(CLIENT_KEY, id)
    } catch (e) {
      // ignore storage failures
    }
  }
  return id
}

function readQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

function writeQueue(q) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q))
  } catch (e) {
    // ignore
  }
}

async function sendQueue() {
  // Local-only tracking: keep queued items in localStorage for later use.
  return
}

function enqueue(event) {
  const clientId = getClientId()
  const payload = Object.assign({ clientId, timestamp: new Date().toISOString() }, event)
  const q = readQueue()
  q.push(payload)
  writeQueue(q)
  // keep local queue only
}

export function trackEvent(event) {
  try {
    enqueue(event)
  } catch (e) {
    // swallow errors to avoid blocking UI
  }
}

export async function flushEvents() {
  await sendQueue()
}
