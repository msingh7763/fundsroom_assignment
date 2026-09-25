import { useEffect, useState } from 'react'
import { getItems, createItem, updateItem, deleteItem } from '../api/items'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { getErrorMessage } from '../utils/helpers'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const UNIT_OPTIONS = ['pcs', 'kg', 'g', 'litre', 'ml', 'box', 'carton', 'set', 'pair', 'unit']

export default function Items() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const [form, setForm] = useState({ name: '', sku: '', category: '', unit: 'pcs', description: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getItems()
      setItems(Array.isArray(res.data) ? res.data : res.data?.data || [])
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => {
    setEditItem(null)
    setForm({ name: '', sku: '', category: '', unit: 'pcs', description: '' })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({ name: item.name, sku: item.sku || '', category: item.category || '', unit: item.unit || 'pcs', description: item.description || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editItem) {
        await updateItem(editItem.id, form)
        toast.success('Item updated')
      } else {
        await createItem(form)
        toast.success('Item created')
      }
      setShowModal(false)
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return
    setDeleting(id)
    try {
      await deleteItem(id)
      toast.success('Item deleted')
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(null)
    }
  }

  const columns = ['Name', 'Category', 'Unit', ...(isAdmin ? ['Actions'] : [])]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={fetchData}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
        >
          <RefreshCw size={15} />
        </button>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            Add Item
          </button>
        )}
      </div>

      <Table
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No items found."
        renderRow={(row, i) => (
          <tr key={row.id || i} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3 text-sm font-medium text-slate-800">{row.name}</td>
            <td className="px-4 py-3 text-sm text-slate-500">{row.category || '—'}</td>
            <td className="px-4 py-3">
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                {row.unit || 'pcs'}
              </span>
            </td>
            {isAdmin && (
              <td className="px-4 py-3">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEdit(row)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(row.id)}
                    disabled={deleting === row.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            )}
          </tr>
        )}
      />

      {/* Create/Edit Item Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Edit Item' : 'Add Item'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Steel Rod"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
            <input
              type="text"
              required
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
              placeholder="e.g. STL-ROD-001"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <input
              type="text"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Raw Material"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600 resize-none"
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
              {submitting ? 'Saving...' : editItem ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
