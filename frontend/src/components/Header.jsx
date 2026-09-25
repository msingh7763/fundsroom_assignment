import { LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import Badge from './Badge'
import toast from 'react-hot-toast'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/inventory': 'Inventory',
  '/work-orders': 'Work Orders',
  '/transfers': 'Internal Transfers',
  '/customer-orders': 'Customer Orders',
  '/items': 'Items',
  '/locations': 'Locations',
}

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const title = pageTitles[location.pathname] || 'ERP'

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10">
      <h1 className="text-base font-semibold text-slate-800">{title}</h1>

      <div className="flex items-center gap-3">
        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center">
            <User size={15} className="text-zinc-700" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700 leading-tight">
              {user?.name || user?.email || 'User'}
            </p>
            <div className="mt-0.5">
              <Badge status={user?.role} />
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
