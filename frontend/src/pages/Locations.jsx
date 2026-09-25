import { useEffect, useState } from 'react'
import { getLocations, createLocation, updateLocation, deleteLocation } from '../api/locations'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { getErrorMessage } from '../utils/helpers'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Locations() {
  const { isAdmin } = useAuth()
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editLoc, setEditLoc] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const [form, setForm] = useState({ name: '', code: '', description: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getLocations()
      setLocations(Array.isArray(res.data) ? res.data : res.data?.data || [])
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => {
    setEditLoc(null)
    setForm({ name: '', code: '', description: '' })
    setShowModal(true)
  }

  const openEdit = (loc) => {
    setEditLoc(loc)
    setForm({ name: loc.name, code: loc.code || '', description: loc.description || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editLoc) {
        await updateLocation(editLoc.id, form)
        toast.success('Location updated')
      } else {
        await createLocation(form)
        toast.success('Location created')
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
    if (!window.confirm('Deactivate this location?')) return
    setDeleting(id)
    try {
      await deleteLocation(id)
      toast.success('Location deactivated')
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(null)
    }
  }

  const columns = ['Name', 'Code', 'Description', ...(isAdmin ? ['Actions'] : [])]

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
            Add Location
          </button>
        )}
      </div>

      <Table
        columns={columns}
        data={locations}
        loading={loading}
        emptyMessage="No locations found."
        renderRow={(row, i) => (
          <tr key={row.id || i} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3 text-sm font-medium text-slate-800">{row.name}</td>
            <td className="px-4 py-3">
              <span className="text-xs px-2.5 py-0.5 bg-zinc-100 text-zinc-900 rounded-full font-mono font-medium">
                {row.code || '—'}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-slate-500">{row.description || '—'}</td>
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

      {/* Create/Edit Location Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editLoc ? 'Edit Location' : 'Add Location'}
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
              placeholder="e.g. Main Warehouse"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
            <input
              type="text"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="e.g. WH-003"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
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
              {submitting ? 'Saving...' : editLoc ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
