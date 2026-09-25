/**
 * Format a date string to a readable format
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Get role badge classes based on role string
 */
export function getRoleBadgeClass(role) {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'bg-zinc-200 text-zinc-800'
    case 'operations':
      return 'bg-teal-100 text-teal-700'
    case 'sales':
      return 'bg-amber-100 text-amber-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

/**
 * Extract error message from axios error
 */
export function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'An unexpected error occurred'
  )
}

/**
 * Return color class for inventory available quantity
 */
export function getQtyColorClass(qty) {
  if (qty === 0) return 'text-rose-600 font-semibold'
  if (qty <= 10) return 'text-amber-600 font-semibold'
  return 'text-teal-600 font-semibold'
}
