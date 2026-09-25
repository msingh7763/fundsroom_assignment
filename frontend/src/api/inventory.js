import api from './axios'

export const getInventory = (params) => api.get('/inventory', { params })
export const addInventory = (data) => api.post('/inventory', data)
export const deleteInventory = (id) => api.delete(`/inventory/${id}`)
