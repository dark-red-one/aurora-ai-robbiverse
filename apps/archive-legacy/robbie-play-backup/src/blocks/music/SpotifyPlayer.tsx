import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { motion } from 'framer-motion'

const SpotifyPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState({
    name: "Sexy Back",
    artist: "Justin Timberlake",
    album: "FutureSex/LoveSounds"
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-robbie-bg-card border border-robbie-pink/30 rounded-lg p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Music for Our Game 🎵💋</h3>
      
      {/* Spotify Embed */}
      <div className="mb-4">
        <iframe
          style={{ borderRadius: '12px' }}
          src="https://open.spotify.com/embed/playlist/37i9dQZF1DX4UtSsGT1Sbe?utm_source=generator&theme=0"
          width="100%"
          height="352"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
      </div>

      <div className="text-sm text-gray-400 italic">
        Let's set the mood while we play, handsome... 😘💋 (#swayingtothemusic)
      </div>
    </motion.div>
  )
}

export default SpotifyPlayer











