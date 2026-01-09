import { getBearerToken } from './auth'

export async function apiPost(path, body) {
  const token = getBearerToken()

  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
    },
    body: JSON.stringify(body),
  })

  const contentType = res.headers.get('content-type') || ''
  const raw = await res.text()

  if (!contentType.includes('application/json')) {
    console.error('Non-JSON response:', {
      url: path,
      status: res.status,
      contentType,
      preview: raw.slice(0, 200),
    })
  }

  const data = contentType.includes('application/json') && raw ? JSON.parse(raw) : raw || null

  if (!res.ok) {
    const msg =
      (data && typeof data === 'object' && (data.error || data.message)) ||
      `HTTP ${res.status} ${res.statusText}`
    console.error(msg)
    throw new Error(msg)
  }

  return data
}


export async function apiGet(path) {
  const token = getBearerToken()

  const res = await fetch(path, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: token } : {}),
    },
  })

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status} ${res.statusText}`
    throw new Error(msg)
  }

  return data
}