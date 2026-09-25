import api from './axios'

export const getItems = () => api.get('/items')
export const createItem = (data) => api.post('/items', data)
export const updateItem = (id, data) => api.put(`/items/${id}`, data)
export const deleteItem = (id) => api.delete(`/items/${id}`)
