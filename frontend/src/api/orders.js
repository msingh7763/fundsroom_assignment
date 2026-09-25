import api from './axios'

export const getOrders = (params) => api.get('/orders', { params })
export const createOrder = (data) => api.post('/orders', data)
/** action = 'reserve' | 'fulfill' | 'cancel' */
export const updateOrderStatus = (id, action) =>
  api.patch(`/orders/${id}/${action}`)
