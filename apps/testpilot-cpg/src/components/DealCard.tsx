import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

export interface Deal {
  id: string
  company: string
  value: number
  stage: string
  probability: number
  healthScore: number
  lastContact: string
}

export default function DealCard({ deal }: { deal: Deal }) {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4" />
    if (score >= 60) return <TrendingUp className="w-4 h-4" />
    return <AlertTriangle className="w-4 h-4" />
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-testpilot-dark">{deal.company}</h3>
          <p className="text-sm text-gray-600 mt-1">{deal.stage}</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded ${getHealthColor(deal.healthScore)}`}>
          {getHealthIcon(deal.healthScore)}
          <span className="text-sm font-semibold">{deal.healthScore}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Value</span>
          <span className="font-semibold text-testpilot-dark">
            ${deal.value.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Probability</span>
          <span className="font-semibold text-testpilot-dark">{deal.probability}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Last Contact</span>
          <span className="text-sm text-gray-500">{deal.lastContact}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="w-full px-4 py-2 bg-testpilot-orange text-white rounded-lg font-medium hover:bg-testpilot-orange/90 transition-colors">
          View Details
        </button>
      </div>
    </div>
  )
}

