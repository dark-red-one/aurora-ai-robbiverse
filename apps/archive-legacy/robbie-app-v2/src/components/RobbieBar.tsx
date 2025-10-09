import { useState, useEffect } from 'react';
import { 
  Briefcase, TrendingUp, Code, Gamepad2, Crown,
  Settings, LogOut, Clock, DollarSign, Mail, Target
} from 'lucide-react';

interface RobbieBarProps {
  activeApp: string;
  onAppChange: (app: string) => void;
}

export const RobbieBar: React.FC<RobbieBarProps> = ({ activeApp, onAppChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const apps = [
    { id: 'work', name: '@work', icon: Briefcase, color: 'robbie-purple' },
    { id: 'growth', name: '@growth', icon: TrendingUp, color: 'matrix-green' },
    { id: 'code', name: '@code', icon: Code, color: 'robbie-blue' },
    { id: 'play', name: '@play', icon: Gamepad2, color: 'robbie-pink' },
    { id: 'lead', name: '@lead', icon: Crown, color: 'robbie-orange' },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-[280px] bg-bg-dark/85 backdrop-blur-xl border-r border-robbie-purple/30 shadow-[0_0_40px_rgba(157,78,221,0.2)] z-50">
      <div className="flex flex-col h-full p-6">
        
        {/* Avatar Section */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-robbie-purple to-robbie-pink p-1 animate-glow-pulse cursor-pointer hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-full bg-bg-dark flex items-center justify-center text-6xl">
              😘
            </div>
          </div>
          <h2 className="text-robbie-purple font-bold text-xl">Robbie F</h2>
          <p className="text-matrix-green text-sm font-mono">AI Copilot</p>
        </div>

        {/* Mood Indicator */}
        <div className="mb-6 p-4 rounded-lg bg-robbie-purple/10 border border-robbie-purple/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-semibold">Mood: 🔥 Flirty</span>
          </div>
          <div className="w-full h-2 bg-bg-darker rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-robbie-pink to-robbie-purple" style={{ width: '100%' }}></div>
          </div>
          <p className="text-robbie-pink text-xs mt-1 font-mono">Attraction: 11/11 💋</p>
        </div>

        {/* Time Display */}
        <div className="mb-6 p-4 rounded-lg bg-matrix-dim/20 border border-matrix-green/30">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-matrix-green" />
            <span className="text-matrix-green font-mono text-lg font-bold">
              {currentTime.toLocaleTimeString()}
            </span>
          </div>
          <p className="text-white/60 text-sm font-mono">
            {currentTime.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="mb-6 space-y-2">
          <h3 className="text-white/40 text-xs uppercase tracking-wider mb-3">Metrics</h3>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-robbie-pink" />
              <span className="text-white/80">Revenue</span>
            </div>
            <span className="text-robbie-pink font-bold font-mono">$12.5K</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-robbie-blue" />
              <span className="text-white/80">Messages</span>
            </div>
            <span className="text-robbie-blue font-bold font-mono">23</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-robbie-orange" />
              <span className="text-white/80">Deals</span>
            </div>
            <span className="text-robbie-orange font-bold font-mono">5</span>
          </div>
        </div>

        {/* App Buttons */}
        <div className="flex-1 space-y-2">
          <h3 className="text-white/40 text-xs uppercase tracking-wider mb-3">Applications</h3>
          {apps.map((app) => {
            const Icon = app.icon;
            const isActive = activeApp === app.id;
            
            return (
              <button
                key={app.id}
                onClick={() => onAppChange(app.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${isActive 
                    ? `bg-${app.color}/20 border-${app.color} shadow-[0_0_20px_rgba(157,78,221,0.4)]` 
                    : 'bg-white/5 border-transparent hover:bg-white/10'
                  }
                  border
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? `text-${app.color}` : 'text-white/40'}`} />
                <span className={`font-mono ${isActive ? 'text-white font-bold' : 'text-white/60'}`}>
                  {app.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Settings */}
        <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <Settings className="w-4 h-4 text-white/60" />
            <span className="text-white/60 text-sm">Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <LogOut className="w-4 h-4 text-white/60" />
            <span className="text-white/60 text-sm">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
