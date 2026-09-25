import { useEffect, useState } from 'react'
import { getInventory, addInventory } from '../api/inventory'
import { getItems } from '../api/items'
import { getLocations } from '../api/locations'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { getErrorMessage, getQtyColorClass } from '../utils/helpers'
import toast from 'react-hot-toast'
import { Plus, Search, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Inventory() {
  const { isAdmin, isOperations } = useAuth()
  const [inventory, setInventory] = useState([])
  const [items, setItems] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [filterLocation, setFilterLocation] = useState('')

  const [form, setForm] = useState({
    itemId: '',
    locationId: '',
    batch: 'DEFAULT',
    physicalQty: '',
    reservedQty: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [invRes, itemRes, locRes] = await Promise.all([
        getInventory(),
        getItems(),
        getLocations(),
      ])
      setInventory(Array.isArray(invRes.data) ? invRes.data : invRes.data?.data || [])
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
      await addInventory({
        itemId: form.itemId,
        locationId: form.locationId,
        batch: form.batch || 'DEFAULT',
        physicalQty: Number(form.physicalQty),
        reservedQty: Number(form.reservedQty) || 0,
      })
      toast.success('Inventory record added')
      setShowModal(false)
      setForm({ itemId: '', locationId: '', batch: 'DEFAULT', physicalQty: '', reservedQty: '' })
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = inventory.filter((row) => {
    const itemName = row.item?.name || row.itemName || ''
    const locName = row.location?.name || row.locationName || ''
    const matchSearch = itemName.toLowerCase().includes(search.toLowerCase())
    const matchLoc = filterLocation ? locName === filterLocation : true
    return matchSearch && matchLoc
  })

  const columns = ['Item', 'Category', 'Location', 'Batch', 'Physical Qty', 'Reserved Qty', 'Available Qty']

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600 bg-white"
            />
          </div>
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-600 text-slate-600"
          >
            <option value="">All Locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.name}>{l.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
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
              Add Inventory
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage="No inventory records found."
        renderRow={(row, i) => {
          const available = row.availableQty ?? row.available_qty ?? 0
          return (
            <tr key={row.id || i} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-slate-800">
                {row.item?.name || row.itemName || '—'}
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">
                {row.item?.category || row.category || '—'}
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">
                {row.location?.name || row.locationName || '—'}
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{row.batch || '—'}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{row.physicalQty ?? row.physical_qty ?? '—'}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{row.reservedQty ?? row.reserved_qty ?? 0}</td>
              <td className={`px-4 py-3 text-sm ${getQtyColorClass(available)}`}>
                {available}
              </td>
            </tr>
          )
        }}
      />

      {/* Add Inventory Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Inventory Record">
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Batch</label>
            <input
              type="text"
              value={form.batch}
              onChange={(e) => setForm({ ...form, batch: e.target.value })}
              placeholder="e.g. BATCH-001"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Physical Qty</label>
              <input
                type="number"
                required
                min="0"
                value={form.physicalQty}
                onChange={(e) => setForm({ ...form, physicalQty: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reserved Qty</label>
              <input
                type="number"
                min="0"
                value={form.reservedQty}
                onChange={(e) => setForm({ ...form, reservedQty: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
              />
            </div>
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
              {submitting ? 'Adding...' : 'Add Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
