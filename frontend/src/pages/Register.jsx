import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../services/api'
import { Eye, EyeOff, Zap, Lock, User, Mail, BadgeCheck } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm]     = useState({ email:'', username:'', full_name:'', password:'', confirm:'' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await authApi.register({ email: form.email, username: form.username, full_name: form.full_name, password: form.password })
      await login(form.username, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const f = (field) => ({ value: form[field], onChange: e => setForm({ ...form, [field]: e.target.value }) })

  return (
    <div className="min-h-screen bg-surface grid-bg flex items-center justify-center p-4">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/30 mb-4 glow-teal">
            <Zap size={24} className="text-brand-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wider">TRUMONIX</h1>
          <p className="text-slate-500 text-sm mt-1">Create your secure account</p>
        </div>

        <div className="card glow-teal">
          <h2 className="text-lg font-semibold text-white mb-6">Create Account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">Username*</label>
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" {...f('username')} className="input pl-8 text-sm" placeholder="johndoe" required minLength={3} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <BadgeCheck size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" {...f('full_name')} className="input pl-8 text-sm" placeholder="John Doe" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">Email*</label>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" {...f('email')} className="input pl-8" placeholder="john@example.com" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">Password*</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type={showPw ? 'text' : 'password'} {...f('password')} className="input pl-8 pr-10" placeholder="Min 8 characters" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">Confirm Password*</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type={showPw ? 'text' : 'password'} {...f('confirm')} className="input pl-8" placeholder="Repeat password" required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
