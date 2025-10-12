import { createAsyncThunk, createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit'
import { api } from '../../lib/api'

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
  error?: string | null
}

const initialState: ChatState = {
  sessions: [],
  activeSessionId: null,
  isSending: false,
  error: null,
}

function persist(state: ChatState) {
  localStorage.setItem('chatState', JSON.stringify(state))
}

function restoreFromStorage(): ChatState | null {
  const raw = localStorage.getItem('chatState')
  return raw ? (JSON.parse(raw) as ChatState) : null
}

const restored = restoreFromStorage()

function mapServerSession(row: any): ChatSession {
  return {
    id: row.id,
    title: row.title ?? 'New Chat',
    messages: [],
    createdAt: row.createdAt ?? (row.created_at ? Date.parse(row.created_at) : Date.now()),
    updatedAt: row.updatedAt ?? (row.updated_at ? Date.parse(row.updated_at) : Date.now()),
  }
}

function mapServerMessage(row: any): Message {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.createdAt ?? (row.created_at ? Date.parse(row.created_at) : Date.now()),
  }
}

export const fetchSessions = createAsyncThunk('chat/fetchSessions', async () => {
  const { data } = await api.get<ChatSession[]>('/chat/sessions')
  return (data as any[]).map(mapServerSession)
})

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (sessionId: string, { rejectWithValue }) => {
    // Ignore non-UUID legacy ids from local storage
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
      return rejectWithValue('invalid_session_id')
    }
    const { data } = await api.get(`/chat/sessions/${sessionId}/messages`)
    return { sessionId, messages: (data as any[]).map(mapServerMessage) as Message[] }
  },
)

export const createSessionApi = createAsyncThunk('chat/createSession', async (title: string | undefined) => {
  const { data } = await api.post<ChatSession>('/chat/sessions', { title })
  return mapServerSession(data)
})

export const sendMessageApi = createAsyncThunk(
  'chat/sendMessage',
  async ({ sessionId, content }: { sessionId: string; content: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/chat/sessions/${sessionId}/message`, { content })
      return { sessionId, assistant: data.content as string }
    } catch (e: any) {
      if (e?.response?.status === 402) return rejectWithValue('insufficient_credits')
      return rejectWithValue('send_failed')
    }
  },
)

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
  extraReducers: (builder) => {
    builder
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.sessions = action.payload
        // Always sync active session to server sessions to avoid legacy local ids
        state.activeSessionId = state.sessions[0]?.id || null
        persist(state)
      })
      .addCase(createSessionApi.fulfilled, (state, action) => {
        state.sessions.unshift(action.payload)
        state.activeSessionId = action.payload.id
        persist(state)
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        let session = state.sessions.find((s) => s.id === action.payload.sessionId)
        if (!session) {
          // Create a stub session entry if missing
          session = { id: action.payload.sessionId, title: 'New Chat', messages: [], createdAt: Date.now(), updatedAt: Date.now() }
          state.sessions.unshift(session)
        }
        session.messages = action.payload.messages ?? []
        session.updatedAt = Date.now()
        persist(state)
      })
      .addCase(sendMessageApi.pending, (state) => {
        state.isSending = true
        state.error = null
      })
      .addCase(sendMessageApi.fulfilled, (state, action) => {
        state.isSending = false
        const session = state.sessions.find((s) => s.id === action.payload.sessionId)
        if (!session) return
        if (!session.messages) session.messages = []
        session.messages.push({ id: nanoid(), role: 'assistant', content: action.payload.assistant, createdAt: Date.now() })
        session.updatedAt = Date.now()
        persist(state)
      })
      .addCase(sendMessageApi.rejected, (state, action) => {
        state.isSending = false
        state.error = (action.payload as string) || 'send_failed'
      })
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


