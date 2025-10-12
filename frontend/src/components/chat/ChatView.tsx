import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { setIsSending, userMessage, createSessionApi, sendMessageApi } from '../../features/chat/chatSlice'

export default function ChatView() {
  const dispatch = useAppDispatch()
  const { sessions, activeSessionId, isSending } = useAppSelector((s) => s.chat)
  const credits = useAppSelector((s) => s.auth.credits)
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const session = useMemo(() => sessions.find((s) => s.id === activeSessionId) ?? sessions[0] ?? null, [sessions, activeSessionId])
  const messages = session?.messages ?? []
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({})
  const [voteMap, setVoteMap] = useState<Record<string, 'up' | 'down' | null>>({})

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  const send = async (content?: string) => {
    const text = (content ?? input).trim()
    if (!text || isSending) return
    let targetId = activeSessionId || sessions[0]?.id
    if (!session && !targetId) {
      const res = await dispatch(createSessionApi('New Chat')).unwrap()
      targetId = res.id
    }
    // If targetId is not a UUID (legacy local id), create server session
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetId)) {
      const res = await dispatch(createSessionApi('New Chat')).unwrap()
      targetId = res.id
    }
    if (!targetId) return
    dispatch(userMessage(targetId, text))
    // Ensure we have messages array before relying on UI
    if (!content) setInput('')
    dispatch(setIsSending(true))
    const result = await dispatch(sendMessageApi({ sessionId: targetId, content: text }))
    if (sendMessageApi.rejected.match(result)) {
      // insufficient credits or failure
      // no-op UI; the typing indicator will stop
    }
    if (sendMessageApi.fulfilled.match(result)) {
      const credits = (result.payload as any).credits as number | undefined
      if (typeof credits === 'number') {
        // Update top bar credits via auth slice
        // Lazy import to avoid extra wiring here
        const { setCredits } = await import('../../features/auth/authSlice')
        dispatch(setCredits(credits))
      }
    }
  }

  const handleSuggestion = async (prompt: string) => {
    const text = prompt.trim()
    if (!text || isSending) return
    // Always create a fresh session for suggestion
    const created = await dispatch(createSessionApi(text.slice(0, 40))).unwrap()
    const targetId = created.id
    dispatch(userMessage(targetId, text))
    dispatch(setIsSending(true))
    const result = await dispatch(sendMessageApi({ sessionId: targetId, content: text }))
    if (sendMessageApi.fulfilled.match(result)) {
      const creditsVal = (result.payload as any).credits as number | undefined
      if (typeof creditsVal === 'number') {
        const { setCredits } = await import('../../features/auth/authSlice')
        dispatch(setCredits(creditsVal))
      }
    }
  }

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMap((m) => ({ ...m, [id]: true }))
      setTimeout(() => setCopiedMap((m) => ({ ...m, [id]: false })), 2000)
    } catch {}
  }

  const handleVote = (id: string, dir: 'up' | 'down') => {
    setVoteMap((m) => ({ ...m, [id]: m[id] === dir ? null : dir }))
  }

  return (
    <div className="h-full flex flex-col">
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full grid place-items-center">
            <div className="text-center px-4">
              <div className="mx-auto h-12 w-12 rounded-full grid place-items-center bg-indigo-50 text-indigo-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 className="mt-3 text-2xl font-semibold">Welcome to AI Chat</h2>
              <p className="mt-1 text-neutral-500 max-w-2xl">
                Start a conversation with our AI assistant. Ask questions, get help with tasks, or explore ideas together.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto w-full px-4">
                {[
                  'Explain quantum computing in simple terms',
                  'Write a Python function to sort a list',
                  'What are the benefits of meditation?',
                  'Help me plan a weekend trip to Paris',
                ].map((t) => (
                  <button
                    key={t}
                    onClick={() => handleSuggestion(t)}
                    className="w-full text-left px-4 py-3 rounded-full border bg-white hover:bg-neutral-50 shadow-sm overflow-hidden"
                  >
                    <div className="flex items-center gap-2 text-sm text-neutral-700 w-full min-w-0">
                      <span className="h-5 w-5 grid place-items-center text-indigo-600">
                        {/* chat bubble icon */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M21 12a7 7 0 0 1-7 7H9l-4 4v-4H6a7 7 0 0 1-7-7 7 7 0 0 1 7-7h8a7 7 0 0 1 7 7Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      <span className="flex-1 min-w-0 break-words whitespace-normal leading-snug">{t}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto p-4 sm:p-6">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-[90%] sm:max-w-[80%]`}>
                  <div className={`px-4 py-2 rounded-2xl shadow ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white'} prose prose-sm ${m.role === 'user' ? 'prose-invert' : ''}`}>
                    {m.role === 'assistant' ? (
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    ) : (
                      <div>{m.content}</div>
                    )}
                  </div>
                  {m.role === 'assistant' && (
                    <div className="mt-2 ml-2 flex items-center gap-5 text-indigo-600 transition-opacity duration-150">
                      <button
                        aria-label={copiedMap[m.id] ? 'Copied' : 'Copy'}
                        className={`inline-flex items-center hover:opacity-80 ${copiedMap[m.id] ? 'text-emerald-600' : 'text-indigo-600'}`}
                        onClick={() => handleCopy(m.id, m.content)}
                      >
                        {copiedMap[m.id] ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 13l4 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2"/></svg>
                        )}
                      </button>
                      <button
                        aria-label="Upvote"
                        className={`inline-flex items-center hover:opacity-80 ${voteMap[m.id] === 'up' ? 'text-emerald-600' : 'text-indigo-600'}`}
                        onClick={() => handleVote(m.id, 'up')}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 10v12"></path>
                          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path>
                        </svg>
                      </button>
                      <button
                        aria-label="Downvote"
                        className={`inline-flex items-center hover:opacity-80 ${voteMap[m.id] === 'down' ? 'text-rose-600' : 'text-indigo-600'}`}
                        onClick={() => handleVote(m.id, 'down')}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 14V2"></path>
                          <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>
                        </svg>
                      </button>
                      <button aria-label="More actions" className="hover:opacity-80">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                      </button>
                    </div>
                  )}
                </div>
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
      <div className="border-t p-3 sm:p-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-center">
            <div className="flex-1 h-auto rounded-full border shadow-sm bg-white grid grid-cols-[1fr_56px] sm:grid-cols-[1fr_48px] overflow-hidden">
              <textarea
                className="px-4 sm:px-5 py-3 outline-none text-sm sm:text-base resize-none min-h-12 max-h-40"
                placeholder={credits > 0 ? 'Ask me anything...' : 'Out of credits'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
                disabled={credits <= 0}
                rows={1}
              />
              <button onClick={() => send()} disabled={credits < 10 || isSending} className="h-full bg-indigo-600 text-white disabled:opacity-50 grid place-items-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 2L11 13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2l-7 20-4-9-9-4 20-7Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-500">
            <div>Press Enter to send, Shift+Enter for new line</div>
            <div>{input.length}/2000</div>
          </div>
        </div>
      </div>
    </div>
  )
}


