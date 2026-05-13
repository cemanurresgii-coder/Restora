import { Navigate } from 'react-router-dom'
import useAuthStore, { ROLES } from '../../store/useAuthStore'

const HOME = {
  [ROLES.CUSTOMER]: '/app',
  [ROLES.STAFF]:    '/staff',
  [ROLES.MANAGER]:  '/manager',
}

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role } = useAuthStore()

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={HOME[role] ?? '/login'} replace />
  }

  return children
}

export default ProtectedRoute
