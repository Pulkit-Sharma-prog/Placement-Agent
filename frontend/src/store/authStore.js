import { create } from 'zustand'

const storedUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null') }
  catch { return null }
}

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user: storedUser(),

  login(token, user) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user })
  },

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  },
}))
