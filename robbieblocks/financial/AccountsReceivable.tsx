/**
 * AccountsReceivable - Invoice Aging Report
 * Track who owes you money, baby! 💵😘
 */

import React, { useState, useMemo } from 'react'
import { useCrud } from '../hooks/useCrud'
import { CrudModal, CrudForm, CrudTable, type CrudField, type CrudColumn } from '../crud'

interface Invoice {
  id: string
  invoiceNumber: string
  customer: string
  amount: number
  dueDate: string
  paidDate?: string
  status: 'pending' | 'paid' | 'overdue'
  daysOverdue?: number
  agingBucket: '0-30' | '31-60' | '61-90' | '90+'
}

const INVOICE_FIELDS: CrudField<Invoice>[] = [
  { name: 'invoiceNumber', label: 'Invoice #', type: 'text', required: true },
  { name: 'customer', label: 'Customer', type: 'text', required: true },
  { name: 'amount', label: 'Amount ($)', type: 'number', required: true },
  { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
  { name: 'paidDate', label: 'Paid Date', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', required: true, options: [
    { value: 'pending', label: '⏳ Pending' },
    { value: 'paid', label: '✅ Paid' },
    { value: 'overdue', label: '🔴 Overdue' },
  ]},
]

const INVOICE_COLUMNS: CrudColumn<Invoice>[] = [
  { key: 'invoiceNumber', label: 'Invoice #', sortable: true, width: '120px' },
  { key: 'customer', label: 'Customer', sortable: true },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    width: '120px',
    render: (inv) => (
      <span className="font-bold text-robbie-accent">
        ${inv.amount.toFixed(2)}
      </span>
    ),
  },
  { key: 'dueDate', label: 'Due Date', sortable: true, width: '120px' },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    width: '100px',
    render: (inv) => (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
        inv.status === 'paid' ? 'bg-green-500/20 text-green-400' :
        inv.status === 'overdue' ? 'bg-red-500/20 text-red-400' :
        'bg-yellow-500/20 text-yellow-400'
      }`}>
        {inv.status}
      </span>
    ),
  },
  {
    key: 'agingBucket',
    label: 'Aging',
    sortable: true,
    width: '80px',
    render: (inv) => inv.status !== 'paid' ? (
      <span className={`text-xs font-semibold ${
        inv.agingBucket === '0-30' ? 'text-green-400' :
        inv.agingBucket === '31-60' ? 'text-yellow-400' :
        inv.agingBucket === '61-90' ? 'text-orange-400' :
        'text-red-400'
      }`}>
        {inv.agingBucket}
      </span>
    ) : null,
  },
]

export const AccountsReceivable: React.FC = () => {
  const invoices = useCrud<Invoice>({
    endpoint: 'invoices',
    autoLoad: true,
  })

  const [showModal, setShowModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

  // Calculate aging buckets
  const agingReport = useMemo(() => {
    const buckets = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
    }

    invoices.items
      .filter(inv => inv.status !== 'paid')
      .forEach(inv => {
        buckets[inv.agingBucket] += inv.amount
      })

    return buckets
  }, [invoices.items])

  const totalOutstanding = useMemo(() => {
    return invoices.items
      .filter(inv => inv.status !== 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0)
  }, [invoices.items])

  const handleMarkPaid = async (invoice: Invoice) => {
    await invoices.update(invoice.id, {
      status: 'paid',
      paidDate: new Date().toISOString().split('T')[0],
    })
  }

  const handleSendReminder = (invoice: Invoice) => {
    // In real app, send email reminder
    console.log(`Sending reminder to ${invoice.customer}`)
    alert(`Reminder sent to ${invoice.customer}! 💌`)
  }

  const handleSubmit = async (data: Partial<Invoice>) => {
    if (editingInvoice) {
      await invoices.update(editingInvoice.id, data)
    } else {
      await invoices.create(data)
    }
    setShowModal(false)
    setEditingInvoice(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-robbie-accent">
            📋 Accounts Receivable
          </h2>
          <p className="text-sm text-robbie-light/60">
            Who owes you money, baby! 💰
          </p>
        </div>
        <button
          onClick={() => {
            setEditingInvoice(null)
            setShowModal(true)
          }}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-robbie-accent to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-robbie-accent/50 transition-all"
        >
          ➕ New Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30">
          <div className="text-sm font-medium text-purple-400 mb-2">Total Outstanding</div>
          <div className="text-4xl font-bold text-purple-300">
            ${totalOutstanding.toFixed(2)}
          </div>
          <div className="text-xs text-purple-400/60 mt-2">
            {invoices.items.filter(i => i.status !== 'paid').length} unpaid invoices
          </div>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30">
          <div className="text-sm font-medium text-green-400 mb-2">Collected</div>
          <div className="text-4xl font-bold text-green-300">
            ${invoices.items.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0).toFixed(2)}
          </div>
          <div className="text-xs text-green-400/60 mt-2">
            {invoices.items.filter(i => i.status === 'paid').length} paid invoices
          </div>
        </div>
      </div>

      {/* Aging Report */}
      <div className="bg-robbie-dark/50 rounded-xl border border-robbie-accent/20 p-6">
        <h3 className="text-lg font-semibold text-robbie-light mb-4">
          Aging Report
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(agingReport).map(([bucket, amount]) => (
            <div key={bucket} className="p-4 rounded-lg bg-robbie-darker/50 border border-robbie-accent/20 text-center">
              <div className="text-sm text-robbie-light/60 mb-1">{bucket} days</div>
              <div className={`text-2xl font-bold ${
                bucket === '0-30' ? 'text-green-400' :
                bucket === '31-60' ? 'text-yellow-400' :
                bucket === '61-90' ? 'text-orange-400' :
                'text-red-400'
              }`}>
                ${amount.toFixed(0)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-robbie-dark/50 rounded-xl border border-robbie-accent/20 p-6">
        <h3 className="text-lg font-semibold text-robbie-light mb-4">
          All Invoices
        </h3>

        <CrudTable
          data={invoices.items}
          columns={INVOICE_COLUMNS}
          onEdit={(inv) => {
            setEditingInvoice(inv)
            setShowModal(true)
          }}
          onDelete={(inv) => invoices.deleteItem(inv.id)}
          loading={invoices.loading}
          emptyMessage="No invoices yet"
        />
      </div>

      {/* Create/Edit Modal */}
      <CrudModal
        isOpen={showModal}
        mode={editingInvoice ? 'edit' : 'create'}
        title={editingInvoice ? `Edit Invoice ${editingInvoice.invoiceNumber}` : 'New Invoice'}
        onSave={handleSubmit}
        onCancel={() => setShowModal(false)}
        loading={invoices.loading}
      >
        <CrudForm
          fields={INVOICE_FIELDS}
          initialData={editingInvoice || {}}
          onSubmit={handleSubmit}
          loading={invoices.loading}
        />
      </CrudModal>
    </div>
  )
}

export default AccountsReceivable


