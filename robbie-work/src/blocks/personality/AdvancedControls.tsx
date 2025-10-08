import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import React from 'react';
import { useRobbieStore } from '../../stores/robbieStore'

/**
 * AdvancedControls - Robbie V3 Power Controls
 * 
 * Genghis ↔ Gandhi: Outreach aggressiveness (0-100)
 * Cocktail ↔ Lightning: Energy/scheduling intensity (0-100)
 */
export const AdvancedControls: React.FC = () => {
  const {
    genghisGandhiIntensity,
    cocktailLightningEnergy,
    setGenghisGandhiIntensity,
    setCocktailLightningEnergy,
    getAggressivenessLabel,
    getEnergyLabel,
  } = useRobbieStore();

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-robbie-dark via-robbie-darker to-black rounded-lg border border-robbie-accent/20">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-robbie-accent mb-2">
          ⚡ Advanced Power Controls
        </h3>
        <p className="text-sm text-robbie-light/60">
          Fine-tune Robbie's intensity and energy levels
        </p>
      </div>

      {/* Genghis ↔ Gandhi Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-robbie-light">
            Outreach Aggressiveness
          </label>
          <span className="text-xs px-2 py-1 bg-robbie-accent/20 text-robbie-accent rounded-full">
            {getAggressivenessLabel()}
          </span>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            value={genghisGandhiIntensity}
            onChange={(e) => setGenghisGandhiIntensity(Number(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
          <div className="flex justify-between text-xs text-robbie-light/50 mt-1">
            <span>🕊️ Gandhi</span>
            <span>⚖️ Balanced</span>
            <span>⚔️ Genghis</span>
          </div>
        </div>

        <div className="text-xs text-robbie-light/70 bg-robbie-darker/50 p-3 rounded border border-robbie-accent/10">
          <strong>Impact:</strong>
          {genghisGandhiIntensity < 20 && (
            <span> Minimal touches (1/week max), very cautious, gentle follow-ups</span>
          )}
          {genghisGandhiIntensity >= 20 && genghisGandhiIntensity < 40 && (
            <span> Conservative approach (2-3/week), thoughtful outreach</span>
          )}
          {genghisGandhiIntensity >= 40 && genghisGandhiIntensity < 60 && (
            <span> Balanced cadence (3-5/week), normal urgency</span>
          )}
          {genghisGandhiIntensity >= 60 && genghisGandhiIntensity < 80 && (
            <span> Aggressive push (5-10/week), higher urgency, more persistent</span>
          )}
          {genghisGandhiIntensity >= 80 && (
            <span> Maximum intensity (up to 20/day), push hard for responses</span>
          )}
        </div>
      </div>

      {/* Cocktail ↔ Lightning Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-robbie-light">
            Energy & Scheduling Intensity
          </label>
          <span className="text-xs px-2 py-1 bg-robbie-accent/20 text-robbie-accent rounded-full">
            {getEnergyLabel()}
          </span>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            value={cocktailLightningEnergy}
            onChange={(e) => setCocktailLightningEnergy(Number(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-500 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
          <div className="flex justify-between text-xs text-robbie-light/50 mt-1">
            <span>🍹 Cocktail</span>
            <span>⚖️ Balanced</span>
            <span>⚡ Lightning</span>
          </div>
        </div>

        <div className="text-xs text-robbie-light/70 bg-robbie-darker/50 p-3 rounded border border-robbie-accent/10">
          <strong>Impact:</strong>
          {cocktailLightningEnergy < 20 && (
            <span> Relaxed pace, more breaks, light schedule, plenty of downtime</span>
          )}
          {cocktailLightningEnergy >= 20 && cocktailLightningEnergy < 40 && (
            <span> Easy pace, regular breaks, comfortable schedule</span>
          )}
          {cocktailLightningEnergy >= 40 && cocktailLightningEnergy < 60 && (
            <span> Balanced schedule, normal focus blocks, moderate intensity</span>
          )}
          {cocktailLightningEnergy >= 60 && cocktailLightningEnergy < 80 && (
            <span> High energy, packed schedule, more focus blocks, push for output</span>
          )}
          {cocktailLightningEnergy >= 80 && (
            <span> Maximum intensity, tightly packed, all-out productivity mode</span>
          )}
        </div>
      </div>

      {/* Quick Presets */}
      <div className="pt-4 border-t border-robbie-accent/10">
        <p className="text-xs text-robbie-light/50 mb-2">Quick Presets:</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              setGenghisGandhiIntensity(10);
              setCocktailLightningEnergy(10);
            }}
            className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs rounded transition-colors"
          >
            😌 Zen Mode
          </button>
          <button
            onClick={() => {
              setGenghisGandhiIntensity(50);
              setCocktailLightningEnergy(50);
            }}
            className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-xs rounded transition-colors"
          >
            ⚖️ Balanced
          </button>
          <button
            onClick={() => {
              setGenghisGandhiIntensity(90);
              setCocktailLightningEnergy(90);
            }}
            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded transition-colors"
          >
            🔥 Beast Mode
          </button>
        </div>
      </div>

      {/* Real-time Sync Indicator */}
      <div className="text-center text-xs text-robbie-light/40">
        <span className="inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          Synced across all systems
        </span>
      </div>
    </div>
  );
};

export default AdvancedControls;
