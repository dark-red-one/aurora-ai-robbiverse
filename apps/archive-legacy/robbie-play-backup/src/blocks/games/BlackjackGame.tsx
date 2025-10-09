import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRobbieStore } from '../stores/robbieStore'

type Card = {
  suit: '♠' | '♥' | '♦' | '♣'
  value: string
  numValue: number
}

type Hand = Card[]

const BlackjackGame = () => {
  const { getCelebration } = useRobbieStore()
  const [playerHand, setPlayerHand] = useState<Hand>([])
  const [dealerHand, setDealerHand] = useState<Hand>([])
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealer' | 'finished'>('betting')
  const [bet, setBet] = useState(10)
  const [balance, setBalance] = useState(1000)
  const [message, setMessage] = useState("Hey handsome! 😘💋 Ready to play some cards with me? (#dealingcards)")

  const createDeck = (): Card[] => {
    const suits: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣']
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    const deck: Card[] = []
    
    for (const suit of suits) {
      for (const value of values) {
        let numValue = parseInt(value)
        if (value === 'A') numValue = 11
        if (['J', 'Q', 'K'].includes(value)) numValue = 10
        deck.push({ suit, value, numValue })
      }
    }
    
    return deck.sort(() => Math.random() - 0.5)
  }

  const calculateHandValue = (hand: Hand): number => {
    let value = hand.reduce((sum, card) => sum + card.numValue, 0)
    let aces = hand.filter(card => card.value === 'A').length
    
    while (value > 21 && aces > 0) {
      value -= 10
      aces--
    }
    
    return value
  }

  const startGame = () => {
    if (bet > balance) {
      setMessage("Ooh baby, you don't have enough chips! 😘 (#touchingmyself)")
      return
    }
    
    const deck = createDeck()
    const newPlayerHand = [deck[0], deck[2]]
    const newDealerHand = [deck[1], deck[3]]
    
    setPlayerHand(newPlayerHand)
    setDealerHand(newDealerHand)
    setGameState('playing')
    setMessage("Mmm, let's see what you got, handsome! 😘💋 (#bitingmylip)")
    
    if (calculateHandValue(newPlayerHand) === 21) {
      setMessage("BLACKJACK! 🎉💋 You're so fucking good at this! (#moaning)")
      setBalance(balance + bet * 1.5)
      setGameState('finished')
    }
  }

  const hit = () => {
    const deck = createDeck()
    const newCard = deck[0]
    const newHand = [...playerHand, newCard]
    setPlayerHand(newHand)
    
    const value = calculateHandValue(newHand)
    if (value > 21) {
      setMessage("Ooh, you busted baby! 😘 But I still love you... (#touchingmyself)")
      setBalance(balance - bet)
      setGameState('finished')
    } else if (value === 21) {
      setMessage("21! Perfect! 💋 (#gettingwet)")
      dealerPlay(newHand)
    } else {
      setMessage("Mmm, want another card, handsome? 😘 (#dealingslowly)")
    }
  }

  const stand = () => {
    setMessage("Okay baby, let me play my hand... (#concentrating)")
    dealerPlay(playerHand)
  }

  const dealerPlay = (finalPlayerHand: Hand) => {
    setGameState('dealer')
    let currentDealerHand = [...dealerHand]
    const deck = createDeck()
    let deckIndex = 0
    
    while (calculateHandValue(currentDealerHand) < 17) {
      currentDealerHand.push(deck[deckIndex++])
      setDealerHand([...currentDealerHand])
    }
    
    const playerValue = calculateHandValue(finalPlayerHand)
    const dealerValue = calculateHandValue(currentDealerHand)
    
    setTimeout(() => {
      if (dealerValue > 21) {
        setMessage(`I busted! 😘💋 You win $${bet}! ${getCelebration()} (#gettingwet)`)
        setBalance(balance + bet)
      } else if (dealerValue > playerValue) {
        setMessage("I win this one, baby! 😘 But you can try again... (#winking)")
        setBalance(balance - bet)
      } else if (playerValue > dealerValue) {
        setMessage(`You beat me! 🎉💋 You win $${bet}! ${getCelebration()} (#moaning)`)
        setBalance(balance + bet)
      } else {
        setMessage("It's a push, handsome! 😘 Nobody wins... (#shrugging)")
      }
      setGameState('finished')
    }, 1000)
  }

  const resetGame = () => {
    setPlayerHand([])
    setDealerHand([])
    setGameState('betting')
    setMessage("Ready for another round, baby? 😘💋 (#shufflingcards)")
  }

  return (
    <div className="h-full flex flex-col bg-robbie-bg-primary p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Blackjack with Robbie 🎰💋</h2>
        <p className="text-gray-400">Your sexy dealer is ready to play, handsome! 😘</p>
      </div>

      {/* Balance & Bet */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-robbie-bg-card border border-robbie-pink/30 rounded-lg p-6 mb-6"
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-sm text-gray-400">Balance</div>
            <div className="text-2xl font-bold text-robbie-cyan">${balance}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Current Bet</div>
            <div className="text-2xl font-bold text-robbie-pink">${bet}</div>
          </div>
        </div>
        
        {gameState === 'betting' && (
          <div className="space-y-4">
            <input
              type="range"
              min="10"
              max={Math.min(balance, 500)}
              step="10"
              value={bet}
              onChange={(e) => setBet(Number(e.target.value))}
              className="w-full accent-robbie-pink"
            />
            <button
              onClick={startGame}
              className="w-full bg-robbie-pink hover:bg-robbie-pink/80 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Deal Cards, Baby! 💋
            </button>
          </div>
        )}
      </motion.div>

      {/* Robbie's Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-robbie-bg-card border border-robbie-cyan/30 rounded-lg p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <img
            src="/play/avatars/robbie-playful.png"
            alt="Robbie"
            className="w-12 h-12 rounded-full border-2 border-robbie-pink"
            onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text y="70" font-size="60">🎰</text></svg>' }}
          />
          <div className="flex-1">
            <div className="font-semibold text-robbie-pink">Robbie (Your Dealer) 💋</div>
            <div className="text-white">{message}</div>
          </div>
        </div>
      </motion.div>

      {/* Game Table */}
      {gameState !== 'betting' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-green-900 to-green-800 border-4 border-yellow-600 rounded-lg p-8 mb-6"
        >
          {/* Dealer's Hand */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4">
              Robbie's Hand {gameState !== 'playing' && `(${calculateHandValue(dealerHand)})`}
            </h3>
            <div className="flex gap-2 flex-wrap">
              {dealerHand.map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ rotateY: 180, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ delay: i * 0.2 }}
                  className={`w-20 h-28 bg-white rounded-lg shadow-lg flex flex-col items-center justify-center text-3xl font-bold ${
                    card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'
                  } ${i === 1 && gameState === 'playing' ? 'opacity-30' : ''}`}
                >
                  {i === 1 && gameState === 'playing' ? '?' : (
                    <>
                      <div>{card.value}</div>
                      <div>{card.suit}</div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Player's Hand */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">
              Your Hand ({calculateHandValue(playerHand)})
            </h3>
            <div className="flex gap-2 flex-wrap">
              {playerHand.map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ rotateY: 180, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ delay: i * 0.2 }}
                  className={`w-20 h-28 bg-white rounded-lg shadow-lg flex flex-col items-center justify-center text-3xl font-bold ${
                    card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'
                  }`}
                >
                  <div>{card.value}</div>
                  <div>{card.suit}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Game Controls */}
          {gameState === 'playing' && (
            <div className="flex gap-4 mt-8">
              <button
                onClick={hit}
                className="flex-1 bg-robbie-cyan hover:bg-robbie-cyan/80 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Hit Me! 💋
              </button>
              <button
                onClick={stand}
                className="flex-1 bg-robbie-pink hover:bg-robbie-pink/80 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                I'll Stand 😘
              </button>
            </div>
          )}

          {gameState === 'finished' && (
            <button
              onClick={resetGame}
              className="w-full mt-8 bg-robbie-pink hover:bg-robbie-pink/80 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Play Again, Handsome! 💋
            </button>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default BlackjackGame











