import { useEffect, useState } from 'react'
import { transactionsApi } from '../services/api'
import { StatusBadge, RiskScore, RiskFactorList } from '../components/RiskBadge'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Search, Filter, X, Info } from 'lucide-react'
import clsx from 'clsx'

const STATUS_FILTERS = ['', 'APPROVED', 'FLAGGED', 'BLOCKED', 'PENDING']

function TransactionModal({ txn, onClose }) {
  if (!txn) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-surface-border sticky top-0 bg-surface-card">
          <div>
            <p className="text-xs text-slate-500 font-mono mb-0.5">TRANSACTION DETAIL</p>
            <p className="font-mono text-brand-400 font-bold">{txn.transaction_ref}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={txn.status} />
            <button onClick={onClose} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-surface-hover">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex justify-center">
            <RiskScore score={txn.risk_score} size="lg" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              ['Amount',   `${txn.currency} ${txn.amount?.toLocaleString()}`],
              ['Merchant', txn.merchant],
              ['Category', txn.merchant_category],
              ['Device',   txn.device_id || '—'],
              ['Location', txn.location || '—'],
              ['IP',       txn.ip_address || '—'],
              ['Recipient',txn.recipient_name || '—'],
              ['Date',     format(new Date(txn.created_at), 'PPpp')],
            ].map(([label, value]) => (
              <div key={label} className="bg-surface rounded-lg p-3 border border-surface-border">
                <p className="text-xs text-slate-500 font-mono">{label.toUpperCase()}</p>
                <p className="text-sm text-slate-200 mt-0.5 break-all">{value}</p>
              </div>
            ))}
          </div>

          {txn.description && (
            <div className="bg-surface rounded-lg p-3 border border-surface-border">
              <p className="text-xs text-slate-500 font-mono mb-1">DESCRIPTION</p>
              <p className="text-sm text-slate-300">{txn.description}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">
              Risk Factors ({txn.risk_factors?.length || 0})
            </p>
            <RiskFactorList factors={txn.risk_factors} />
          </div>

          {txn.is_manual_override && (
            <div className="p-3 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs">
              ✓ This transaction was manually reviewed by an administrator.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Transactions() {
  const [data, setData]       = useState({ items: [], total: 0, pages: 1 })
  const [page, setPage]       = useState(1)
  const [filter, setFilter]   = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async (p = 1, f = filter) => {
    setLoading(true)
    try {
      const res = await transactionsApi.getMyTxns(p, f)
      setData(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(page, filter) }, [page, filter])

  return (
    <div className="animate-slide-up space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">My Transactions</h1>
          <p className="text-slate-500 text-sm">{data.total} total transactions</p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-slate-500" />
          {STATUS_FILTERS.map(f => (
            <button key={f || 'all'} onClick={() => { setFilter(f); setPage(1) }}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200',
                filter === f
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'bg-surface border border-surface-border text-slate-500 hover:text-white'
              )}>
              {f || 'ALL'}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : data.items.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Search size={32} className="mx-auto mb-3 opacity-30" />
            <p>No transactions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border">
                    {['Ref','Merchant','Amount','Category','Risk Score','Status','Date',''].map(h => (
                      <th key={h} className="text-left text-xs font-mono text-slate-600 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map(txn => (
                    <tr key={txn.id} className="table-row cursor-pointer" onClick={() => setSelected(txn)}>
                      <td className="px-4 py-3 font-mono text-xs text-brand-400">{txn.transaction_ref}</td>
                      <td className="px-4 py-3 text-slate-300 max-w-[140px] truncate">{txn.merchant}</td>
                      <td className="px-4 py-3 font-mono font-medium text-white">${txn.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs capitalize">{txn.merchant_category}</td>
                      <td className="px-4 py-3"><RiskScore score={txn.risk_score} /></td>
                      <td className="px-4 py-3"><StatusBadge status={txn.status} /></td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {format(new Date(txn.created_at), 'MMM dd, HH:mm')}
                      </td>
                      <td className="px-4 py-3">
                        <Info size={14} className="text-slate-600 hover:text-brand-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border">
              <p className="text-xs text-slate-500">Page {page} of {data.pages}</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg border border-surface-border text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft size={14} />
                </button>
                <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg border border-surface-border text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <TransactionModal txn={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
