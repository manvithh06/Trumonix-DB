import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { transactionsApi } from '../services/api'
import { StatusBadge, RiskScore, RiskFactorList } from '../components/RiskBadge'
import { Send, CheckCircle2, AlertTriangle, XCircle, ChevronDown } from 'lucide-react'

const CATEGORIES = [
  { value: 'retail',        label: '🛍️  Retail'         },
  { value: 'food',          label: '🍔  Food & Dining'   },
  { value: 'travel',        label: '✈️  Travel'           },
  { value: 'entertainment', label: '🎬  Entertainment'   },
  { value: 'healthcare',    label: '🏥  Healthcare'      },
  { value: 'utilities',     label: '💡  Utilities'       },
  { value: 'gambling',      label: '🎰  Gambling'        },
  { value: 'crypto',        label: '₿   Crypto'          },
  { value: 'forex',         label: '💱  Forex'           },
  { value: 'wire_transfer', label: '🔁  Wire Transfer'   },
  { value: 'other',         label: '📦  Other'           },
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD']

const ResultPanel = ({ result, onReset }) => {
  const icons = { APPROVED: CheckCircle2, FLAGGED: AlertTriangle, BLOCKED: XCircle }
  const colors = { APPROVED: 'border-green-500/30 bg-green-500/5', FLAGGED: 'border-amber-500/30 bg-amber-500/5', BLOCKED: 'border-red-500/30 bg-red-500/5' }
  const Icon = icons[result.status]

  return (
    <div className={`card border-2 ${colors[result.status]} animate-slide-up`}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-mono text-slate-500 mb-1">TRANSACTION RESULT</p>
          <p className="font-mono text-lg font-bold text-white">{result.transaction_ref}</p>
        </div>
        <StatusBadge status={result.status} />
      </div>

      <div className="flex flex-col items-center gap-2 mb-6 py-4">
        <RiskScore score={result.risk_score} size="lg" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Amount',   value: `${result.currency} ${result.amount?.toLocaleString()}` },
          { label: 'Merchant', value: result.merchant },
          { label: 'Device',   value: result.device_id || 'N/A' },
          { label: 'Location', value: result.location || 'N/A' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface rounded-lg p-3 border border-surface-border">
            <p className="text-xs text-slate-500 font-mono mb-1">{label.toUpperCase()}</p>
            <p className="text-sm text-slate-200 truncate">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-5">
        <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">
          Risk Factors ({result.risk_factors?.length || 0})
        </p>
        <RiskFactorList factors={result.risk_factors} />
      </div>

      {result.status === 'BLOCKED' && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-4">
          ⛔ This transaction has been blocked due to high risk score. Contact support if you believe this is an error.
        </div>
      )}
      {result.status === 'FLAGGED' && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs mb-4">
          ⚠️ This transaction has been flagged for manual review by an administrator.
        </div>
      )}

      <button onClick={onReset} className="btn-primary w-full">Submit Another Transaction</button>
    </div>
  )
}

export default function NewTransaction() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    amount: '', currency: 'USD', merchant: '', merchant_category: 'retail',
    description: '', recipient_name: '', recipient_account: '',
    device_id: '', location: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [result, setResult]   = useState(null)

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        device_id: form.device_id || undefined,
        location: form.location || undefined,
      }
      const { data } = await transactionsApi.create(payload)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Transaction failed.')
    } finally {
      setLoading(false)
    }
  }

  if (result) return (
    <div className="max-w-lg mx-auto">
      <ResultPanel result={result} onReset={() => setResult(null)} />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">New Transaction</h1>
        <p className="text-slate-500 text-sm mt-1">All transactions are evaluated under Zero-Trust policy</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card mb-4">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-4">Transaction Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Amount *</label>
              <input type="number" min="0.01" step="0.01" value={form.amount}
                onChange={e => set('amount', e.target.value)}
                className="input" placeholder="0.00" required />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Currency</label>
              <div className="relative">
                <select value={form.currency} onChange={e => set('currency', e.target.value)}
                  className="input appearance-none pr-8">
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs text-slate-400 mb-1.5">Merchant *</label>
            <input type="text" value={form.merchant}
              onChange={e => set('merchant', e.target.value)}
              className="input" placeholder="e.g. Amazon, Starbucks" required />
          </div>

          <div className="mt-4">
            <label className="block text-xs text-slate-400 mb-1.5">Merchant Category *</label>
            <div className="relative">
              <select value={form.merchant_category} onChange={e => set('merchant_category', e.target.value)}
                className="input appearance-none pr-8">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs text-slate-400 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              className="input resize-none" rows={2} placeholder="Optional note..." />
          </div>
        </div>

        <div className="card mb-4">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-4">Recipient (Optional)</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Recipient Name</label>
              <input type="text" value={form.recipient_name}
                onChange={e => set('recipient_name', e.target.value)}
                className="input" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Account / ID</label>
              <input type="text" value={form.recipient_account}
                onChange={e => set('recipient_account', e.target.value)}
                className="input" placeholder="IBAN / Account No" />
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-4">Context (Zero-Trust Signals)</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Device ID</label>
              <input type="text" value={form.device_id}
                onChange={e => set('device_id', e.target.value)}
                className="input font-mono text-sm" placeholder="device-uuid-xxx" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Location</label>
              <input type="text" value={form.location}
                onChange={e => set('location', e.target.value)}
                className="input" placeholder="City, Country" />
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-3">
            These signals are used by the risk engine to detect device mismatches and location anomalies.
          </p>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Evaluating risk...</>
            ) : (
              <><Send size={15} />Submit Transaction</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
