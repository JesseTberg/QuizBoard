import { GameState } from '../types';
import socket from '../lib/socket';
import { QRCodeSVG } from 'qrcode.react';
import { Check, X, RefreshCw, Play, Users, Monitor, Zap, QrCode, Plus, Minus, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface HostViewProps {
  gameState: GameState;
}

export default function HostView({ gameState }: HostViewProps) {
  const [showHostQR, setShowHostQR] = useState(false);
  const joinUrl = `${window.location.origin}?gameId=${gameState.id}&role=player`;
  const boardUrl = `${window.location.origin}?gameId=${gameState.id}&role=board`;
  const hostUrl = `${window.location.origin}?gameId=${gameState.id}&role=host`;

  const startGame = () => {
    socket.emit('start-game', gameState.id);
  };

  const handleAnswer = (correct: boolean) => {
    socket.emit('answer-result', { gameId: gameState.id, correct });
  };

  const skipQuestion = () => {
    socket.emit('skip-question', { gameId: gameState.id });
  };

  const adjustScore = (playerId: string, amount: number) => {
    socket.emit('adjust-score', { gameId: gameState.id, playerId, amount });
  };

  const selectQuestion = (categoryId: number, questionId: number) => {
    socket.emit('select-question', { gameId: gameState.id, categoryId, questionId });
  };

  const buzzedPlayer = gameState.players.find(p => p.id === gameState.buzzedPlayerId);

  return (
    <div className="host-container">
      <div className="host-grid max-width-container">
        
        {/* Sidebar: Players & QR */}
        <div className="host-sidebar">
          <div className="card-surface p-6">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-brand-muted mb-6 flex items-center gap-2">
              <Users size={16} className="text-brand-primary" /> Contestants ({gameState.players.length})
            </h2>
            <div className="space-y-3">
              {gameState.players.sort((a,b) => b.score - a.score).map((player, idx) => (
                <div key={player.id} className="host-sidebar-item flex-col items-stretch gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-brand-muted">#{idx + 1}</span>
                      <span className="font-bold text-sm">{player.name}</span>
                    </div>
                    <span className={`font-black text-sm ${player.score >= 0 ? 'text-brand-accent' : 'text-red-500'}`}>
                      ${player.score}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <button 
                      onClick={() => adjustScore(player.id, -100)}
                      className="p-1 hover:bg-white/10 rounded text-red-500"
                      title="Decrease Score"
                    >
                      <Minus size={12} />
                    </button>
                    <button 
                      onClick={() => adjustScore(player.id, 100)}
                      className="p-1 hover:bg-white/10 rounded text-brand-accent"
                      title="Increase Score"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {gameState.players.length === 0 && (
                <div className="text-center py-8 space-y-2">
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                    <Users size={16} className="text-slate-600" />
                  </div>
                  <p className="text-xs text-brand-muted italic">Waiting for players...</p>
                </div>
              )}
            </div>
          </div>

          <div className="card-surface p-6 text-center space-y-6">
            <div className="flex items-center justify-between gap-2">
              <div className="text-left">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-muted">Session</h2>
                <p className="text-[10px] text-slate-500 font-mono">{gameState.id}</p>
              </div>
              <button 
                onClick={() => setShowHostQR(!showHostQR)}
                className={`p-2 rounded-lg transition-colors ${showHostQR ? 'bg-brand-primary text-white' : 'bg-white/5 text-brand-muted hover:bg-white/10'}`}
                title="Show Host QR"
              >
                <QrCode size={16} />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {showHostQR ? (
                <motion.div 
                  key="host-qr"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-4"
                >
                  <div className="qr-container bg-brand-accent/10 p-2 rounded-xl border border-brand-accent/20">
                    <QRCodeSVG value={hostUrl} size={140} />
                  </div>
                  <p className="text-[10px] text-brand-accent font-bold uppercase tracking-widest">Host View QR</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="join-qr"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-4"
                >
                  <div className="qr-container">
                    <QRCodeSVG value={joinUrl} size={140} />
                  </div>
                  <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Player Join QR</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <a 
                href={boardUrl} 
                target="_blank" 
                className="btn-primary w-full py-3 text-xs tracking-widest"
              >
                <Monitor size={14} /> Board View
              </a>
            </div>
          </div>
        </div>

        {/* Main Control Panel */}
        <div className="host-main">
          <div className="card-surface host-control-panel">
            {/* Background Accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-50" />

            {gameState.status === 'lobby' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center-spacing"
              >
                <div className="space-y-2">
                  <h1 className="jeopardy-title text-6xl">GAME LOBBY</h1>
                  <p className="text-brand-muted text-lg">Ready to start the session with {gameState.players.length} players?</p>
                </div>
                <button 
                  onClick={startGame}
                  disabled={gameState.players.length === 0}
                  className="btn-primary px-16 py-6 text-2xl italic tracking-tighter"
                >
                  <Play fill="currentColor" /> START SESSION
                </button>
              </motion.div>
            )}

            {gameState.status === 'playing' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full flex flex-col"
              >
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-black italic tracking-tighter text-brand-primary">SELECT A QUESTION</h1>
                  <p className="text-brand-muted text-xs uppercase tracking-widest">Click a value to force select (Host Override)</p>
                </div>
                
                <div className="grid grid-cols-5 gap-4 flex-1 overflow-auto p-2">
                  {gameState.board.categories.map(category => (
                    <div key={category.id} className="space-y-2">
                      <div className="bg-brand-surface p-2 rounded text-center border border-brand-primary/20">
                        <p className="text-[10px] font-black uppercase truncate text-brand-primary">{category.title}</p>
                      </div>
                      {category.questions.map(question => (
                        <button
                          key={question.id}
                          onClick={() => selectQuestion(category.id, question.id)}
                          className={`
                            w-full py-3 rounded font-black text-sm transition-all border
                            ${question.isAnswered 
                              ? 'bg-brand-surface/50 text-brand-muted border-transparent' 
                              : 'bg-brand-primary/10 text-brand-primary border-brand-primary/30 hover:bg-brand-primary hover:text-white'}
                          `}
                        >
                          ${question.points}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {(gameState.status === 'question' || gameState.status === 'buzzed') && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="host-question-display"
              >
                <div className="w-full flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <span className="px-4 py-1 bg-brand-primary/20 text-brand-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                      {gameState.status === 'question' ? 'Question Active' : 'Player Buzzed'}
                    </span>
                    <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">
                      {gameState.board.categories.find(c => c.id === gameState.currentQuestion?.categoryId)?.title} • ${gameState.board.categories.find(c => c.id === gameState.currentQuestion?.categoryId)?.questions.find(q => q.id === gameState.currentQuestion?.questionId)?.points}
                    </p>
                  </div>
                  <button 
                    onClick={skipQuestion}
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors"
                  >
                    <ChevronLeft size={14} /> Skip / Return to Board
                  </button>
                </div>

                <h1 className="host-question-text text-2xl md:text-3xl">
                  {gameState.board.categories.find(c => c.id === gameState.currentQuestion?.categoryId)
                    ?.questions.find(q => q.id === gameState.currentQuestion?.questionId)?.text}
                </h1>
                
                <div className="host-answer-box space-y-2">
                  <p className="text-brand-accent text-xs font-black uppercase tracking-[0.2em]">Correct Answer</p>
                  <p className="text-3xl font-black italic text-brand-accent">
                    {gameState.board.categories.find(c => c.id === gameState.currentQuestion?.categoryId)
                      ?.questions.find(q => q.id === gameState.currentQuestion?.questionId)?.answer}
                  </p>
                </div>

                {gameState.status === 'question' && (
                  <div className="flex items-center justify-center gap-4 text-brand-muted">
                    <div className="w-2 h-2 bg-brand-primary rounded-full animate-ping" />
                    <p className="text-sm font-bold italic">Waiting for contestants to buzz...</p>
                  </div>
                )}

                {gameState.status === 'buzzed' && buzzedPlayer && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-8 w-full"
                  >
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-3 px-6 py-2 bg-brand-accent text-blue-900 rounded-full font-black italic uppercase tracking-widest animate-bounce">
                        <Zap size={20} fill="currentColor" /> {buzzedPlayer.name} Buzzed In!
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto w-full">
                      <button 
                        onClick={() => handleAnswer(true)}
                        className="host-btn-correct"
                      >
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                          <Check size={40} strokeWidth={3} />
                        </div>
                        <span className="text-2xl font-black italic tracking-tight uppercase">Correct</span>
                      </button>
                      <button 
                        onClick={() => handleAnswer(false)}
                        className="host-btn-incorrect"
                      >
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                          <X size={40} strokeWidth={3} />
                        </div>
                        <span className="text-2xl font-black italic tracking-tight uppercase">Incorrect</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
