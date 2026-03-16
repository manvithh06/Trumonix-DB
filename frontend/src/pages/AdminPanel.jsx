import { useEffect, useState } from 'react'
import { transactionsApi, usersApi, analyticsApi } from '../services/api'
import { StatusBadge, RiskScore, RiskFactorList } from '../components/RiskBadge'
import { format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { Users, ShieldOff, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, X, Check } from 'lucide-react'
import clsx from 'clsx'

const STATUS_FILTERS = ['', 'FLAGGED', 'BLOCKED', 'APPROVED']

function ReviewModal({ txn, onClose, onReviewed }) {
  const [loading, setLoading] = useState(false)
  const [note, setNote]       = useState('')

  const review = async (status) => {
    setLoading(true)
    try {
      await transactionsApi.review(txn.id, { status, note })
      onReviewed()
      onClose()
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md animate-slide-up"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <p className="font-mono text-brand-400 font-bold">{txn.transaction_ref}</p>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex justify-center"><RiskScore score={txn.risk_score} size="lg" /></div>
          <div className="grid grid-cols-2 gap-2">
            {[['Amount', `$${txn.amount?.toLocaleString()}`], ['Merchant', txn.merchant],
              ['User ID', txn.user_id], ['Category', txn.merchant_category]].map(([l, v]) => (
              <div key={l} className="bg-surface rounded-lg p-2.5 border border-surface-border">
                <p className="text-xs text-slate-500 font-mono">{l.toUpperCase()}</p>
                <p className="text-sm text-slate-200">{v}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-mono text-slate-500 mb-2">RISK FACTORS</p>
            <RiskFactorList factors={txn.risk_factors} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Review Note (optional)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              className="input resize-none" rows={2} placeholder="Add a note..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => review('APPROVED')} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg py-2.5 text-sm font-medium transition-all">
              <Check size={14} /> Approve
            </button>
            <button onClick={() => review('BLOCKED')} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg py-2.5 text-sm font-medium transition-all">
              <X size={14} /> Block
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const [data, setData]         = useState({ items: [], total: 0, pages: 1 })
  const [users, setUsers]       = useState([])
  const [riskDist, setRiskDist] = useState([])
  const [topFactors, setTopFactors] = useState([])
  const [summary, setSummary]   = useState(null)
  const [page, setPage]         = useState(1)
  const [filter, setFilter]     = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('transactions')

  const loadTxns = async (p = 1, f = '') => {
    try {
      const res = await transactionsApi.getAllTxns(p, f)
      setData(res.data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    const init = async () => {
      try {
        const [uRes, rRes, fRes, sRes] = await Promise.all([
          usersApi.listAll(),
          analyticsApi.riskDistribution(),
          analyticsApi.topRiskFactors(),
          transactionsApi.getAdminSummary(),
        ])
        setUsers(uRes.data)
        setRiskDist(rRes.data)
        setTopFactors(fRes.data)
        setSummary(sRes.data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    init()
    loadTxns()
  }, [])

  useEffect(() => { loadTxns(page, filter) }, [page, filter])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className="text-brand-400">{payload[0].value} txns</p>
      </div>
    )
  }

  return (
    <div className="animate-slide-up space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-red-500/20 flex items-center justify-center">
            <ShieldOff size={13} className="text-red-400" />
          </span>
          Admin Panel
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">System-wide surveillance dashboard</p>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: summary.total, color: 'text-white' },
            { label: 'Approved', value: summary.approved, color: 'text-green-400' },
            { label: 'Flagged', value: summary.flagged, color: 'text-amber-400' },
            { label: 'Blocked', value: summary.blocked, color: 'text-red-400' },
            { label: 'Avg Risk', value: summary.avg_risk_score.toFixed(1), color: 'text-brand-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card py-4 text-center">
              <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm font-medium text-slate-300 mb-4">Risk Score Distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={riskDist} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
              <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {riskDist.map((entry, i) => {
                  const midpoint = parseInt(entry.range) + 5
                  return <Cell key={i} fill={midpoint >= 70 ? '#ef4444' : midpoint >= 30 ? '#f59e0b' : '#22c55e'} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p className="text-sm font-medium text-slate-300 mb-4">Top Risk Factors</p>
          {topFactors.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No risk events yet</p>
          ) : (
            <div className="space-y-2.5">
              {topFactors.slice(0, 6).map(({ factor, count }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-500 w-4">{i+1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-mono text-slate-400 truncate">{factor}</span>
                      <span className="text-xs text-slate-600 ml-2">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                      <div className="h-full rounded-full bg-brand-500"
                        style={{ width: `${(count / (topFactors[0]?.count || 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-border">
        {[['transactions', 'Transactions'], ['users', `Users (${users.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={clsx('px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px',
              tab === key ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-500 hover:text-white')}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'transactions' && (
        <div className="card overflow-hidden p-0">
          {/* Filter */}
          <div className="flex items-center gap-2 p-4 border-b border-surface-border flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button key={f || 'all'} onClick={() => { setFilter(f); setPage(1) }}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-mono transition-all',
                  filter === f
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                    : 'bg-surface border border-surface-border text-slate-500 hover:text-white')}>
                {f || 'ALL'} {f === 'FLAGGED' && summary?.flagged > 0 &&
                  <span className="ml-1 bg-amber-500/20 text-amber-400 px-1 rounded">{summary.flagged}</span>}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  {['Ref','User','Merchant','Amount','Risk','Status','Date','Action'].map(h => (
                    <th key={h} className="text-left text-xs font-mono text-slate-600 uppercase px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map(txn => (
                  <tr key={txn.id} className="table-row">
                    <td className="px-4 py-3 font-mono text-xs text-brand-400">{txn.transaction_ref}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">#{txn.user_id}</td>
                    <td className="px-4 py-3 text-slate-300 max-w-[120px] truncate">{txn.merchant}</td>
                    <td className="px-4 py-3 font-mono text-white">${txn.amount.toLocaleString()}</td>
                    <td className="px-4 py-3"><RiskScore score={txn.risk_score} /></td>
                    <td className="px-4 py-3"><StatusBadge status={txn.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {format(new Date(txn.created_at), 'MMM dd, HH:mm')}
                    </td>
                   <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {txn.status === 'FLAGGED' && (
                          <button onClick={() => setSelected(txn)}
                            className="text-xs text-amber-400 hover:text-amber-300 font-mono underline">
                            Review
                          </button>
                        )}
                        <button onClick={async () => {
                          if (window.confirm(`Delete ${txn.transaction_ref}?`)) {
                            await transactionsApi.delete(txn.id)
                            loadTxns(page, filter)
                          }
                        }}
                          className="text-xs text-red-400 hover:text-red-300 font-mono underline">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border">
            <p className="text-xs text-slate-500">Page {page} of {data.pages} · {data.total} total</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-surface-border text-slate-400 hover:text-white disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-surface-border text-slate-400 hover:text-white disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  {['ID','Username','Email','Role','Transactions','Avg Amount','Status'].map(h => (
                    <th key={h} className="text-left text-xs font-mono text-slate-600 uppercase px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="table-row">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">#{u.id}</td>
                    <td className="px-4 py-3 text-white font-medium">{u.username}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-xs font-mono px-2 py-0.5 rounded',
                        u.role === 'admin' ? 'bg-red-500/10 text-red-400' : 'bg-brand-500/10 text-brand-400')}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">{u.total_transactions}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">${u.average_transaction_amount?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-xs font-mono',
                        u.is_active ? 'text-green-400' : 'text-red-400')}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <ReviewModal txn={selected} onClose={() => setSelected(null)}
          onReviewed={() => loadTxns(page, filter)} />
      )}
    </div>
  )
}
