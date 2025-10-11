import { Routes, Route, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppDispatch } from './store/hooks'
import { restore } from './features/auth/authSlice'
import Login from './pages/Login'
import Signup from './pages/Signup'
import RequireAuth from './routes/RequireAuth'
import ChatLayout from './components/layout/ChatLayout'
import OrgsPage from './pages/OrgsPage.tsx'
import ChatView from './components/chat/ChatView'

export default function App() {
  const dispatch = useAppDispatch()
  useEffect(() => {
    dispatch(restore())
  }, [dispatch])
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route element={<ChatLayout />}> 
          <Route index element={<ChatView />} />
        </Route>
        <Route path="/orgs" element={<OrgsPage />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="*" element={<div className="p-6">Not found. <Link to="/">Go home</Link></div>} />
    </Routes>
  )
}
