import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

export type Notification = {
  id: string
  title: string
  body?: string
  createdAt: number
  read: boolean
  variant?: 'success' | 'info' | 'warning' | 'error'
}

type NotificationsState = {
  list: Notification[]
  panelOpen: boolean
}

const initialState: NotificationsState = {
  list: [],
  panelOpen: false,
}

function persist(state: NotificationsState) {
  localStorage.setItem('notificationsState', JSON.stringify(state))
}

function restore(): NotificationsState | null {
  const raw = localStorage.getItem('notificationsState')
  return raw ? (JSON.parse(raw) as NotificationsState) : null
}

const restored = restore()

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: restored ?? initialState,
  reducers: {
    pushNotification: {
      reducer: (state, action: PayloadAction<Notification>) => {
        state.list.unshift(action.payload)
        persist(state)
      },
      prepare: (title: string, body?: string, variant: Notification['variant'] = 'info') => ({
        payload: { id: nanoid(), title, body, createdAt: Date.now(), read: false, variant } as Notification,
      }),
    },
    markRead: (state, action: PayloadAction<string>) => {
      const n = state.list.find((n) => n.id === action.payload)
      if (!n) return
      n.read = true
      persist(state)
    },
    togglePanel: (state, action?: PayloadAction<boolean | undefined>) => {
      state.panelOpen = action?.payload ?? !state.panelOpen
    },
    setPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.panelOpen = action.payload
    },
    markAllRead: (state) => {
      state.list.forEach((n) => (n.read = true))
      persist(state)
    },
    clearAll: (state) => {
      state.list = []
      persist(state)
    },
  },
})

export const { pushNotification, markRead, togglePanel, setPanelOpen, markAllRead, clearAll } = notificationsSlice.actions
export default notificationsSlice.reducer


