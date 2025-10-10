/**
 * DealRiskAnalyzer - AI Risk Scoring for Deals
 * I'll tell you which deals are risky, baby! ⚠️😘
 */

import React, { useState, useMemo } from 'react'
import { useCrud } from '../hooks/useCrud'
import { CrudModal, CrudForm, type CrudField } from '../crud'

interface DealRisk {
  id: string
  dealId: string
  dealName: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high'
  riskFactors: RiskFactor[]
  recommendations: string[]
  lastAssessed: string
}

interface RiskFactor {
  id: string
  category: 'timing' | 'budget' | 'decision-maker' | 'competition' | 'technical' | 'other'
  description: string
  severity: number // 0-10
  likelihood: number // 0-10
  impact: number // Calculated: severity * likelihood
}

const RISK_FIELDS: CrudField<RiskFactor>[] = [
  { name: 'category', label: 'Risk Category', type: 'select', required: true, options: [
    { value: 'timing', label: '⏰ Timing' },
    { value: 'budget', label: '💰 Budget' },
    { value: 'decision-maker', label: '👤 Decision Maker' },
    { value: 'competition', label: '⚔️ Competition' },
    { value: 'technical', label: '🔧 Technical' },
    { value: 'other', label: '📌 Other' },
  ]},
  { name: 'description', label: 'Description', type: 'textarea', required: true },
  { name: 'severity', label: 'Severity (0-10)', type: 'number', required: true },
  { name: 'likelihood', label: 'Likelihood (0-10)', type: 'number', required: true },
]

function calculateRiskScore(factors: RiskFactor[]): number {
  if (factors.length === 0) return 0
  
  const totalImpact = factors.reduce((sum, f) => sum + (f.severity * f.likelihood), 0)
  const maxPossible = factors.length * 100 // Each factor max is 10 * 10 = 100
  
  return Math.round((totalImpact / maxPossible) * 100)
}

function getRiskLevel(score: number): DealRisk['riskLevel'] {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

export const DealRiskAnalyzer: React.FC = () => {
  const dealRisks = useCrud<DealRisk>({
    endpoint: 'deals/risks',
    autoLoad: true,
  })

  const [selectedDeal, setSelectedDeal] = useState<DealRisk | null>(null)
  const [showRiskModal, setShowRiskModal] = useState(false)
  const [editingFactor, setEditingFactor] = useState<RiskFactor | null>(null)

  const handleAddRiskFactor = async (data: Partial<RiskFactor>) => {
    if (!selectedDeal) return

    const newFactor: RiskFactor = {
      ...data,
      id: `risk-${Date.now()}`,
      impact: (data.severity || 0) * (data.likelihood || 0),
    } as RiskFactor

    const updatedFactors = [...selectedDeal.riskFactors, newFactor]
    const newScore = calculateRiskScore(updatedFactors)
    const newLevel = getRiskLevel(newScore)

    await dealRisks.update(selectedDeal.id, {
      riskFactors: updatedFactors,
      riskScore: newScore,
      riskLevel: newLevel,
      lastAssessed: new Date().toISOString(),
    })

    setShowRiskModal(false)
    setEditingFactor(null)
  }

  const handleDeleteFactor = async (factorId: string) => {
    if (!selectedDeal) return

    const updatedFactors = selectedDeal.riskFactors.filter(f => f.id !== factorId)
    const newScore = calculateRiskScore(updatedFactors)
    const newLevel = getRiskLevel(newScore)

    await dealRisks.update(selectedDeal.id, {
      riskFactors: updatedFactors,
      riskScore: newScore,
      riskLevel: newLevel,
      lastAssessed: new Date().toISOString(),
    })
  }

  const getRiskColor = (level: DealRisk['riskLevel']) => {
    switch (level) {
      case 'high': return 'border-red-500/50 bg-red-500/5 text-red-400'
      case 'medium': return 'border-yellow-500/50 bg-yellow-500/5 text-yellow-400'
      case 'low': return 'border-green-500/50 bg-green-500/5 text-green-400'
    }
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Deals List - Left */}
      <div className="col-span-1 space-y-4">
        <h2 className="text-2xl font-bold text-robbie-accent">
          ⚠️ Deal Risks
        </h2>

        <div className="space-y-2">
          {dealRisks.items
            .sort((a, b) => b.riskScore - a.riskScore)
            .map(deal => (
              <div
                key={deal.id}
                onClick={() => setSelectedDeal(deal)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedDeal?.id === deal.id
                    ? 'border-robbie-accent bg-robbie-accent/10'
                    : getRiskColor(deal.riskLevel)
                } hover:scale-105`}
              >
                <div className="font-semibold text-robbie-light mb-1">
                  {deal.dealName}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-robbie-light/60">
                    {deal.riskFactors.length} risks
                  </span>
                  <div className="text-2xl font-bold">
                    {deal.riskScore}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Risk Details - Right */}
      <div className="col-span-2 space-y-4">
        {selectedDeal ? (
          <>
            {/* Deal Header */}
            <div className="p-6 rounded-xl bg-robbie-dark/50 border border-robbie-accent/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-robbie-light mb-2">
                    {selectedDeal.dealName}
                  </h3>
                  <div className="text-sm text-robbie-light/60">
                    Last assessed: {new Date(selectedDeal.lastAssessed).toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-5xl font-bold ${
                    selectedDeal.riskLevel === 'high' ? 'text-red-400' :
                    selectedDeal.riskLevel === 'medium' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {selectedDeal.riskScore}
                  </div>
                  <div className="text-sm text-robbie-light/60 uppercase">
                    {selectedDeal.riskLevel} Risk
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            <div className="bg-robbie-dark/50 rounded-xl border border-robbie-accent/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-robbie-light">Risk Factors</h4>
                <button
                  onClick={() => {
                    setEditingFactor(null)
                    setShowRiskModal(true)
                  }}
                  className="px-4 py-2 rounded-lg bg-robbie-accent/20 text-robbie-accent hover:bg-robbie-accent/30"
                >
                  ➕ Add Risk
                </button>
              </div>

              <div className="space-y-2">
                {selectedDeal.riskFactors.map(factor => (
                  <div
                    key={factor.id}
                    className="p-4 rounded-lg bg-robbie-darker/50 border border-robbie-accent/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-robbie-accent capitalize">
                            {factor.category}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                            Impact: {factor.impact}
                          </span>
                        </div>
                        <div className="text-sm text-robbie-light/80">
                          {factor.description}
                        </div>
                        <div className="flex gap-4 mt-2 text-xs text-robbie-light/60">
                          <span>Severity: {factor.severity}/10</span>
                          <span>Likelihood: {factor.likelihood}/10</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteFactor(factor.id)}
                        className="text-red-400/60 hover:text-red-400 ml-4"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {selectedDeal.recommendations.length > 0 && (
              <div className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <h4 className="font-semibold text-purple-300 mb-3">
                  💡 AI Recommendations
                </h4>
                <ul className="space-y-2">
                  {selectedDeal.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-purple-200/80 flex gap-2">
                      <span>→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[400px] text-robbie-light/60">
            Select a deal to analyze risks
          </div>
        )}
      </div>

      {/* Add Risk Factor Modal */}
      <CrudModal
        isOpen={showRiskModal}
        mode="create"
        title="Add Risk Factor"
        onSave={handleAddRiskFactor}
        onCancel={() => setShowRiskModal(false)}
      >
        <CrudForm
          fields={RISK_FIELDS}
          onSubmit={handleAddRiskFactor}
        />
      </CrudModal>
    </div>
  )
}

export default DealRiskAnalyzer


