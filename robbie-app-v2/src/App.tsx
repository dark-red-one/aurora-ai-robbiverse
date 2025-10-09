import { useState } from 'react';
import { MatrixRain } from './components/MatrixRain';
import { RobbieBar } from './components/RobbieBar';

function App() {
  const [activeApp, setActiveApp] = useState('work');

  return (
    <div className="min-h-screen bg-bg-dark text-white overflow-hidden">
      {/* Matrix Rain Background */}
      <MatrixRain />

      {/* RobbieBar (Left Sidebar) */}
      <RobbieBar activeApp={activeApp} onAppChange={setActiveApp} />

      {/* Main Content Area */}
      <div className="ml-[280px] min-h-screen p-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Glass Panel */}
          <div className="bg-bg-dark/70 backdrop-blur-xl rounded-2xl border border-robbie-purple/20 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_20px_rgba(157,78,221,0.1)] p-8">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-robbie-purple via-robbie-pink to-matrix-green bg-clip-text text-transparent mb-2">
                Welcome to RobbieApp V2
              </h1>
              <p className="text-white/60">
                Matrix aesthetic + Flirty mode 11/11 activated! 💋🔥
              </p>
            </div>

            {/* Content based on active app */}
            <div className="space-y-6">
              {activeApp === 'work' && (
                <div>
                  <h2 className="text-2xl font-bold text-robbie-purple mb-4">@work</h2>
                  <p className="text-white/80">
                    Revenue, deals, tasks - let's make money, handsome! 💰
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    {['Chat', 'Comms', 'Notes', 'Tasks', 'Money', 'Pipeline'].map((tab) => (
                      <button
                        key={tab}
                        className="p-4 bg-robbie-purple/10 hover:bg-robbie-purple/20 border border-robbie-purple/30 rounded-lg transition-all"
                      >
                        <span className="text-white font-semibold">{tab}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeApp === 'growth' && (
                <div>
                  <h2 className="text-2xl font-bold text-matrix-green mb-4">@growth</h2>
                  <p className="text-white/80">
                    Marketing, content, analytics - let's grow this thing! 📈
                  </p>
                </div>
              )}

              {activeApp === 'code' && (
                <div>
                  <h2 className="text-2xl font-bold text-robbie-blue mb-4">@code</h2>
                  <p className="text-white/80">
                    Repos, deployments, logs - let's ship some code! 💻
                  </p>
                </div>
              )}

              {activeApp === 'play' && (
                <div>
                  <h2 className="text-2xl font-bold text-robbie-pink mb-4">@play</h2>
                  <p className="text-white/80">
                    Blackjack, sudoku, fun - let me deal you in, babe! 🎮💋
                  </p>
                </div>
              )}

              {activeApp === 'lead' && (
                <div>
                  <h2 className="text-2xl font-bold text-robbie-orange mb-4">@lead</h2>
                  <p className="text-white/80">
                    Team, strategy, mentors - let's lead this empire! 👑
                  </p>
                </div>
              )}
            </div>

            {/* Status Bar */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-matrix-green font-mono">● Online</span>
                <span className="text-white/40">|</span>
                <span className="text-white/60">RobbieBook1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-robbie-purple/20 border border-robbie-purple/40 rounded-full text-robbie-purple text-xs font-mono">
                  STABLE
                </span>
                <span className="text-white/40">v2.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
