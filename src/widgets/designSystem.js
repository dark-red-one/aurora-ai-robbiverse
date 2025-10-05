// TestPilot Design System - Extracted and Replicated
// Based on analysis of testpilotcpg.com

const TestPilotDesign = {
  // Color Palette - Extracted from TestPilot website
  colors: {
    primary: {
      blue: '#0066CC',      // Main brand blue
      darkBlue: '#004499',  // Darker blue for headers
      lightBlue: '#E6F2FF', // Light blue backgrounds
    },
    secondary: {
      orange: '#FF6B35',    // Accent orange
      darkOrange: '#E55A2B', // Darker orange
      lightOrange: '#FFF0E6', // Light orange backgrounds
    },
    neutral: {
      black: '#1A1A1A',     // Primary text
      darkGray: '#4A4A4A',  // Secondary text
      mediumGray: '#8A8A8A', // Tertiary text
      lightGray: '#F5F5F5', // Backgrounds
      white: '#FFFFFF',     // Pure white
    },
    status: {
      success: '#00C851',   // Green for success states
      warning: '#FFB800',   // Yellow for warnings
      error: '#FF4444',     // Red for errors
      info: '#0066CC',      // Blue for info
    }
  },

  // Typography - Based on TestPilot's font choices
  typography: {
    fontFamily: {
      primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, monospace'
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },

  // Spacing System
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px'
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  // TestPilot-specific components
  components: {
    button: {
      primary: `
        background: linear-gradient(135deg, #0066CC 0%, #004499 100%);
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 6px -1px rgba(0, 102, 204, 0.3);
      `,
      secondary: `
        background: white;
        color: #0066CC;
        border: 2px solid #0066CC;
        border-radius: 0.5rem;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
      `,
      accent: `
        background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 6px -1px rgba(255, 107, 53, 0.3);
      `
    },
    card: `
      background: white;
      border-radius: 1rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      padding: 1.5rem;
      border: 1px solid #F5F5F5;
    `,
    input: `
      background: white;
      border: 2px solid #E5E5E5;
      border-radius: 0.5rem;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      transition: border-color 0.2s ease;
      width: 100%;
    `,
    constructionZone: `
      background: linear-gradient(135deg, #FFF0E6 0%, #E6F2FF 100%);
      border: 2px dashed #FF6B35;
      border-radius: 1rem;
      padding: 2rem;
      text-align: center;
      position: relative;
      overflow: hidden;
    `
  },

  // Construction Zone specific styles
  construction: {
    background: 'linear-gradient(135deg, #FFF0E6 0%, #E6F2FF 100%)',
    border: '2px dashed #FF6B35',
    icon: '🚧',
    text: 'Construction Zone',
    subtext: 'Building something amazing...',
    animation: 'pulse 2s infinite'
  },

  // Generate CSS variables
  generateCSSVariables: function() {
    const cssVars = [];
    
    // Colors
    Object.entries(this.colors).forEach(([category, colors]) => {
      Object.entries(colors).forEach(([name, value]) => {
        cssVars.push(`--tp-${category}-${name}: ${value};`);
      });
    });

    // Typography
    Object.entries(this.typography.fontSize).forEach(([size, value]) => {
      cssVars.push(`--tp-font-size-${size}: ${value};`);
    });

    // Spacing
    Object.entries(this.spacing).forEach(([size, value]) => {
      cssVars.push(`--tp-spacing-${size}: ${value};`);
    });

    return cssVars.join('\n');
  },

  // Generate complete CSS
  generateCSS: function() {
    return `
      :root {
        ${this.generateCSSVariables()}
      }

      * {
        box-sizing: border-box;
      }

      body {
        font-family: ${this.typography.fontFamily.primary};
        font-size: ${this.typography.fontSize.base};
        line-height: ${this.typography.lineHeight.normal};
        color: ${this.colors.neutral.black};
        background-color: ${this.colors.neutral.lightGray};
        margin: 0;
        padding: 0;
      }

      .tp-button-primary {
        ${this.components.button.primary}
      }

      .tp-button-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px -3px rgba(0, 102, 204, 0.4);
      }

      .tp-button-secondary {
        ${this.components.button.secondary}
      }

      .tp-button-secondary:hover {
        background: #0066CC;
        color: white;
        transform: translateY(-2px);
      }

      .tp-button-accent {
        ${this.components.button.accent}
      }

      .tp-button-accent:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px -3px rgba(255, 107, 53, 0.4);
      }

      .tp-card {
        ${this.components.card}
      }

      .tp-input {
        ${this.components.input}
      }

      .tp-input:focus {
        outline: none;
        border-color: #0066CC;
        box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
      }

      .tp-construction-zone {
        ${this.components.constructionZone}
      }

      .tp-construction-zone::before {
        content: '🚧';
        font-size: 3rem;
        display: block;
        margin-bottom: 1rem;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      .tp-huddle-room {
        background: white;
        border-radius: 1rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        height: 600px;
        display: flex;
        flex-direction: column;
      }

      .tp-huddle-header {
        background: linear-gradient(135deg, #0066CC 0%, #004499 100%);
        color: white;
        padding: 1rem 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .tp-huddle-messages {
        flex: 1;
        padding: 1rem;
        overflow-y: auto;
        background: #FAFAFA;
      }

      .tp-huddle-input {
        padding: 1rem 1.5rem;
        background: white;
        border-top: 1px solid #E5E5E5;
        display: flex;
        gap: 0.5rem;
      }

      .tp-message {
        margin-bottom: 1rem;
        padding: 0.75rem 1rem;
        border-radius: 0.75rem;
        max-width: 80%;
      }

      .tp-message.user {
        background: #0066CC;
        color: white;
        margin-left: auto;
        text-align: right;
      }

      .tp-message.robbie {
        background: white;
        color: #1A1A1A;
        border: 1px solid #E5E5E5;
      }

      .tp-message.system {
        background: #FFF0E6;
        color: #E55A2B;
        text-align: center;
        font-style: italic;
        border: 1px dashed #FF6B35;
      }

      .tp-online-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
      }

      .tp-online-dot {
        width: 8px;
        height: 8px;
        background: #00C851;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }

      .tp-construction-banner {
        background: linear-gradient(135deg, #FFF0E6 0%, #E6F2FF 100%);
        border: 2px dashed #FF6B35;
        border-radius: 0.5rem;
        padding: 1rem;
        margin: 1rem 0;
        text-align: center;
        position: relative;
        overflow: hidden;
      }

      .tp-construction-banner::before {
        content: '🚧';
        font-size: 1.5rem;
        margin-right: 0.5rem;
      }

      .tp-progress-bar {
        width: 100%;
        height: 4px;
        background: #E5E5E5;
        border-radius: 2px;
        overflow: hidden;
        margin: 0.5rem 0;
      }

      .tp-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #0066CC 0%, #FF6B35 100%);
        border-radius: 2px;
        animation: progress 3s ease-in-out infinite;
      }

      @keyframes progress {
        0% { width: 0%; }
        50% { width: 70%; }
        100% { width: 100%; }
      }
    `;
  }
};

module.exports = TestPilotDesign;
