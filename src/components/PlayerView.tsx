import { useState, FormEvent } from 'react';
import { GameState } from '../types';
import socket from '../lib/socket';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Users, Monitor } from 'lucide-react';

interface PlayerViewProps {
  gameState: GameState;
}

export default function PlayerView({ gameState }: PlayerViewProps) {
  const [name, setName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const currentPlayer = socket.id ? gameState.players.find(p => p.id === socket.id) : null;

  const joinGame = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsJoining(true);
    socket.emit('join-game', { gameId: gameState.id, name: name.trim(), role: 'player' });
  };

  const buzzIn = () => {
    if (gameState.status !== 'question' || gameState.buzzedPlayerId) return;
    socket.emit('buzz', { gameId: gameState.id });
  };

  if (!currentPlayer) {
    return (
      <div className="app-container flex-center-col p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-surface p-8 w-full max-w-md space-y-8"
        >
          <div className="text-center-spacing">
            <Monitor className="w-12 h-12 text-brand-accent mx-auto" />
            <h1 className="jeopardy-title text-4xl">READY TO PLAY?</h1>
            <p className="text-brand-muted">Enter your name to join the session.</p>
          </div>
          <form onSubmit={joinGame} className="space-y-4">
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="input-field w-full text-lg py-4 text-center font-bold"
              maxLength={15}
              required
              autoFocus
            />
            <button 
              type="submit"
              disabled={isJoining}
              className="btn-primary w-full py-5 text-xl tracking-tighter italic"
            >
              {isJoining ? 'JOINING...' : 'JOIN GAME'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const isBuzzed = gameState.buzzedPlayerId === socket.id;
  const someoneElseBuzzed = gameState.buzzedPlayerId && gameState.buzzedPlayerId !== socket.id;
  const buzzerActive = gameState.status === 'question' && !gameState.buzzedPlayerId;

  return (
    <div className="player-container">
      {/* Header */}
      <div className="player-header">
        <div className="flex items-center gap-3">
          <div className="player-avatar">
            {currentPlayer.name[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold leading-none">{currentPlayer.name}</p>
            <p className="text-[10px] text-brand-muted uppercase tracking-widest mt-1">Contestant</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-brand-muted uppercase tracking-widest mb-1">Score</p>
          <p className={`text-2xl font-black font-mono leading-none ${currentPlayer.score >= 0 ? 'text-brand-accent' : 'text-red-500'}`}>
            ${currentPlayer.score}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="player-main">
        <AnimatePresence mode="wait">
          {gameState.status === 'lobby' && (
            <motion.div 
              key="lobby"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <div className="w-24 h-24 bg-brand-surface rounded-full flex items-center justify-center mx-auto border-2 border-brand-primary/30 animate-pulse">
                <Users className="text-brand-primary" size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black italic tracking-tighter">WAITING FOR HOST</h2>
                <p className="text-brand-muted">The game will begin shortly. Get ready!</p>
              </div>
            </motion.div>
          )}

          {gameState.status === 'playing' && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center space-y-6"
            >
              <div className="w-24 h-24 bg-brand-surface rounded-full flex items-center justify-center mx-auto border-2 border-brand-accent/30">
                <Monitor className="text-brand-accent" size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black italic tracking-tighter text-brand-accent">EYES ON THE BOARD</h2>
                <p className="text-brand-muted">A question is being selected...</p>
              </div>
            </motion.div>
          )}

          {(gameState.status === 'question' || gameState.status === 'buzzed') && (
            <motion.div 
              key="buzzer-area"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm"
            >
              <button 
                onClick={buzzIn}
                disabled={!buzzerActive}
                className={`
                  buzzer-button
                  ${isBuzzed ? 'buzzer-success' : 
                    someoneElseBuzzed ? 'buzzer-locked' :
                    buzzerActive ? 'buzzer-active' :
                    'buzzer-locked opacity-30'}
                `}
              >
                <Zap size={80} fill={isBuzzed ? 'white' : 'currentColor'} className={buzzerActive ? 'animate-pulse' : ''} />
                <span className="text-4xl font-black italic tracking-tighter uppercase">
                  {isBuzzed ? 'YOU!' : someoneElseBuzzed ? 'LOCKED' : buzzerActive ? 'BUZZ!' : 'WAIT'}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Leaderboard Footer */}
      <div className="player-footer">
        <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-4 text-center">Leaderboard</h3>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {gameState.players.sort((a,b) => b.score - a.score).map((player, idx) => (
            <div 
              key={player.id} 
              className={`
                player-leaderboard-item
                ${player.id === socket.id ? 'player-leaderboard-item-self' : 'player-leaderboard-item-other'}
              `}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-brand-muted">#{idx + 1}</span>
                <span className="font-bold text-sm truncate max-w-[80px]">{player.name}</span>
                <span className={`text-sm font-black ${player.score >= 0 ? 'text-brand-accent' : 'text-red-500'}`}>
                  ${player.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
