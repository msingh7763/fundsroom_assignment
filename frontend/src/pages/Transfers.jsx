import { useEffect, useState } from 'react'
import { getTransfers, createTransfer, updateTransferStatus } from '../api/transfers'
import { getItems } from '../api/items'
import { getLocations } from '../api/locations'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import { getErrorMessage } from '../utils/helpers'
import toast from 'react-hot-toast'
import { Plus, RefreshCw, Truck, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Transfers() {
  const { isAdmin, isOperations } = useAuth()
  const [transfers, setTransfers] = useState([])
  const [items, setItems] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  const [form, setForm] = useState({
    sourceLocationId: '',
    destLocationId: '',
    itemId: '',
    quantity: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [trRes, itemRes, locRes] = await Promise.all([
        getTransfers(),
        getItems(),
        getLocations(),
      ])
      setTransfers(Array.isArray(trRes.data) ? trRes.data : trRes.data?.data || [])
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
    if (form.sourceLocationId === form.destLocationId) {
      toast.error('From and To locations must be different')
      return
    }
    setSubmitting(true)
    try {
      await createTransfer({
        sourceLocationId: form.sourceLocationId,
        destLocationId: form.destLocationId,
        itemId: form.itemId,
        quantity: Number(form.quantity),
      })
      toast.success('Transfer request created')
      setShowModal(false)
      setForm({ sourceLocationId: '', destLocationId: '', itemId: '', quantity: '' })
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleAction = async (id, status) => {
    setActionLoading(id + status)
    try {
      const endpoint = status === 'Dispatched' ? 'dispatch' : 'receive'
      await updateTransferStatus(id, endpoint)
      toast.success(`Transfer ${status.toLowerCase()}`)
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setActionLoading(null)
    }
  }

  const columns = ['Transfer ID', 'From', 'To', 'Item', 'Qty', 'Status', 'Actions']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={fetchData}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
        >
          <RefreshCw size={15} />
        </button>
        {(isAdmin || isOperations) && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            New Transfer
          </button>
        )}
      </div>

      <Table
        columns={columns}
        data={transfers}
        loading={loading}
        emptyMessage="No transfers found."
        renderRow={(row, i) => (
          <tr key={row.id || i} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3 text-xs font-mono text-slate-500">
              {row.transferId || `TRF-${i + 1}`}
            </td>
            <td className="px-4 py-3 text-sm text-slate-700">
              {row.sourceLocation?.name || row.fromLocationName || '—'}
            </td>
            <td className="px-4 py-3 text-sm text-slate-700">
              {row.destLocation?.name || row.toLocationName || '—'}
            </td>
            <td className="px-4 py-3 text-sm font-medium text-slate-800">
              {row.item?.name || row.itemName || '—'}
            </td>
            <td className="px-4 py-3 text-sm text-slate-700">{row.quantity ?? '—'}</td>
            <td className="px-4 py-3">
              <Badge status={row.status} />
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-1.5">
                {row.status === 'Requested' && (isAdmin || isOperations) && (
                  <button
                    onClick={() => handleAction(row.id, 'Dispatched')}
                    disabled={actionLoading === row.id + 'Dispatched'}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors disabled:opacity-50 border border-amber-200"
                  >
                    <Truck size={12} />
                    Dispatch
                  </button>
                )}
                {row.status === 'Dispatched' && (isAdmin || isOperations) && (
                  <button
                    onClick={() => handleAction(row.id, 'Received')}
                    disabled={actionLoading === row.id + 'Received'}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg transition-colors disabled:opacity-50 border border-teal-200"
                  >
                    <CheckCircle2 size={12} />
                    Receive
                  </button>
                )}
                {row.status === 'Received' && (
                  <span className="text-xs text-slate-400 italic">Completed</span>
                )}
              </div>
            </td>
          </tr>
        )}
      />

      {/* Create Transfer Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Internal Transfer">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">From Location</label>
            <select
              required
              value={form.sourceLocationId}
              onChange={(e) => setForm({ ...form, sourceLocationId: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              <option value="">Select source...</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">To Location</label>
            <select
              required
              value={form.destLocationId}
              onChange={(e) => setForm({ ...form, destLocationId: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              <option value="">Select destination...</option>
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
                <option key={it.id} value={it.id}>{it.name}</option>
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
              {submitting ? 'Creating...' : 'Create Transfer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
