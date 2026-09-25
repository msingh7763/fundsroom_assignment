import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/helpers'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import Badge from '../components/Badge'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState(null)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const user = await login(email, password)
      setLoggedInUser(user)
      toast.success(`Welcome back, ${user.name || user.email}!`)
      setTimeout(() => navigate('/dashboard'), 800)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-zinc-800 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-zinc-200">
            <span className="text-white text-xl font-bold">FR</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">FundsRoom ERP</h1>
          <p className="text-slate-500 mt-1 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-8">
          {loggedInUser && (
            <div className="mb-5 flex items-center gap-3 p-3 bg-teal-50 border border-teal-100 rounded-xl">
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
              <span className="text-sm text-teal-700 font-medium">
                Logged in as {loggedInUser.name}
              </span>
              <Badge status={loggedInUser.role} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition"
                required
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-900 disabled:bg-zinc-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo hint */}
          <p className="mt-5 text-center text-xs text-slate-400">
            Demo: admin@example.com / password
          </p>
        </div>
      </div>
    </div>
  )
}
