import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usersApi } from '../services/api'
import { User, Mail, ShieldCheck, BarChart2, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function Profile() {
  const { user, loadUser } = useAuth()
  const [form, setForm]     = useState({ full_name: user?.full_name || '', email: user?.email || '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]   = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess(false)
    try {
      await usersApi.updateMe(form)
      await loadUser()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Update failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto animate-slide-up space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Profile</h1>
        <p className="text-slate-500 text-sm">Manage your account details</p>
      </div>

      {/* Avatar card */}
      <div className="card flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border-2 border-brand-500/30 flex items-center justify-center text-3xl font-bold text-brand-400 font-display">
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-bold text-white">{user?.full_name || user?.username}</p>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${
              user?.role === 'admin' ? 'bg-red-500/10 text-red-400' : 'bg-brand-500/10 text-brand-400'
            }`}>{user?.role?.toUpperCase()}</span>
            <span className="text-xs text-slate-600">
              Joined {user?.created_at ? format(new Date(user.created_at), 'MMM yyyy') : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: BarChart2, label: 'Transactions', value: user?.total_transactions || 0, color: 'text-brand-400' },
          { icon: CheckCircle, label: 'Avg Amount', value: `$${(user?.average_transaction_amount || 0).toFixed(2)}`, color: 'text-green-400' },
          { icon: ShieldCheck, label: 'Account', value: user?.is_active ? 'Active' : 'Inactive', color: user?.is_active ? 'text-green-400' : 'text-red-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card text-center py-4">
            <Icon size={18} className={`${color} mx-auto mb-2`} />
            <p className={`text-xl font-bold font-display ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Edit form */}
      <div className="card">
        <h2 className="text-sm font-medium text-slate-300 mb-4">Edit Profile</h2>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
            <CheckCircle size={14} /> Profile updated successfully
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">Username</label>
            <div className="input bg-surface/50 text-slate-500 cursor-not-allowed flex items-center gap-2">
              <User size={13} />
              {user?.username}
              <span className="ml-auto text-xs text-slate-600">read-only</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
            <input type="text" value={form.full_name}
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              className="input" placeholder="Your full name" />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">Email</label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="input pl-8" placeholder="your@email.com" required />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Device/location info */}
      {(user?.last_device_id || user?.last_location) && (
        <div className="card">
          <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <ShieldCheck size={14} className="text-brand-400" /> Last Seen Context
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {user.last_device_id && (
              <div className="bg-surface rounded-lg p-3 border border-surface-border">
                <p className="text-xs text-slate-500 font-mono">LAST DEVICE</p>
                <p className="text-sm text-slate-300 font-mono break-all mt-1">{user.last_device_id}</p>
              </div>
            )}
            {user.last_location && (
              <div className="bg-surface rounded-lg p-3 border border-surface-border">
                <p className="text-xs text-slate-500 font-mono">LAST LOCATION</p>
                <p className="text-sm text-slate-300 mt-1">{user.last_location}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
