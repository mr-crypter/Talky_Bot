import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type User = {
  id: string
  email: string
  name?: string
}

type AuthState = {
  isAuthenticated: boolean
  token: string | null
  user: User | null
  credits: number
}

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  user: null,
  credits: 1250,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{ token: string; user: User; credits?: number }>,
    ) => {
      state.isAuthenticated = true
      state.token = action.payload.token
      state.user = action.payload.user
      if (typeof action.payload.credits === 'number') state.credits = action.payload.credits
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
      localStorage.setItem('credits', String(state.credits))
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.token = null
      state.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    restore: (state) => {
      const token = localStorage.getItem('token')
      const userRaw = localStorage.getItem('user')
      const creditsRaw = localStorage.getItem('credits')
      if (token) {
        state.isAuthenticated = true
        state.token = token
      }
      if (userRaw) state.user = JSON.parse(userRaw)
      if (creditsRaw) state.credits = Number(creditsRaw)
    },
    deductCredits: (state, action: PayloadAction<number>) => {
      state.credits = Math.max(0, state.credits - action.payload)
      localStorage.setItem('credits', String(state.credits))
    },
    addCredits: (state, action: PayloadAction<number>) => {
      state.credits += action.payload
      localStorage.setItem('credits', String(state.credits))
    },
  },
})

export const { loginSuccess, logout, restore, deductCredits, addCredits } = authSlice.actions
export default authSlice.reducer


