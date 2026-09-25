import api from './axios'

export const getTransfers = (params) => api.get('/transfers', { params })
export const createTransfer = (data) => api.post('/transfers', data)
/** action = 'dispatch' | 'receive' | 'cancel' */
export const updateTransferStatus = (id, action) =>
  api.patch(`/transfers/${id}/${action}`)
