export const TOKEN_KEY = 'auth_token'
export const TOKEN_COOKIE = 'auth_token'

export function saveBearerToken(token) {
  const normalized = token.startsWith('Bearer ') ? token : `Bearer ${token}`
  localStorage.setItem(TOKEN_KEY, normalized)
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(normalized)}; Path=/; SameSite=Lax`
}

export function getBearerToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0`
}