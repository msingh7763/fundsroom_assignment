import LoadingSpinner from './LoadingSpinner'

/**
 * Reusable table component
 * @param {string[]} columns - header column labels
 * @param {any[]} data - array of row data
 * @param {function} renderRow - function(row, index) => <tr>
 * @param {boolean} loading
 * @param {string} emptyMessage
 */
export default function Table({ columns, data, renderRow, loading, emptyMessage = 'No records found.' }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead>
            <tr className="bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16">
                  <LoadingSpinner className="py-4" />
                </td>
              </tr>
            ) : !data || data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-16 text-center text-slate-400 text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => renderRow(row, index))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
