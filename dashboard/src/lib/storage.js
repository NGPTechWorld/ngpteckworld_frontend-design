export const TOKEN_KEY = 'ngp_admin_token'
export const LANG_KEY = 'ngp_admin_lang'

/** localStorage that never throws (private mode, blocked storage, SSR/tests). */
export const storage = {
  get(key, fallback = null) {
    try {
      const value = window.localStorage.getItem(key)
      return value === null ? fallback : value
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value)
      return true
    } catch {
      return false
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  },
}

export const getToken = () => storage.get(TOKEN_KEY)
export const setToken = (token) => storage.set(TOKEN_KEY, token)
export const clearToken = () => storage.remove(TOKEN_KEY)
