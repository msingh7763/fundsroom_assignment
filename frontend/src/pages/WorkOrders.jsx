import { useEffect, useState } from 'react'
import { getWorkOrders, createWorkOrder, changeWorkOrderStatus } from '../api/workorders'
import { getItems } from '../api/items'
import { getLocations } from '../api/locations'
import api from '../api/axios'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import { getErrorMessage } from '../utils/helpers'
import toast from 'react-hot-toast'
import { Plus, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const STATUS_OPTIONS = ['Assigned', 'InProgress', 'Completed']

export default function WorkOrders() {
  const { isAdmin, isOperations } = useAuth()
  const [orders, setOrders] = useState([])
  const [items, setItems] = useState([])
  const [locations, setLocations] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(null)

  const [form, setForm] = useState({
    locationId: '',
    itemId: '',
    requiredQty: '',
    assignedUserId: '',
    notes: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [woRes, itemRes, locRes] = await Promise.all([
        getWorkOrders(),
        getItems(),
        getLocations(),
      ])
      setOrders(Array.isArray(woRes.data) ? woRes.data : woRes.data?.data || [])
      setItems(Array.isArray(itemRes.data) ? itemRes.data : itemRes.data?.data || [])
      setLocations(Array.isArray(locRes.data) ? locRes.data : locRes.data?.data || [])
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users')
      setUsers(Array.isArray(res.data) ? res.data : res.data?.data || [])
    } catch {
      // non-critical – admin check on backend will guard
    }
  }

  useEffect(() => {
    fetchData()
    if (isAdmin) fetchUsers()
  }, [isAdmin])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createWorkOrder({
        locationId: form.locationId,
        itemId: form.itemId,
        requiredQty: Number(form.requiredQty),
        assignedUserId: form.assignedUserId,
        notes: form.notes,
      })
      toast.success('Work order created')
      setShowModal(false)
      setForm({ locationId: '', itemId: '', requiredQty: '', assignedUserId: '', notes: '' })
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (id, status) => {
    setStatusUpdating(id)
    try {
      await changeWorkOrderStatus(id, status)
      toast.success(`Status updated to ${status}`)
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setStatusUpdating(null)
    }
  }

  const columns = ['Work Order', 'Location', 'Item', 'Required Qty', 'Available', 'Shortage', 'Assigned To', 'Status', 'Actions']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div />
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
          >
            <RefreshCw size={15} />
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={15} />
              Create Work Order
            </button>
          )}
        </div>
      </div>

      <Table
        columns={columns}
        data={orders}
        loading={loading}
        emptyMessage="No work orders found."
        renderRow={(row, i) => (
          <tr key={row.id || i} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3 text-xs font-mono text-zinc-800 font-semibold">
              {row.workOrderId || `WO-${i + 1}`}
            </td>
            <td className="px-4 py-3 text-sm text-slate-700">
              {row.location?.name || '—'}
            </td>
            <td className="px-4 py-3 text-sm font-medium text-slate-800">
              {row.item?.name || '—'}
            </td>
            <td className="px-4 py-3 text-sm text-slate-700">{row.requiredQty ?? '—'}</td>
            <td className="px-4 py-3 text-sm text-slate-700">{row.availableQtyAtCreation ?? 0}</td>
            <td className="px-4 py-3 text-sm">
              {(row.shortageQty ?? 0) > 0 ? (
                <span className="text-rose-600 font-semibold">{row.shortageQty}</span>
              ) : (
                <span className="text-teal-600 font-medium">None</span>
              )}
            </td>
            <td className="px-4 py-3 text-sm text-slate-700">
              {row.assignedUser?.name || '—'}
            </td>
            <td className="px-4 py-3">
              <Badge status={row.status} />
            </td>
            <td className="px-4 py-3">
              {row.status !== 'Completed' && (isAdmin || isOperations) && (
                <select
                  value={row.status || ''}
                  disabled={statusUpdating === row.id}
                  onChange={(e) => handleStatusChange(row.id, e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-zinc-600 cursor-pointer disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
              {row.status === 'Completed' && (
                <span className="text-xs text-slate-400 italic">Done</span>
              )}
            </td>
          </tr>
        )}
      />

      {/* Create Work Order Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Work Order">
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Item</label>
            <select
              required
              value={form.itemId}
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              <option value="">Select item...</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>{it.name} ({it.sku})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Required Quantity</label>
            <input
              type="number"
              required
              min="1"
              value={form.requiredQty}
              onChange={(e) => setForm({ ...form, requiredQty: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
            {users.length > 0 ? (
              <select
                required
                value={form.assignedUserId}
                onChange={(e) => setForm({ ...form, assignedUserId: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
              >
                <option value="">Select user...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={form.assignedUserId}
                onChange={(e) => setForm({ ...form, assignedUserId: e.target.value })}
                placeholder="Paste user ID"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes..."
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
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
