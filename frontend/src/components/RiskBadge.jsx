import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react'
import clsx from 'clsx'

export function StatusBadge({ status }) {
  const map = {
    APPROVED: { cls: 'badge-approved', icon: CheckCircle,    label: 'Approved' },
    FLAGGED:  { cls: 'badge-flagged',  icon: AlertTriangle,  label: 'Flagged'  },
    BLOCKED:  { cls: 'badge-blocked',  icon: XCircle,        label: 'Blocked'  },
    PENDING:  { cls: 'badge-pending',  icon: Clock,          label: 'Pending'  },
  }
  const cfg = map[status] || map.PENDING
  const Icon = cfg.icon
  return (
    <span className={cfg.cls}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

export function RiskScore({ score, size = 'md' }) {
  const color = score >= 70 ? 'text-red-400' : score >= 30 ? 'text-amber-400' : 'text-green-400'
  const bg    = score >= 70 ? 'bg-red-500/10 border-red-500/20' : score >= 30 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-green-500/10 border-green-500/20'

  if (size === 'lg') {
    const radius = 45
    const circ   = 2 * Math.PI * radius
    const offset = circ - (score / 100) * circ
    return (
      <div className="flex flex-col items-center gap-2">
        <svg width="120" height="120" viewBox="0 0 120 120" className="risk-ring" style={{ '--target-offset': offset }}>
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#1e2d4a" strokeWidth="8" />
          <circle cx="60" cy="60" r={radius} fill="none"
            stroke={score >= 70 ? '#ef4444' : score >= 30 ? '#f59e0b' : '#22c55e'}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
          />
          <text x="60" y="65" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="Space Mono">
            {Math.round(score)}
          </text>
        </svg>
        <p className={clsx('text-xs font-mono', color)}>
          {score >= 70 ? 'HIGH RISK' : score >= 30 ? 'MEDIUM RISK' : 'LOW RISK'}
        </p>
      </div>
    )
  }

  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold border', bg, color)}>
      {Math.round(score)}
    </span>
  )
}

export function RiskFactorList({ factors = [] }) {
  if (!factors || factors.length === 0)
    return <p className="text-slate-500 text-sm">No risk factors triggered.</p>

  const severityColor = { high: 'text-red-400 bg-red-500/10 border-red-500/20', medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20', low: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }

  return (
    <div className="space-y-2">
      {factors.map((f, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface border border-surface-border">
          <span className={clsx('text-xs font-mono px-2 py-0.5 rounded border shrink-0 mt-0.5', severityColor[f.severity] || severityColor.low)}>
            {f.severity?.toUpperCase() || 'LOW'}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-mono text-slate-300">{f.factor}</p>
            <p className="text-xs text-slate-500 mt-0.5">{f.detail}</p>
          </div>
          <span className="text-xs text-slate-600 font-mono shrink-0">+{f.weight}</span>
        </div>
      ))}
    </div>
  )
}
