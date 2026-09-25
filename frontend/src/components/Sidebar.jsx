import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  ArrowLeftRight,
  ShoppingCart,
  Box,
  MapPin,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'operations', 'sales'] },
  { to: '/inventory', icon: Package, label: 'Inventory', roles: ['admin', 'operations'] },
  { to: '/work-orders', icon: ClipboardList, label: 'Work Orders', roles: ['admin', 'operations'] },
  { to: '/transfers', icon: ArrowLeftRight, label: 'Internal Transfers', roles: ['admin', 'operations'] },
  { to: '/customer-orders', icon: ShoppingCart, label: 'Customer Orders', roles: ['admin', 'sales'] },
  { to: '/items', icon: Box, label: 'Items', roles: ['admin'] },
  { to: '/locations', icon: MapPin, label: 'Locations', roles: ['admin'] },
]

export default function Sidebar() {
  const { user } = useAuth()

  const visibleItems = navItems.filter(
    (item) => !user?.role || item.roles.includes(user.role)
  )

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">FR</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-tight">FundsRoom</p>
            <p className="text-xs text-slate-400">Operations ERP</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-zinc-100 text-zinc-800 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={isActive ? 'text-zinc-800' : 'text-slate-400'}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">v1.0.0</p>
      </div>
    </aside>
  )
}
