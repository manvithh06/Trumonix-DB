import { useEffect, useState } from 'react'
import { auditApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, ScrollText, Shield, UserCheck, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

const ACTION_ICONS = {
  USER_LOGIN: UserCheck,
  USER_REGISTERED: UserCheck,
  TRANSACTION_APPROVED: Shield,
  TRANSACTION_FLAGGED: AlertTriangle,
  TRANSACTION_BLOCKED: AlertTriangle,
  TRANSACTION_REVIEWED: ScrollText,
}

const ACTION_COLORS = {
  USER_LOGIN: 'text-brand-400 bg-brand-500/10',
  USER_REGISTERED: 'text-blue-400 bg-blue-500/10',
  TRANSACTION_APPROVED: 'text-green-400 bg-green-500/10',
  TRANSACTION_FLAGGED: 'text-amber-400 bg-amber-500/10',
  TRANSACTION_BLOCKED: 'text-red-400 bg-red-500/10',
  TRANSACTION_REVIEWED: 'text-purple-400 bg-purple-500/10',
}

export default function AuditLogs() {
  const { isAdmin } = useAuth()
  const [data, setData]     = useState({ items: [], total: 0 })
  const [page, setPage]     = useState(1)
  const [loading, setLoading] = useState(true)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const res = isAdmin ? await auditApi.getAll(p) : await auditApi.getMy(p)
      setData(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(page) }, [page, isAdmin])

  const totalPages = Math.ceil(data.total / 20)

  return (
    <div className="animate-slide-up space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ScrollText size={18} className="text-brand-400" />
          Audit Logs
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {isAdmin ? 'Complete system audit trail' : 'Your account activity log'} · {data.total} entries
        </p>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : data.items.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <ScrollText size={32} className="mx-auto mb-3 opacity-30" />
            <p>No audit logs yet</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-surface-border">
              {data.items.map(log => {
                const Icon = ACTION_ICONS[log.action] || ScrollText
                const colorCls = ACTION_COLORS[log.action] || 'text-slate-400 bg-slate-500/10'
                return (
                  <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-surface-hover/30 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${colorCls}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-slate-300">{log.action}</span>
                        {log.transaction_id && (
                          <span className="text-xs text-brand-400 font-mono">·txn #{log.transaction_id}</span>
                        )}
                        {isAdmin && log.user_id && (
                          <span className="text-xs text-slate-600 font-mono">·user #{log.user_id}</span>
                        )}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="flex gap-3 flex-wrap mt-1.5">
                          {Object.entries(log.details).slice(0, 4).map(([k, v]) => (
                            <span key={k} className="text-xs text-slate-600">
                              <span className="text-slate-500">{k}:</span>{' '}
                              <span className="text-slate-400">{String(v)}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-slate-600">
                          {format(new Date(log.created_at), 'MMM dd yyyy, HH:mm:ss')}
                        </span>
                        {log.ip_address && (
                          <span className="text-xs font-mono text-slate-700">{log.ip_address}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-700 font-mono shrink-0">#{log.id}</span>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-surface-border">
              <p className="text-xs text-slate-500">Page {page} of {totalPages || 1}</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg border border-surface-border text-slate-400 hover:text-white disabled:opacity-40">
                  <ChevronLeft size={14} />
                </button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg border border-surface-border text-slate-400 hover:text-white disabled:opacity-40">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
