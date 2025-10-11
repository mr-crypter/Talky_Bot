import ChatView from '../chat/ChatView'
import NotificationPanel from '../notifications/NotificationPanel'

export default function RootView() {
  return (
    <div className="relative h-full">
      <ChatView />
      <NotificationPanel />
    </div>
  )
}


