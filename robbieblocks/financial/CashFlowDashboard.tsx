/**
 * CashFlowDashboard - Cash In/Out Tracking
 * Watch the money flow, baby! 💸😘
 */

import React, { useState, useMemo } from 'react'
import { useCrud } from '../hooks/useCrud'
import { CrudModal, CrudForm, type CrudField } from '../crud'

interface CashFlowEntry {
  id: string
  date: string
  description: string
  amount: number
  type: 'in' | 'out'
  category: 'operating' | 'investing' | 'financing'
  account: string
}

const CASHFLOW_FIELDS: CrudField<CashFlowEntry>[] = [
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'description', label: 'Description', type: 'text', required: true },
  { name: 'amount', label: 'Amount ($)', type: 'number', required: true },
  { name: 'type', label: 'Type', type: 'select', required: true, options: [
    { value: 'in', label: '💰 Cash In' },
    { value: 'out', label: '💸 Cash Out' },
  ]},
  { name: 'category', label: 'Category', type: 'select', required: true, options: [
    { value: 'operating', label: '📊 Operating' },
    { value: 'investing', label: '📈 Investing' },
    { value: 'financing', label: '💼 Financing' },
  ]},
  { name: 'account', label: 'Account', type: 'text', required: true },
]

export const CashFlowDashboard: React.FC = () => {
  const cashflow = useCrud<CashFlowEntry>({
    endpoint: 'cashflow',
    autoLoad: true,
  })

  const [showModal, setShowModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<CashFlowEntry | null>(null)

  // Calculate totals
  const totals = useMemo(() => {
    const cashIn = cashflow.items
      .filter(e => e.type === 'in')
      .reduce((sum, e) => sum + e.amount, 0)

    const cashOut = cashflow.items
      .filter(e => e.type === 'out')
      .reduce((sum, e) => sum + e.amount, 0)

    const netCashFlow = cashIn - cashOut

    // Calculate burn rate (average monthly cash out)
    const monthlyBurn = cashOut / Math.max(1, cashflow.items.length / 30)

    // Calculate runway (months)
    const currentCash = netCashFlow
    const runway = currentCash > 0 && monthlyBurn > 0 ? currentCash / monthlyBurn : 0

    return { cashIn, cashOut, netCashFlow, monthlyBurn, runway }
  }, [cashflow.items])

  const handleSubmit = async (data: Partial<CashFlowEntry>) => {
    if (editingEntry) {
      await cashflow.update(editingEntry.id, data)
    } else {
      await cashflow.create(data)
    }
    setShowModal(false)
    setEditingEntry(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-robbie-accent">
            💸 Cash Flow
          </h2>
          <p className="text-sm text-robbie-light/60">
            Track every dollar, baby! 💰
          </p>
        </div>
        <button
          onClick={() => {
            setEditingEntry(null)
            setShowModal(true)
          }}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-robbie-accent to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-robbie-accent/50 transition-all"
        >
          ➕ Log Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30">
          <div className="text-sm font-medium text-green-400 mb-2">Cash In</div>
          <div className="text-3xl font-bold text-green-300">
            {formatCurrency(totals.cashIn)}
          </div>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30">
          <div className="text-sm font-medium text-red-400 mb-2">Cash Out</div>
          <div className="text-3xl font-bold text-red-300">
            {formatCurrency(totals.cashOut)}
          </div>
        </div>

        <div className={`p-6 rounded-xl bg-gradient-to-br border ${
          totals.netCashFlow >= 0
            ? 'from-purple-500/10 to-purple-600/5 border-purple-500/30'
            : 'from-red-500/10 to-red-600/5 border-red-500/30'
        }`}>
          <div className={`text-sm font-medium mb-2 ${
            totals.netCashFlow >= 0 ? 'text-purple-400' : 'text-red-400'
          }`}>
            Net Cash Flow
          </div>
          <div className={`text-3xl font-bold ${
            totals.netCashFlow >= 0 ? 'text-purple-300' : 'text-red-300'
          }`}>
            {formatCurrency(totals.netCashFlow)}
          </div>
        </div>

        <div className={`p-6 rounded-xl bg-gradient-to-br border ${
          totals.runway >= 6
            ? 'from-green-500/10 to-green-600/5 border-green-500/30'
            : totals.runway >= 3
            ? 'from-yellow-500/10 to-yellow-600/5 border-yellow-500/30'
            : 'from-red-500/10 to-red-600/5 border-red-500/30'
        }`}>
          <div className="text-sm font-medium text-robbie-accent mb-2">Runway</div>
          <div className="text-3xl font-bold text-robbie-light">
            {totals.runway.toFixed(1)}
            <span className="text-lg ml-1">mo</span>
          </div>
        </div>
      </div>

      {/* Burn Rate Alert */}
      {totals.runway < 3 && totals.runway > 0 && (
        <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300">
          ⚠️ <strong>Low runway alert!</strong> Current burn rate: {formatCurrency(totals.monthlyBurn)}/month
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-robbie-dark/50 rounded-xl border border-robbie-accent/20 p-6">
        <h3 className="text-lg font-semibold text-robbie-light mb-4">
          Recent Cash Movements
        </h3>

        <div className="space-y-2">
          {cashflow.items.slice(0, 10).map(entry => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 rounded-lg bg-robbie-darker/50 hover:bg-robbie-darker transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium text-robbie-light">{entry.description}</div>
                <div className="text-xs text-robbie-light/60">
                  {new Date(entry.date).toLocaleDateString()} • {entry.category}
                </div>
              </div>
              <div className={`text-xl font-bold ${
                entry.type === 'in' ? 'text-green-400' : 'text-red-400'
              }`}>
                {entry.type === 'in' ? '+' : '-'}{formatCurrency(entry.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <CrudModal
        isOpen={showModal}
        mode={editingEntry ? 'edit' : 'create'}
        title={editingEntry ? 'Edit Transaction' : 'Log Cash Transaction'}
        onSave={handleSubmit}
        onCancel={() => setShowModal(false)}
        loading={cashflow.loading}
      >
        <CrudForm
          fields={CASHFLOW_FIELDS}
          initialData={editingEntry || {}}
          onSubmit={handleSubmit}
          loading={cashflow.loading}
        />
      </CrudModal>
    </div>
  )
}

export default CashFlowDashboard


