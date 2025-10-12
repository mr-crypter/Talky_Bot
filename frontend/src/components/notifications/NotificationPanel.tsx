import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { markAllRead, markRead, togglePanel } from '../../features/notifications/notificationsSlice'
import { api } from '../../lib/api'

export default function NotificationPanel() {
  const { list, panelOpen } = useAppSelector((s) => s.notifications)
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (!panelOpen) return
    ;(async () => {
      try {
        const { data } = await api.get('/notifications')
        // Merge server history with existing (simple prepend for demo)
        // Avoid duplicates by id
        for (const n of data as any[]) {
          // pushNotification expects (title, body, variant)
          // do not add duplicates
          if (!list.find((x) => x.id === n.id)) {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            dispatch({ type: 'notifications/pushNotification', payload: { id: n.id, title: n.title, body: n.body, createdAt: new Date(n.created_at).getTime(), read: false, variant: 'info' } })
          }
        }
      } catch {}
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen])
  if (!panelOpen) return null

  return (
    <div className="fixed right-4 top-16 w-96 max-w-[95vw] bg-white border rounded-xl shadow-xl p-3 z-50">
      <div className="flex items-center justify-between px-2 py-1">
        <div className="font-medium">Notifications</div>
        <div className="flex items-center gap-3">
          <button className="text-sm text-indigo-600" onClick={() => dispatch(markAllRead(undefined))}>Mark all read</button>
          <button className="text-sm text-neutral-500" onClick={() => dispatch(togglePanel(undefined))}>Close</button>
        </div>
      </div>
      <div className="max-h-[60vh] overflow-y-auto mt-2 space-y-2">
        {list.length === 0 && <div className="text-sm text-neutral-500 px-2 py-8 text-center">No notifications</div>}
        {list.map((n) => (
          <div key={n.id} className={`px-3 py-2 rounded border ${n.read ? 'bg-white' : 'bg-indigo-50 border-indigo-100'}`}>
            <div className="flex items-start gap-2">
              <span className={`mt-1 h-2 w-2 rounded-full ${n.variant === 'success' ? 'bg-emerald-500' : n.variant === 'warning' ? 'bg-amber-500' : n.variant === 'error' ? 'bg-rose-500' : 'bg-indigo-500'}`}></span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{n.title}</div>
                  <div className="text-xs text-neutral-400">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                {n.body && <div className="text-sm text-neutral-600">{n.body}</div>}
                {!n.read && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                    <button className="text-xs text-indigo-600" onClick={() => dispatch(markRead(n.id))}>Mark read</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


