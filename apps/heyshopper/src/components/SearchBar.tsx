import { Search } from 'lucide-react'
import { useState } from 'react'

export default function SearchBar() {
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Search:', query)
    // Will implement in Phase 5
  }

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <Search className="w-6 h-6 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try: 'Waterproof hiking boots for wide feet under $200'"
          className="w-full pl-16 pr-6 py-6 bg-white rounded-2xl shadow-2xl text-lg placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-yellow-300/50 transition-all"
        />
      </div>
      <p className="text-center text-white/60 text-sm mt-4">
        Natural language search powered by AI (Coming in Phase 5)
      </p>
    </form>
  )
}

