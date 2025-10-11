import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit'

export type Role = 'user' | 'assistant' | 'system'

export type Message = {
  id: string
  role: Role
  content: string
  createdAt: number
}

export type ChatSession = {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

type ChatState = {
  sessions: ChatSession[]
  activeSessionId: string | null
  isSending: boolean
}

const initialState: ChatState = {
  sessions: [],
  activeSessionId: null,
  isSending: false,
}

function persist(state: ChatState) {
  localStorage.setItem('chatState', JSON.stringify(state))
}

function restoreFromStorage(): ChatState | null {
  const raw = localStorage.getItem('chatState')
  return raw ? (JSON.parse(raw) as ChatState) : null
}

const restored = restoreFromStorage()

const chatSlice = createSlice({
  name: 'chat',
  initialState: restored ?? initialState,
  reducers: {
    createSession: {
      reducer: (state, action: PayloadAction<ChatSession>) => {
        state.sessions.unshift(action.payload)
        state.activeSessionId = action.payload.id
        persist(state)
      },
      prepare: (title?: string) => ({
        payload: {
          id: nanoid(),
          title: title || 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as ChatSession,
      }),
    },
    setActiveSession: (state, action: PayloadAction<string>) => {
      state.activeSessionId = action.payload
      persist(state)
    },
    addMessage: (state, action: PayloadAction<{ sessionId: string; message: Message }>) => {
      const session = state.sessions.find((s) => s.id === action.payload.sessionId)
      if (!session) return
      session.messages.push(action.payload.message)
      session.updatedAt = Date.now()
      persist(state)
    },
    userMessage: {
      reducer: (state, action: PayloadAction<{ sessionId: string; content: string }>) => {
        const session = state.sessions.find((s) => s.id === action.payload.sessionId)
        if (!session) return
        session.messages.push({ id: nanoid(), role: 'user', content: action.payload.content, createdAt: Date.now() })
        session.updatedAt = Date.now()
        persist(state)
      },
      prepare: (sessionId: string, content: string) => ({ payload: { sessionId, content } }),
    },
    assistantMessage: {
      reducer: (state, action: PayloadAction<{ sessionId: string; content: string }>) => {
        const session = state.sessions.find((s) => s.id === action.payload.sessionId)
        if (!session) return
        session.messages.push({ id: nanoid(), role: 'assistant', content: action.payload.content, createdAt: Date.now() })
        session.updatedAt = Date.now()
        persist(state)
      },
      prepare: (sessionId: string, content: string) => ({ payload: { sessionId, content } }),
    },
    renameSession: (state, action: PayloadAction<{ id: string; title: string }>) => {
      const session = state.sessions.find((s) => s.id === action.payload.id)
      if (!session) return
      session.title = action.payload.title
      session.updatedAt = Date.now()
      persist(state)
    },
    deleteSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter((s) => s.id !== action.payload)
      if (state.activeSessionId === action.payload) state.activeSessionId = state.sessions[0]?.id ?? null
      persist(state)
    },
    setIsSending: (state, action: PayloadAction<boolean>) => {
      state.isSending = action.payload
    },
  },
})

export const {
  createSession,
  setActiveSession,
  addMessage,
  userMessage,
  assistantMessage,
  renameSession,
  deleteSession,
  setIsSending,
} = chatSlice.actions

export default chatSlice.reducer


