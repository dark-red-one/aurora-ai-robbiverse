import React, { useState, useEffect } from 'react';
import './OfficeBackgrounds.css';

interface BackgroundTheme {
  id: string;
  name: string;
  className: string;
  description: string;
  category: 'aurora' | 'testpilot' | 'revenue' | 'empire';
}

const backgroundThemes: BackgroundTheme[] = [
  {
    id: 'aurora-cyberpunk',
    name: 'Cyberpunk',
    className: 'office-bg-aurora-cyberpunk',
    description: 'Futuristic grid with neon accents',
    category: 'aurora'
  },
  {
    id: 'aurora-matrix',
    name: 'Matrix',
    className: 'office-bg-aurora-matrix',
    description: 'Classic green rain effect',
    category: 'aurora'
  },
  {
    id: 'aurora-neural',
    name: 'Neural',
    className: 'office-bg-aurora-neural',
    description: 'AI neural network visualization',
    category: 'aurora'
  },
  {
    id: 'testpilot-professional',
    name: 'Professional',
    className: 'office-bg-testpilot-professional',
    description: 'Clean corporate aesthetic',
    category: 'testpilot'
  },
  {
    id: 'testpilot-modern',
    name: 'Modern',
    className: 'office-bg-testpilot-modern',
    description: 'Sleek dark professional',
    category: 'testpilot'
  },
  {
    id: 'revenue-focused',
    name: 'Revenue',
    className: 'office-bg-revenue-focused',
    description: 'Money-making energy',
    category: 'revenue'
  },
  {
    id: 'ai-empire',
    name: 'AI Empire',
    className: 'office-bg-ai-empire',
    description: 'Full Aurora AI power',
    category: 'empire'
  }
];

interface OfficeBackgroundsProps {
  onThemeChange?: (theme: BackgroundTheme) => void;
  showSwitcher?: boolean;
  defaultTheme?: string;
}

const OfficeBackgrounds: React.FC<OfficeBackgroundsProps> = ({
  onThemeChange,
  showSwitcher = true,
  defaultTheme = 'aurora-cyberpunk'
}) => {
  const [currentTheme, setCurrentTheme] = useState<string>(defaultTheme);
  const [isVisible, setIsVisible] = useState(false);

  // Apply background theme to body
  useEffect(() => {
    const body = document.body;
    
    // Remove all existing background classes
    backgroundThemes.forEach(theme => {
      body.classList.remove(theme.className);
    });
    
    // Add current theme class
    const selectedTheme = backgroundThemes.find(t => t.id === currentTheme);
    if (selectedTheme) {
      body.classList.add(selectedTheme.className);
      onThemeChange?.(selectedTheme);
    }
  }, [currentTheme, onThemeChange]);

  // Create floating particles
  useEffect(() => {
    if (!showSwitcher) return;

    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 6 + 's';
      particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
      
      const particlesContainer = document.querySelector('.floating-particles') || 
        (() => {
          const container = document.createElement('div');
          container.className = 'floating-particles';
          document.body.appendChild(container);
          return container;
        })();
      
      particlesContainer.appendChild(particle);
      
      // Remove particle after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 6000);
    };

    // Create particles periodically
    const particleInterval = setInterval(createParticle, 2000);
    
    return () => clearInterval(particleInterval);
  }, [showSwitcher]);

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    const theme = backgroundThemes.find(t => t.id === themeId);
    if (theme) {
      onThemeChange?.(theme);
    }
  };

  const toggleSwitcher = () => {
    setIsVisible(!isVisible);
  };

  const currentThemeData = backgroundThemes.find(t => t.id === currentTheme);

  return (
    <>
      {showSwitcher && (
        <div className="background-switcher">
          <h4>🎨 Office Themes</h4>
          <button 
            onClick={toggleSwitcher}
            style={{
              width: '100%',
              background: 'var(--aurora-primary)',
              color: '#000',
              border: 'none',
              padding: '8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}
          >
            {isVisible ? 'Hide' : 'Show'} Themes
          </button>
          
          {isVisible && (
            <div className="background-options">
              {backgroundThemes.map(theme => (
                <div
                  key={theme.id}
                  className={`bg-option ${currentTheme === theme.id ? 'active' : ''}`}
                  onClick={() => handleThemeChange(theme.id)}
                  title={theme.description}
                >
                  {theme.name}
                </div>
              ))}
            </div>
          )}
          
          {currentThemeData && (
            <div style={{
              marginTop: '10px',
              padding: '8px',
              background: 'var(--aurora-darker)',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#ccc',
              textAlign: 'center'
            }}>
              {currentThemeData.description}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default OfficeBackgrounds;
