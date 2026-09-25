import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getInventory } from '../api/inventory'
import { getWorkOrders } from '../api/workorders'
import { getTransfers } from '../api/transfers'
import { getOrders } from '../api/orders'
import LoadingSpinner from '../components/LoadingSpinner'
import { Package, ClipboardList, ArrowLeftRight, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function StatCard({ icon: Icon, label, value, color, bg, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow text-left w-full"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon size={22} className={color} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>
    </button>
  )
}

/** Safely extract an array from any API response shape */
function toArray(res) {
  if (!res) return []
  const d = res.data
  if (Array.isArray(d)) return d
  if (Array.isArray(d?.data)) return d.data
  return []
}

export default function Dashboard() {
  const { user, isAdmin, isOperations, isSales } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ inventory: 0, workOrders: 0, transfers: 0, orders: 0 })
  const [loading, setLoading] = useState(true)
  const [lowStock, setLowStock] = useState([])

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        // Always fetch all modules for admin; others get what their role allows
        const [invRes, woRes, trRes, ordRes] = await Promise.allSettled([
          getInventory(),
          getWorkOrders(),
          getTransfers(),
          getOrders(),
        ])

        const inv  = toArray(invRes.status  === 'fulfilled' ? invRes.value  : null)
        const wo   = toArray(woRes.status   === 'fulfilled' ? woRes.value   : null)
        const tr   = toArray(trRes.status   === 'fulfilled' ? trRes.value   : null)
        const ord  = toArray(ordRes.status  === 'fulfilled' ? ordRes.value  : null)

        setStats({
          inventory: inv.length,
          workOrders: wo.length,
          transfers: tr.length,
          orders: ord.length,
        })

        // Low stock: availableQty <= 10
        setLowStock(
          inv.filter((i) => (i.availableQty ?? 0) <= 10)
        )
      } catch {
        // silent — individual card shows 0
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])           // run once on mount; role gates are handled by backend

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-2xl p-6 text-white shadow-lg shadow-zinc-200">
        <p className="text-zinc-300 text-sm font-medium">Good day,</p>
        <h2 className="text-2xl font-bold mt-1">{user?.name || user?.email} 👋</h2>
        <p className="text-zinc-300 text-sm mt-1 capitalize">
          Role: <span className="font-semibold text-white">{user?.role}</span>
        </p>
      </div>

      {/* Stat cards — show all that returned data > 0, or always show for admin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(isAdmin || isOperations) && (
          <StatCard
            icon={Package}
            label="Inventory Records"
            value={stats.inventory}
            color="text-zinc-700"
            bg="bg-zinc-100"
            onClick={() => navigate('/inventory')}
          />
        )}
        {(isAdmin || isOperations) && (
          <StatCard
            icon={ClipboardList}
            label="Work Orders"
            value={stats.workOrders}
            color="text-amber-600"
            bg="bg-amber-50"
            onClick={() => navigate('/work-orders')}
          />
        )}
        {(isAdmin || isOperations) && (
          <StatCard
            icon={ArrowLeftRight}
            label="Transfers"
            value={stats.transfers}
            color="text-teal-600"
            bg="bg-teal-50"
            onClick={() => navigate('/transfers')}
          />
        )}
        {(isAdmin || isSales) && (
          <StatCard
            icon={ShoppingCart}
            label="Customer Orders"
            value={stats.orders}
            color="text-rose-600"
            bg="bg-rose-50"
            onClick={() => navigate('/customer-orders')}
          />
        )}
      </div>

      {/* Low stock alerts */}
      {(isAdmin || isOperations) && lowStock.length > 0 && (
        <div className="bg-white border border-amber-100 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-500" />
            <h3 className="font-semibold text-slate-800 text-sm">
              Low Stock Alerts ({lowStock.length} item{lowStock.length !== 1 ? 's' : ''})
            </h3>
          </div>
          <div className="space-y-2">
            {lowStock.slice(0, 5).map((item, i) => {
              const qty = item.availableQty ?? 0
              return (
                <div
                  key={item.id || i}
                  className="flex items-center justify-between py-2 px-3 bg-amber-50 rounded-lg"
                >
                  <div>
                    <span className="text-sm text-slate-700 font-medium">
                      {item.item?.name || 'Unknown Item'}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">
                      {item.location?.name || ''}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      qty === 0
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {qty} available
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-zinc-600" />
          <h3 className="font-semibold text-slate-800 text-sm">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(isAdmin || isOperations) && (
            <>
              <button
                onClick={() => navigate('/inventory')}
                className="p-3 text-center bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
              >
                <Package size={20} className="text-zinc-700 mx-auto mb-1.5" />
                <span className="text-xs font-medium text-zinc-800">Inventory</span>
              </button>
              <button
                onClick={() => navigate('/work-orders')}
                className="p-3 text-center bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
              >
                <ClipboardList size={20} className="text-amber-600 mx-auto mb-1.5" />
                <span className="text-xs font-medium text-amber-700">Work Orders</span>
              </button>
              <button
                onClick={() => navigate('/transfers')}
                className="p-3 text-center bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors"
              >
                <ArrowLeftRight size={20} className="text-teal-600 mx-auto mb-1.5" />
                <span className="text-xs font-medium text-teal-700">Transfers</span>
              </button>
            </>
          )}
          {(isAdmin || isSales) && (
            <button
              onClick={() => navigate('/customer-orders')}
              className="p-3 text-center bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
            >
              <ShoppingCart size={20} className="text-rose-500 mx-auto mb-1.5" />
              <span className="text-xs font-medium text-rose-600">Orders</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
