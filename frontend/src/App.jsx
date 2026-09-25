import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import WorkOrders from './pages/WorkOrders'
import Transfers from './pages/Transfers'
import CustomerOrders from './pages/CustomerOrders'
import Items from './pages/Items'
import Locations from './pages/Locations'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#334155',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="work-orders" element={<WorkOrders />} />
            <Route path="transfers" element={<Transfers />} />
            <Route path="customer-orders" element={<CustomerOrders />} />
            <Route path="items" element={<Items />} />
            <Route path="locations" element={<Locations />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
