import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { assistantMessage, createSession, setIsSending, userMessage } from '../../features/chat/chatSlice'
import { deductCredits } from '../../features/auth/authSlice'

export default function ChatView() {
  const dispatch = useAppDispatch()
  const { sessions, activeSessionId, isSending } = useAppSelector((s) => s.chat)
  const credits = useAppSelector((s) => s.auth.credits)
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const session = useMemo(() => sessions.find((s) => s.id === activeSessionId) ?? null, [sessions, activeSessionId])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [session?.messages.length])

  const send = async (content?: string) => {
    const text = (content ?? input).trim()
    if (!text || isSending) return
    if (!session) dispatch(createSession('New Chat'))
    const id = activeSessionId || (sessions[0]?.id ?? '')
    const targetId = id || sessions[0]?.id
    if (!targetId) return
    dispatch(userMessage(targetId, text))
    if (!content) setInput('')
    dispatch(setIsSending(true))
    dispatch(deductCredits(1))

    // Placeholder assistant reply
    setTimeout(() => {
      dispatch(assistantMessage(targetId, 'Great question! Let me break this down for you... This is a mock response to demonstrate the chat functionality. In a real application, this would be connected to an actual AI service.'))
      dispatch(setIsSending(false))
    }, 600)
  }

  const handleSuggestion = (prompt: string) => {
    void send(prompt)
  }

  return (
    <div className="h-full flex flex-col">
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {!session || session.messages.length === 0 ? (
          <div className="h-full grid place-items-center">
            <div className="text-center px-4">
              <div className="mx-auto h-12 w-12 rounded-full grid place-items-center bg-indigo-50 text-indigo-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 className="mt-3 text-2xl font-semibold">Welcome to AI Chat</h2>
              <p className="mt-1 text-neutral-500 max-w-2xl">
                Start a conversation with our AI assistant. Ask questions, get help with tasks, or explore ideas together.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 max-w-3xl mx-auto">
                {[
                  'Explain quantum computing in simple terms',
                  'Write a Python function to sort a list',
                  'What are the benefits of meditation?',
                  'Help me plan a weekend trip to Paris',
                ].map((t) => (
                  <button
                    key={t}
                    onClick={() => handleSuggestion(t)}
                    className="text-left px-4 py-3 rounded-full border bg-white hover:bg-neutral-50 shadow-sm"
                  >
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <span className="h-5 w-5 grid place-items-center text-indigo-600">
                        {/* chat bubble icon */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M21 12a7 7 0 0 1-7 7H9l-4 4v-4H6a7 7 0 0 1-7-7 7 7 0 0 1 7-7h8a7 7 0 0 1 7 7Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      <span>{t}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto p-6">
            {session.messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2 rounded-2xl shadow ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white'} max-w-[80%]`}>{m.content}</div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 grid place-items-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6 8a6 6 0 0 0-12 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    <span className="text-sm text-neutral-500">AI Assistant</span>
                  </div>
                  <div className="px-4 py-2 rounded-2xl shadow bg-white inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-neutral-300 animate-pulse" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-neutral-300 animate-pulse" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-neutral-300 animate-pulse" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="border-t p-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-center">
            <div className="flex-1 h-12 rounded-full border shadow-sm bg-white grid grid-cols-[1fr_48px] overflow-hidden">
              <input
                className="px-5 outline-none"
                placeholder={credits > 0 ? 'Ask me anything...' : 'Out of credits'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={credits <= 0}
              />
              <button onClick={send} disabled={credits <= 0 || isSending} className="h-full bg-indigo-600 text-white disabled:opacity-50 grid place-items-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 2L11 13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2l-7 20-4-9-9-4 20-7Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
            <div>Press Enter to send, Shift+Enter for new line</div>
            <div>{input.length}/2000</div>
          </div>
        </div>
      </div>
    </div>
  )
}


