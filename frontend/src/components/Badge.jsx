/**
 * Badge component for status display
 * @param {string} status - the status string
 * @param {object} colorMap - optional custom map of { status: 'tailwind classes' }
 */
export default function Badge({ status, colorMap }) {
  const defaultMap = {
    // Work Order statuses
    assigned: 'bg-zinc-200 text-zinc-800',
    inprogress: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-teal-100 text-teal-700',
    // Transfer statuses
    requested: 'bg-slate-100 text-slate-600',
    dispatched: 'bg-amber-100 text-amber-700',
    received: 'bg-teal-100 text-teal-700',
    // Order statuses
    pending: 'bg-slate-100 text-slate-600',
    reserved: 'bg-zinc-200 text-zinc-800',
    fulfilled: 'bg-teal-100 text-teal-700',
    cancelled: 'bg-rose-100 text-rose-600',
    // Roles
    admin: 'bg-zinc-200 text-zinc-800',
    operations: 'bg-teal-100 text-teal-700',
    sales: 'bg-amber-100 text-amber-700',
  }

  const map = colorMap || defaultMap
  const key = status?.toLowerCase().replace(/\s+/g, '_') || ''
  const classes = map[key] || 'bg-slate-100 text-slate-600'

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}`}
    >
      {status?.replace(/_/g, ' ') || '—'}
    </span>
  )
}
