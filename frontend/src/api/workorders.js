import api from './axios'

export const getWorkOrders = (params) => api.get('/workorders', { params })
export const createWorkOrder = (data) => api.post('/workorders', data)
export const deleteWorkOrder = (id) => api.delete(`/workorders/${id}`)
export const changeWorkOrderStatus = (id, status) =>
  api.patch(`/workorders/${id}/status`, { status })
