import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { restore } from '../features/auth/authSlice'

export default function RequireAuth() {
  const dispatch = useAppDispatch()
  const isAuth = useAppSelector((s) => s.auth.isAuthenticated)
  const location = useLocation()
  useEffect(() => { if (!isAuth) dispatch(restore()) }, [dispatch, isAuth])
  return isAuth ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}


