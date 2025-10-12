import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { createSession, setActiveSession, fetchMessages } from '../../features/chat/chatSlice'
import { togglePanel } from '../../features/notifications/notificationsSlice'
import NotificationPanel from '../notifications/NotificationPanel'
import { getSocket } from '../../lib/socket'
import { pushNotification } from '../../features/notifications/notificationsSlice'
import { fetchSessions } from '../../features/chat/chatSlice'

export default function ChatLayout() {
  const dispatch = useAppDispatch()
  const sessions = useAppSelector((s) => s.chat.sessions)
  const activeId = useAppSelector((s) => s.chat.activeSessionId)
  const credits = useAppSelector((s) => s.auth.credits)
  const user = useAppSelector((s) => s.auth.user)

  useEffect(() => {
    dispatch(fetchSessions())
    const socket = getSocket()
    if (!socket.connected) socket.connect()
    socket.off('notification')
    socket.on('notification', (n: { id: string; title: string; body?: string; created_at?: string }) => {
      dispatch(pushNotification(n.title, n.body))
    })
    return () => {
      socket.off('notification')
    }
  }, [dispatch])

  return (
    <div className="h-dvh grid grid-cols-[300px_1fr] grid-rows-[64px_1fr] bg-white">
      {/* Top bar */}
      <header className="col-span-2 flex items-center justify-between gap-4 px-4 border-b bg-white sticky top-0 h-16">
        <div className="font-semibold">AI Chat</div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 text-sm px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 3v3m0 12v3M4.22 4.22l2.12 2.12m11.32 11.32 2.12 2.12M3 12h3m12 0h3M4.22 19.78l2.12-2.12m11.32-11.32 2.12-2.12" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {credits.toLocaleString()}
          </div>
          <button aria-label="Notifications" className="relative p-2 rounded-full hover:bg-neutral-100" onClick={() => dispatch(togglePanel(undefined))}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-neutral-700">
              <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .53-.21 1.04-.6 1.4L4 17h5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 17a3 3 0 0 0 6 0" strokeWidth="2" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-indigo-600 text-white text-[10px] grid place-items-center">1</span>
          </button>
          <button className="inline-flex items-center gap-2 pl-2 pr-1 h-9 rounded-full bg-indigo-600 text-white">
            <span className="h-7 w-7 rounded-full bg-white/20 grid place-items-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6 8a6 6 0 0 0-12 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="pr-1 text-sm hidden sm:inline">{user?.email ?? 'User'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="opacity-90">
              <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="border-r p-4 overflow-y-auto bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-neutral-700">Conversations</div>
          <button className="p-1 text-neutral-500" aria-label="Collapse sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <button
          onClick={() => dispatch(createSession('New Chat'))}
          className="w-full mb-4 inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 shadow"
        >
          <span className="inline-grid place-items-center h-6 w-6 rounded bg-white/20">+</span>
          <span className="font-medium">New Chat</span>
        </button>
        {sessions.length === 0 ? (
          <div className="h-[60vh] grid place-items-center text-neutral-500 text-sm">
            <div className="text-center">
              <div className="mx-auto mb-2 h-10 w-10 rounded-full grid place-items-center bg-neutral-100 text-neutral-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>No conversations yet</div>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.id)) {
                    return
                  }
                  dispatch(setActiveSession(s.id))
                  dispatch(fetchMessages(s.id))
                }}
                className={`w-full text-left px-3 py-2 rounded ${activeId === s.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-neutral-100'} transition`}
              >
                <div className="truncate">{s.title}</div>
                <div className="text-xs text-neutral-500">{new Date(s.updatedAt).toLocaleString()}</div>
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* Main chat area */}
      <main className="relative overflow-y-auto bg-white">
        <Outlet />
        <NotificationPanel />
      </main>
    </div>
  )
}


