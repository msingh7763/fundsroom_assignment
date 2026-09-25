import { useEffect, useState } from 'react'
import { getOrders, createOrder, updateOrderStatus } from '../api/orders'
import { getItems } from '../api/items'
import { getLocations } from '../api/locations'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import { getErrorMessage } from '../utils/helpers'
import toast from 'react-hot-toast'
import { Plus, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function CustomerOrders() {
  const { isAdmin, isSales } = useAuth()
  const [orders, setOrders] = useState([])
  const [items, setItems] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    itemId: '',
    locationId: '',
    quantity: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ordRes, itemRes, locRes] = await Promise.all([
        getOrders(),
        getItems(),
        getLocations(),
      ])
      setOrders(Array.isArray(ordRes.data) ? ordRes.data : ordRes.data?.data || [])
      setItems(Array.isArray(itemRes.data) ? itemRes.data : itemRes.data?.data || [])
      setLocations(Array.isArray(locRes.data) ? locRes.data : locRes.data?.data || [])
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createOrder({
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        itemId: form.itemId,
        locationId: form.locationId,
        quantity: Number(form.quantity),
      })
      toast.success('Order created')
      setShowModal(false)
      setForm({ customerName: '', customerEmail: '', customerPhone: '', itemId: '', locationId: '', quantity: '' })
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleAction = async (id, action) => {
    setActionLoading(id + action)
    try {
      await updateOrderStatus(id, action)
      toast.success(`Order ${action.toLowerCase()}`)
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setActionLoading(null)
    }
  }

  const columns = ['Order ID', 'Customer', 'Item', 'Location', 'Qty', 'Status', 'Actions']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={fetchData}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
        >
          <RefreshCw size={15} />
        </button>
        {(isAdmin || isSales) && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            New Order
          </button>
        )}
      </div>

      <Table
        columns={columns}
        data={orders}
        loading={loading}
        emptyMessage="No customer orders found."
        renderRow={(row, i) => (
          <tr key={row.id || i} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3 text-xs font-mono text-slate-500">
              {row.orderId || `ORD-${i + 1}`}
            </td>
            <td className="px-4 py-3 text-sm font-medium text-slate-800">
              {row.customerName || '—'}
            </td>
            <td className="px-4 py-3 text-sm text-slate-700">
              {row.item?.name || row.itemName || '—'}
            </td>
            <td className="px-4 py-3 text-sm text-slate-700">
              {row.location?.name || row.locationName || '—'}
            </td>
            <td className="px-4 py-3 text-sm text-slate-700">{row.quantity ?? '—'}</td>
            <td className="px-4 py-3">
              <Badge status={row.status} />
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-1.5 flex-wrap">
                {row.status === 'Pending' && (isAdmin || isSales) && (
                  <>
                    <button
                      onClick={() => handleAction(row.id, 'reserve')}
                      disabled={actionLoading === row.id + 'reserve'}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-lg transition-colors disabled:opacity-50 border border-zinc-300"
                    >
                      <CheckCircle2 size={12} />
                      Reserve
                    </button>
                    <button
                      onClick={() => handleAction(row.id, 'cancel')}
                      disabled={actionLoading === row.id + 'cancel'}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors disabled:opacity-50 border border-rose-200"
                    >
                      <XCircle size={12} />
                      Cancel
                    </button>
                  </>
                )}
                {row.status === 'Reserved' && (isAdmin || isSales) && (
                  <>
                    <button
                      onClick={() => handleAction(row.id, 'fulfill')}
                      disabled={actionLoading === row.id + 'fulfill'}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg transition-colors disabled:opacity-50 border border-teal-200"
                    >
                      <CheckCircle2 size={12} />
                      Fulfill
                    </button>
                    <button
                      onClick={() => handleAction(row.id, 'cancel')}
                      disabled={actionLoading === row.id + 'cancel'}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors disabled:opacity-50 border border-rose-200"
                    >
                      <XCircle size={12} />
                      Cancel
                    </button>
                  </>
                )}
                {(row.status === 'Fulfilled' || row.status === 'Cancelled') && (
                  <span className="text-xs text-slate-400 italic">No actions</span>
                )}
              </div>
            </td>
          </tr>
        )}
      />

      {/* Create Order Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Customer Order">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
            <input
              type="text"
              required
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              placeholder="e.g. Acme Corp"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={form.customerEmail}
              onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              placeholder="customer@example.com"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input
              type="tel"
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              placeholder="123-456-7890"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Item</label>
            <select
              required
              value={form.itemId}
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              <option value="">Select item...</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>{it.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <select
              required
              value={form.locationId}
              onChange={(e) => setForm({ ...form, locationId: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              <option value="">Select location...</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
            <input
              type="number"
              required
              min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-900 text-white rounded-lg transition-colors disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
