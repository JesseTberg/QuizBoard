import { useState, FormEvent, useEffect } from 'react';
import { GameState } from '../types';
import socket from '../lib/socket';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Users, Monitor, Star } from 'lucide-react';

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

  const [wager, setWager] = useState<string>('');
  const [finalAnswer, setFinalAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    setIsSubmitted(false);
    if (gameState.status === 'final_question_wager') {
      setWager('');
    }
  }, [gameState.status]);

  const submitWager = (e: FormEvent) => {
    e.preventDefault();
    const wagerNum = parseInt(wager) || 0;
    socket.emit('submit-wager', { gameId: gameState.id, wager: wagerNum });
    setIsSubmitted(true);
  };

  const submitFinalAnswer = (e: FormEvent) => {
    e.preventDefault();
    socket.emit('submit-final-answer', { gameId: gameState.id, answer: finalAnswer });
    setIsSubmitted(true);
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
            <h1 className="game-title text-4xl">READY TO PLAY?</h1>
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
            {currentPlayer.score}
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

          {gameState.status === 'final_question_wager' && (
            <motion.div key="wager" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md card-surface p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-brand-accent">Final Question Wager</h2>
                <p className="text-brand-muted text-sm">Category: {gameState.finalQuestion.category}</p>
                <p className="text-xs text-brand-muted">Max Wager: {Math.max(0, currentPlayer.score)}</p>
              </div>
              {!isSubmitted ? (
                <form onSubmit={submitWager} className="space-y-4">
                  <input 
                    type="number"
                    value={wager}
                    onChange={(e) => setWager(e.target.value)}
                    min={0}
                    max={Math.max(0, currentPlayer.score)}
                    placeholder="0"
                    className="input-field w-full text-center text-3xl font-black"
                  />
                  <button type="submit" className="btn-accent w-full py-4 font-black italic uppercase">Submit Wager</button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <p className="text-brand-primary font-black italic animate-pulse">WAGER SUBMITTED</p>
                </div>
              )}
            </motion.div>
          )}

          {gameState.status === 'final_question_answer' && (
            <motion.div key="final-answer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md card-surface p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-brand-accent">Final Question Answer</h2>
                <p className="text-brand-muted text-sm">Category: {gameState.finalQuestion.category}</p>
              </div>
              {!isSubmitted ? (
                <form onSubmit={submitFinalAnswer} className="space-y-4">
                  <textarea 
                    value={finalAnswer}
                    onChange={(e) => setFinalAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="setup-textarea w-full text-center text-xl"
                    required
                  />
                  <button type="submit" className="btn-accent w-full py-4 font-black italic uppercase">Submit Answer</button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <p className="text-brand-primary font-black italic animate-pulse">ANSWER SUBMITTED</p>
                </div>
              )}
            </motion.div>
          )}
          {gameState.status === 'final_question_reveal' && (
            <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
              <div className="w-24 h-24 bg-brand-surface rounded-full flex items-center justify-center mx-auto border-2 border-brand-accent/30">
                <Star className="text-brand-accent" size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black italic tracking-tighter text-brand-accent uppercase">Final Results</h2>
                <p className="text-brand-muted">Check the board for the winner!</p>
              </div>
              {currentPlayer.isCorrect !== undefined && (
                <div className={`p-6 rounded-xl border-2 ${currentPlayer.isCorrect ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'}`}>
                  <p className="text-2xl font-black italic uppercase">
                    {currentPlayer.isCorrect ? 'Correct!' : 'Incorrect'}
                  </p>
                  <p className="text-brand-muted mt-2">
                    {currentPlayer.isCorrect ? '+' : '-'}{currentPlayer.wager} Points
                  </p>
                </div>
              )}
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
                  {player.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
