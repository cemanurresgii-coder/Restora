import { Link, useNavigate } from 'react-router-dom'
import { UtensilsCrossed, LogOut } from 'lucide-react'
import useAuthStore, { ROLES } from '../../store/useAuthStore'
import NotificationBell from './NotificationBell'

const ROLE_BADGE = {
  [ROLES.CUSTOMER]: 'bg-blue-100 text-blue-700',
  [ROLES.STAFF]:    'bg-emerald-100 text-emerald-700',
  [ROLES.MANAGER]:  'bg-orange-100 text-orange-700',
}

export default function Navbar() {
  const { user, role, logout } = useAuthStore()
  const navigate = useNavigate()

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-base text-brand-600">
          <UtensilsCrossed size={20} />
          Restora
        </Link>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${ROLE_BADGE[role]}`}>
            {role}
          </span>
          <span className="text-sm text-neutral-500 truncate max-w-[160px] hidden sm:block">{user.email}</span>
          <NotificationBell />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
