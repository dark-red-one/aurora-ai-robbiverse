import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function About() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-8 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="space-y-6 text-white">
          <h1 className="text-5xl font-bold">About HeyShopper</h1>

          <div className="prose prose-invert max-w-none space-y-4">
            <p className="text-xl text-white/80 leading-relaxed">
              HeyShopper is an AI-powered shopping assistant that helps you find exactly what you're looking for
              using natural language and intelligent recommendations.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">The Vision</h2>
            <p className="text-white/80 leading-relaxed">
              Imagine being able to search for products like you talk to a friend: "I need running shoes for trail running in wet conditions under $150."
              HeyShopper understands context, preferences, and requirements to deliver perfect matches every time.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Coming Features</h2>
            <ul className="space-y-2 text-white/80">
              <li>• Natural language product search</li>
              <li>• AI-powered recommendations based on your needs</li>
              <li>• Instant price comparisons across retailers</li>
              <li>• Smart filtering and sorting</li>
              <li>• Review analysis and sentiment scoring</li>
              <li>• Price drop alerts</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">Development Timeline</h2>
            <p className="text-white/80 leading-relaxed">
              HeyShopper is currently in Phase 5 of the Robbieverse roadmap. It will be built after TestPilot CPG proves
              the monorepo architecture and demonstrates 80% code reuse.
            </p>

            <div className="mt-8 p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <p className="text-white/90">
                <strong>Status:</strong> In Development - Estimated launch Q2 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

