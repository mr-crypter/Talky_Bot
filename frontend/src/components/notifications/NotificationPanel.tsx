import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { markRead, togglePanel } from '../../features/notifications/notificationsSlice'

export default function NotificationPanel() {
  const { list, panelOpen } = useAppSelector((s) => s.notifications)
  const dispatch = useAppDispatch()
  if (!panelOpen) return null

  return (
    <div className="fixed right-4 top-16 w-96 max-w-[95vw] bg-white border rounded-xl shadow-xl p-3 z-50">
      <div className="flex items-center justify-between px-2 py-1">
        <div className="font-medium">Notifications</div>
        <button className="text-sm text-neutral-500" onClick={() => dispatch(togglePanel(false))}>Close</button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto mt-2 space-y-2">
        {list.length === 0 && <div className="text-sm text-neutral-500 px-2 py-8 text-center">No notifications</div>}
        {list.map((n) => (
          <div key={n.id} className={`px-3 py-2 rounded border ${n.read ? 'bg-white' : 'bg-indigo-50 border-indigo-100'}`}>
            <div className="font-medium text-sm">{n.title}</div>
            {n.body && <div className="text-sm text-neutral-600">{n.body}</div>}
            <div className="text-xs text-neutral-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
            {!n.read && (
              <button className="text-xs text-indigo-600 mt-1" onClick={() => dispatch(markRead(n.id))}>Mark read</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


