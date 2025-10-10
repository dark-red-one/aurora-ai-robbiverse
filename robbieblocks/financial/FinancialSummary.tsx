/**
 * FinancialSummary - QuickBooks-Style P&L Dashboard
 * Show me the money, baby! 💰💋
 */

import React, { useState } from 'react'
import { useCrud } from '../hooks/useCrud'
import { CrudModal, CrudForm, CrudTable, Confirm Dialog, type CrudField, type CrudColumn } from '../crud'

interface Transaction {
  id: string
  date: string
  description: string
  category: string
  amount: number
  type: 'income' | 'expense'
  account: string
}

interface FinancialPeriod {
  income: number
  expenses: number
  profit: number
  transactions: Transaction[]
}

const TRANSACTION_FIELDS: CrudField<Transaction>[] = [
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'description', label: 'Description', type: 'text', required: true, placeholder: 'e.g., Client payment' },
  { name: 'category', label: 'Category', type: 'select', required: true, options: [
    { value: 'revenue', label: 'Revenue' },
    { value: 'cost_of_goods', label: 'Cost of Goods Sold' },
    { value: 'operating', label: 'Operating Expenses' },
    { value: 'marketing', label: 'Marketing & Sales' },
    { value: 'payroll', label: 'Payroll' },
    { value: 'other', label: 'Other' },
  ]},
  { name: 'amount', label: 'Amount', type: 'number', required: true, placeholder: '0.00' },
  { name: 'type', label: 'Type', type: 'select', required: true, options: [
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
  ]},
  { name: 'account', label: 'Account', type: 'text', required: true, placeholder: 'e.g., Business Checking' },
]

const TRANSACTION_COLUMNS: CrudColumn<Transaction>[] = [
  { key: 'date', label: 'Date', sortable: true, width: '120px' },
  { key: 'description', label: 'Description', sortable: true },
  { key: 'category', label: 'Category', sortable: true, width: '150px' },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    width: '120px',
    render: (item) => (
      <span className={item.type === 'income' ? 'text-green-400' : 'text-red-400'}>
        {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
      </span>
    ),
  },
  { key: 'account', label: 'Account', sortable: true, width: '150px' },
]

interface FinancialSummaryProps {
  period?: 'MTD' | 'QTD' | 'YTD' | 'All'
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  period = 'MTD',
}) => {
  const transactions = useCrud<Transaction>({
    endpoint: 'transactions',
    autoLoad: true,
  })

  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState(period)

  // Calculate financials
  const calculateFinancials = (): FinancialPeriod => {
    const income = transactions.items
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = transactions.items
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      income,
      expenses,
      profit: income - expenses,
      transactions: transactions.items,
    }
  }

  const financials = calculateFinancials()

  const handleCreate = () => {
    setEditingTransaction(null)
    setShowModal(true)
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setShowModal(true)
  }

  const handleDelete = (transaction: Transaction) => {
    setDeleteConfirm(transaction.id)
  }

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await transactions.deleteItem(deleteConfirm)
      setDeleteConfirm(null)
    }
  }

  const handleSubmit = async (data: Partial<Transaction>) => {
    if (editingTransaction) {
      await transactions.update(editingTransaction.id, data)
    } else {
      await transactions.create(data)
    }
    setShowModal(false)
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
            💰 Financial Summary
          </h2>
          <p className="text-sm text-robbie-light/60">
            QuickBooks-style P&L tracking
          </p>
        </div>
        <div className="flex gap-2">
          {(['MTD', 'QTD', 'YTD', 'All'] as const).map(p => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === p
                  ? 'bg-robbie-accent text-white'
                  : 'bg-robbie-darker/50 text-robbie-light/60 hover:bg-robbie-darker'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* P&L Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Income Card */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30">
          <div className="text-sm font-medium text-green-400 mb-2">Total Income</div>
          <div className="text-3xl font-bold text-green-300">
            {formatCurrency(financials.income)}
          </div>
          <div className="text-xs text-green-400/60 mt-2">
            {transactions.items.filter(t => t.type === 'income').length} transactions
          </div>
        </div>

        {/* Expenses Card */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30">
          <div className="text-sm font-medium text-red-400 mb-2">Total Expenses</div>
          <div className="text-3xl font-bold text-red-300">
            {formatCurrency(financials.expenses)}
          </div>
          <div className="text-xs text-red-400/60 mt-2">
            {transactions.items.filter(t => t.type === 'expense').length} transactions
          </div>
        </div>

        {/* Profit Card */}
        <div className={`p-6 rounded-xl bg-gradient-to-br border ${
          financials.profit >= 0
            ? 'from-purple-500/10 to-purple-600/5 border-purple-500/30'
            : 'from-red-500/10 to-red-600/5 border-red-500/30'
        }`}>
          <div className={`text-sm font-medium mb-2 ${
            financials.profit >= 0 ? 'text-purple-400' : 'text-red-400'
          }`}>
            Net Profit
          </div>
          <div className={`text-3xl font-bold ${
            financials.profit >= 0 ? 'text-purple-300' : 'text-red-300'
          }`}>
            {formatCurrency(financials.profit)}
          </div>
          <div className={`text-xs mt-2 ${
            financials.profit >= 0 ? 'text-purple-400/60' : 'text-red-400/60'
          }`}>
            {financials.profit >= 0 ? 'Profitable! 🚀' : 'In the red 📉'}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-robbie-dark/50 rounded-xl border border-robbie-accent/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-robbie-light">
            Recent Transactions
          </h3>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-robbie-accent to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-robbie-accent/50 transition-all"
          >
            ➕ Add Transaction
          </button>
        </div>

        <CrudTable
          data={transactions.items}
          columns={TRANSACTION_COLUMNS}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={transactions.loading}
          emptyMessage="No transactions yet. Add your first one!"
        />
      </div>

      {/* Create/Edit Modal */}
      <CrudModal
        isOpen={showModal}
        mode={editingTransaction ? 'edit' : 'create'}
        title={editingTransaction ? 'Edit Transaction' : 'New Transaction'}
        onSave={handleSubmit}
        onCancel={() => setShowModal(false)}
        loading={transactions.loading}
      >
        <CrudForm
          fields={TRANSACTION_FIELDS}
          initialData={editingTransaction || {}}
          onSubmit={handleSubmit}
          loading={transactions.loading}
        />
      </CrudModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={transactions.loading}
        danger
      />
    </div>
  )
}

export default FinancialSummary


