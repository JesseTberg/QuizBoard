import { useState, FormEvent, useEffect } from 'react';
import { GameState } from '../types';
import socket from '../lib/socket';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Users, Monitor, Star } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/TextArea';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';

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
      <main className="app-container flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 space-y-8 shadow-2xl">
            <header className="text-center space-y-4">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <Monitor className="w-10 h-10 text-brand-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="game-title text-4xl">READY?</h1>
                <p className="text-brand-muted uppercase text-[10px] font-black tracking-[0.2em]">Enter your alias to join the match</p>
              </div>
            </header>
            <form onSubmit={joinGame} className="space-y-6">
              <Input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alias"
                className="w-full text-2xl py-6 text-center font-black italic uppercase tracking-tighter"
                maxLength={15}
                required
                autoFocus
              />
              <Button 
                type="submit"
                variant="primary"
                size="lg"
                disabled={isJoining}
                className="w-full py-8 text-2xl italic tracking-tighter"
              >
                {isJoining ? 'JOINING...' : 'JOIN ARENA'}
              </Button>
            </form>
          </Card>
        </motion.div>
      </main>
    );
  }

  const isBuzzed = gameState.buzzedPlayerId === socket.id;
  const someoneElseBuzzed = gameState.buzzedPlayerId && gameState.buzzedPlayerId !== socket.id;
  const buzzerActive = gameState.status === 'question' && !gameState.buzzedPlayerId;

  return (
    <main className="player-container flex flex-col min-h-screen">
      {/* Header */}
      <header className="player-header p-4 bg-brand-surface border-b border-white/5 sticky top-0 z-10 backdrop-blur-md bg-opacity-80">
        <div className="max-width-container flex justify-between items-center px-4">
          <section className="flex items-center gap-3">
            <div className="player-avatar w-12 h-12">
              {currentPlayer.name[0].toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="font-black italic uppercase tracking-tighter text-lg leading-none">{currentPlayer.name}</span>
              <span className="text-[9px] text-brand-muted uppercase tracking-[0.2em] font-black mt-1">Contestant</span>
            </div>
          </section>
          <section className="text-right">
            <span className="text-[9px] text-brand-muted uppercase tracking-[0.2em] font-black mb-1 block">Current Score</span>
            <span className={cn(
              "text-3xl font-black italic tracking-tighter leading-none",
              currentPlayer.score >= 0 ? 'text-brand-accent' : 'text-red-500'
            )}>
              {currentPlayer.score}
            </span>
          </section>
        </div>
      </header>

      {/* Main Action Area */}
      <section className="player-main flex-1 flex flex-col items-center justify-center p-6 gap-12 max-width-container">
        <AnimatePresence mode="wait">
          {gameState.status === 'lobby' && (
            <motion.div 
              key="lobby"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <div className="w-28 h-28 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto border-2 border-brand-primary/30 animate-pulse">
                <Users className="text-brand-primary" size={48} />
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">WARMING UP</h1>
                <p className="text-brand-muted uppercase text-xs tracking-[0.2em] font-black">Waiting for host to kick off the show</p>
              </div>
            </motion.div>
          )}

          {gameState.status === 'playing' && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center space-y-6"
            >
              <div className="w-28 h-28 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto border-2 border-brand-accent/30 animate-bounce">
                <Monitor className="text-brand-accent" size={48} />
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-black italic tracking-tighter text-brand-accent uppercase leading-none">EYES ON BOARD</h1>
                <p className="text-brand-muted uppercase text-xs tracking-[0.2em] font-black">Choosing the next challenge...</p>
              </div>
            </motion.div>
          )}

          {(gameState.status === 'question' || gameState.status === 'buzzed') && (
            <motion.div 
              key="buzzer-area"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 2 }}
              className="w-full max-w-[280px] md:max-w-[500px] aspect-square"
            >
              <button 
                onClick={buzzIn}
                disabled={!buzzerActive}
                className={cn(
                  "buzzer-button h-full w-full shadow-2xl",
                  isBuzzed ? 'buzzer-success' : 
                    someoneElseBuzzed ? 'buzzer-locked' :
                    buzzerActive ? 'buzzer-active' :
                    'buzzer-locked opacity-30 h-full w-full'
                )}
              >
                <Zap size={100} fill={isBuzzed ? 'white' : 'currentColor'} className={cn(buzzerActive && 'animate-pulse')} />
                <span className="text-5xl font-extrabold italic tracking-tighter uppercase mt-4">
                  {isBuzzed ? 'YOU!' : someoneElseBuzzed ? 'LOCKED' : buzzerActive ? 'BUZZ!' : 'WAIT'}
                </span>
              </button>
            </motion.div>
          )}

          {gameState.status === 'final_question_wager' && (
            <motion.div key="wager" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
              <Card className="p-10 flex flex-col gap-8 shadow-2xl border-t-8 border-brand-accent">
                <header className="text-center space-y-3">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter text-brand-accent leading-none">FINAL WAGER</h2>
                  <div className="bg-brand-surface/50 p-2 rounded-xl">
                    <p className="text-[10px] text-brand-muted uppercase tracking-[0.2em] font-black mb-1">Category</p>
                    <p className="font-black italic uppercase text-lg">{gameState.finalQuestion.category}</p>
                  </div>
                  <p className="text-xs text-brand-muted font-bold tracking-widest uppercase pt-2">Max Available: {Math.max(0, currentPlayer.score)}</p>
                </header>
                {!isSubmitted ? (
                  <form onSubmit={submitWager} className="flex flex-col gap-6">
                    <Input 
                      type="number"
                      value={wager}
                      onChange={(e) => setWager(e.target.value)}
                      min={0}
                      max={Math.max(0, currentPlayer.score)}
                      placeholder="0"
                      className="w-full text-center text-5xl font-black italic bg-black/20 py-8 border-brand-primary"
                    />
                    <Button type="submit" variant="accent" size="lg" className="w-full py-6 text-xl">LOCK IN WAGER</Button>
                  </form>
                ) : (
                  <div className="text-center py-10">
                    <div className="inline-flex items-center gap-2 text-brand-primary font-black italic uppercase tracking-widest text-xl animate-pulse">
                      <Zap size={20} fill="currentColor" /> WAGER RECEIVED
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {gameState.status === 'final_question_answer' && (
            <motion.div key="final-answer" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
              <Card className="p-10 flex flex-col gap-8 shadow-2xl border-t-8 border-brand-primary">
                <header className="text-center space-y-3">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter text-brand-primary leading-none">FINAL RESPONSE</h2>
                  <div className="bg-brand-surface/50 p-2 rounded-xl">
                    <p className="text-[10px] text-brand-muted uppercase tracking-[0.2em] font-black mb-1">Category</p>
                    <p className="font-black italic uppercase text-lg">{gameState.finalQuestion.category}</p>
                  </div>
                </header>
                {!isSubmitted ? (
                  <form onSubmit={submitFinalAnswer} className="flex flex-col gap-6">
                    <Textarea 
                      value={finalAnswer}
                      onChange={(e) => setFinalAnswer(e.target.value)}
                      placeholder="Write your definitive answer..."
                      className="w-full text-center text-xl h-40 italic font-medium p-6 bg-black/20"
                      required
                    />
                    <Button type="submit" variant="primary" size="lg" className="w-full py-6 text-xl">SUBMIT RESPONSE</Button>
                  </form>
                ) : (
                  <div className="text-center py-10">
                    <div className="inline-flex items-center gap-2 text-brand-primary font-black italic uppercase tracking-widest text-xl animate-pulse">
                      <Zap size={20} fill="currentColor" /> RESPONSE LOGGED
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {gameState.status === 'final_question_reveal' && (
            <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8 text-center max-w-sm w-full">
              <div className="w-28 h-28 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto border-2 border-brand-accent/30 shadow-[0_0_80px_rgba(234,179,8,0.2)]">
                <Star className="text-brand-accent" size={56} />
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-black italic tracking-tighter text-brand-accent uppercase leading-none">FINAL REVEAL</h1>
                <p className="text-brand-muted uppercase text-xs tracking-[0.2em] font-black">Check the main board for results!</p>
              </div>
              {currentPlayer.isCorrect !== undefined && (
                <article className={cn(
                  "p-8 rounded-3xl border-4 transition-all shadow-2xl scale-110 mt-6",
                  currentPlayer.isCorrect 
                    ? 'bg-green-600/20 border-green-500 text-green-400' 
                    : 'bg-red-600/20 border-red-500 text-red-400'
                )}>
                  <p className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-4">
                    {currentPlayer.isCorrect ? 'VICTORY' : 'DEFEAT'}
                  </p>
                  <p className="text-white/80 uppercase text-[10px] font-black tracking-widest">
                    {currentPlayer.isCorrect ? 'PLUS' : 'MINUS'} {currentPlayer.wager} POINTS
                  </p>
                </article>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Leaderboard Footer */}
      <footer className="p-6 bg-brand-surface border-t border-white/5 pb-8 backdrop-blur-md">
        <div className="max-width-container">
          <header className="flex items-center gap-2 justify-center mb-6">
            <Users size={12} className="text-brand-muted" />
            <span className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] leading-none">Standings</span>
          </header>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar-hidden">
            {gameState.players.sort((a,b) => b.score - a.score).map((player, idx) => (
              <Card 
                key={player.id} 
                className={cn(
                  "shrink-0 min-w-[140px] p-4 flex flex-col gap-2 transition-all",
                  player.id === socket.id ? 'bg-brand-primary/20 border-brand-primary border-2 -translate-y-1' : 'bg-slate-800/40 border-slate-700/50 grayscale-[0.5]'
                )}
              >
                <header className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-brand-muted">#{idx + 1}</span>
                  {player.id === socket.id && <Zap size={10} className="text-brand-primary fill-brand-primary animate-pulse" />}
                </header>
                <div className="flex flex-col gap-1">
                  <span className="font-black italic uppercase tracking-tighter text-sm truncate">{player.name}</span>
                  <span className={cn(
                    "font-mono font-black text-lg leading-none",
                    player.score >= 0 ? 'text-brand-accent' : 'text-red-500'
                  )}>
                    {player.score}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
