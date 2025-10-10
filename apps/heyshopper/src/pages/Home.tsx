import { Link } from 'react-router-dom'
import { Search, Sparkles, ShoppingBag } from 'lucide-react'
import SearchBar from '../components/SearchBar'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-white font-semibold">AI-Powered Shopping Intelligence</span>
          </div>

          <h1 className="text-6xl font-bold text-white leading-tight">
            Hey<span className="text-yellow-300">Shopper</span>
          </h1>

          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Find the perfect products with AI that understands what you really want.
            Smart recommendations, instant comparisons, best prices.
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar />

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            icon={<Search className="w-6 h-6" />}
            title="Smart Search"
            description="Natural language queries that understand context"
          />
          <FeatureCard
            icon={<Sparkles className="w-6 h-6" />}
            title="AI Recommendations"
            description="Personalized suggestions based on your needs"
          />
          <FeatureCard
            icon={<ShoppingBag className="w-6 h-6" />}
            title="Best Prices"
            description="Compare across retailers instantly"
          />
        </div>

        {/* Status */}
        <div className="text-center">
          <div className="inline-block px-6 py-3 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
            <p className="text-white/90">
              <span className="font-semibold">In Development</span> - Coming in Phase 5
            </p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex justify-center gap-4">
          <Link
            to="/about"
            className="px-6 py-3 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-lg font-medium border border-white/20 transition-all"
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/20 transition-all">
      <div className="w-12 h-12 bg-yellow-300/20 rounded-lg flex items-center justify-center mb-4 text-yellow-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/70">{description}</p>
    </div>
  )
}

