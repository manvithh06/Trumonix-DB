import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { transactionsApi, analyticsApi } from '../services/api'
import { StatusBadge, RiskScore } from '../components/RiskBadge'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts'
import { ArrowUpRight, TrendingUp, ShieldOff, ShieldCheck, Clock, DollarSign, PlusCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

const StatCard = ({ label, value, sub, icon: Icon, color = 'text-brand-400', bg = 'bg-brand-500/10' }) => (
  <div className="stat-card">
    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
      <Icon size={18} className={color} />
    </div>
    <p className="text-2xl font-display font-bold text-white">{value}</p>
    <p className="text-xs text-slate-500 mt-1">{label}</p>
    {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
  </div>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.dataKey}: {p.value}</p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const [summary, setSummary]   = useState(null)
  const [trend, setTrend]       = useState([])
  const [recentTxns, setRecentTxns] = useState([])
  const [alerts, setAlerts]     = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, trendRes, txnRes] = await Promise.all([
          isAdmin ? transactionsApi.getAdminSummary() : transactionsApi.getMySummary(),
          analyticsApi.overview(),
          isAdmin ? transactionsApi.getAllTxns(1) : transactionsApi.getMyTxns(1),
        ])
        setSummary(sumRes.data)
        setTrend(trendRes.data)
        setRecentTxns(txnRes.data.items?.slice(0, 5) || [])

        if (isAdmin) {
          const alertRes = await analyticsApi.recentAlerts()
          setAlerts(alertRes.data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAdmin])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">
            Welcome back, <span className="text-brand-400">{user?.username}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isAdmin ? 'System overview across all users' : 'Your transaction activity'}
          </p>
        </div>
        <Link to="/transactions/new" className="btn-primary flex items-center gap-2 text-sm hidden sm:flex">
          <PlusCircle size={15} />
          New Transaction
        </Link>
      </div>

      {/* Stats */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Transactions" value={summary.total} icon={TrendingUp} />
          <StatCard label="Approved" value={summary.approved}
            icon={ShieldCheck} color="text-green-400" bg="bg-green-500/10" />
          <StatCard label="Flagged" value={summary.flagged}
            icon={Clock} color="text-amber-400" bg="bg-amber-500/10" />
          <StatCard label="Blocked" value={summary.blocked}
            icon={ShieldOff} color="text-red-400" bg="bg-red-500/10" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Total Volume */}
        {summary && (
          <div className="stat-card">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
              <DollarSign size={18} className="text-purple-400" />
            </div>
            <p className="text-2xl font-display font-bold text-white">
              ${summary.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total Volume</p>
            <p className="text-xs text-slate-600 mt-0.5">Avg risk: {summary.avg_risk_score.toFixed(1)}</p>
          </div>
        )}

        {/* 7-day trend chart */}
        <div className="card lg:col-span-2">
          <p className="text-sm font-medium text-slate-300 mb-4">7-Day Transaction Trend</p>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#14b8a6" fill="url(#grad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-slate-300">Recent Transactions</p>
          <Link to="/transactions" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
            View all <ArrowUpRight size={12} />
          </Link>
        </div>
        {recentTxns.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-500 text-sm">No transactions yet.</p>
            <Link to="/transactions/new" className="text-brand-400 text-sm mt-2 inline-block hover:text-brand-300">
              Submit your first transaction →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  {['Ref','Merchant','Amount','Risk','Status','Date'].map(h => (
                    <th key={h} className="text-left text-xs font-mono text-slate-600 uppercase tracking-wider pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTxns.map(txn => (
                  <tr key={txn.id} className="table-row">
                    <td className="py-3 pr-4 font-mono text-xs text-brand-400">{txn.transaction_ref}</td>
                    <td className="py-3 pr-4 text-slate-300 max-w-[120px] truncate">{txn.merchant}</td>
                    <td className="py-3 pr-4 font-mono text-white">${txn.amount.toLocaleString()}</td>
                    <td className="py-3 pr-4"><RiskScore score={txn.risk_score} /></td>
                    <td className="py-3 pr-4"><StatusBadge status={txn.status} /></td>
                    <td className="py-3 text-xs text-slate-600">
                      {format(new Date(txn.created_at), 'MMM dd, HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin: recent alerts */}
      {isAdmin && alerts.length > 0 && (
        <div className="card border-red-500/20">
          <p className="text-sm font-medium text-red-400 mb-4 flex items-center gap-2">
            <ShieldOff size={14} /> Recent Alerts (Flagged / Blocked)
          </p>
          <div className="space-y-2">
            {alerts.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-surface-border">
                <div className="flex items-center gap-3">
                  <StatusBadge status={a.status} />
                  <span className="font-mono text-xs text-slate-400">{a.ref}</span>
                  <span className="text-sm text-slate-300 hidden sm:block truncate max-w-[150px]">{a.merchant}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-white">${a.amount.toLocaleString()}</span>
                  <RiskScore score={a.risk_score} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
