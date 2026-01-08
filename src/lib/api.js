import { getBearerToken } from './auth'

const BASE_URL = 'https://takora.ru'

export async function apiPost(path, body) {
  const token = getBearerToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status} ${res.statusText}`
    throw new Error(msg)
  }

  return data
}

export async function apiGet(path) {
  const token = getBearerToken()

  const res = await fetch(`${BASE_URL}${path}`, {
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
