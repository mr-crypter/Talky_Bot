import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'

export default function RequireAuth() {
  const isAuth = useAppSelector((s) => s.auth.isAuthenticated)
  const location = useLocation()
  return isAuth ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}


