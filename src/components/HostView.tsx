import { GameState } from '../types';
import socket from '../lib/socket';
import { QRCodeSVG } from 'qrcode.react';
import { Check, X, RefreshCw, Play, Users, Monitor, Zap, QrCode, Plus, Minus, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface HostViewProps {
  gameState: GameState;
  hostToken: string | null;
}

export default function HostView({ gameState, hostToken }: HostViewProps) {
  const [showHostQR, setShowHostQR] = useState(false);
  const [isQRCollapsed, setIsQRCollapsed] = useState(false);
  const joinUrl = `${window.location.origin}?gameId=${gameState.id}&role=player`;
  const boardUrl = `${window.location.origin}?gameId=${gameState.id}&role=board`;
  const hostUrl = `${window.location.origin}?gameId=${gameState.id}&role=host&hostToken=${hostToken || ''}`;

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
  const currentBoard = gameState.boards[gameState.currentBoardIndex];

  const switchBoard = (index: number) => {
    socket.emit('switch-board', { gameId: gameState.id, boardIndex: index });
  };

  const startFinalQuestion = () => {
    socket.emit('start-final-question', { gameId: gameState.id });
  };

  const advanceToFinalQuestion = () => {
    socket.emit('advance-to-final-question', { gameId: gameState.id });
  };

  const advanceToFinalReveal = () => {
    socket.emit('advance-to-final-reveal', { gameId: gameState.id });
  };

  const markFinalResult = (playerId: string, correct: boolean) => {
    socket.emit('mark-final-result', { gameId: gameState.id, playerId, correct });
  };

  const currentQuestionData = gameState.currentQuestion 
    ? currentBoard.categories.find(c => c.id === gameState.currentQuestion?.categoryId)
        ?.questions.find(q => q.id === gameState.currentQuestion?.questionId)
    : null;

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
                      {player.score}
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

          <div className="card-surface p-6 text-center space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-muted text-left">Game Controls</h2>
            <div className="grid grid-cols-1 gap-2">
              {gameState.boards.map((board, idx) => (
                <button
                  key={board.id}
                  onClick={() => switchBoard(idx)}
                  className={`px-4 py-2 rounded text-[10px] font-black uppercase transition-all ${gameState.currentBoardIndex === idx ? 'bg-brand-accent text-blue-900' : 'bg-white/5 text-brand-muted hover:bg-white/10'}`}
                >
                  {board.name}
                </button>
              ))}
              <button
                onClick={startFinalQuestion}
                className={`px-4 py-2 rounded text-[10px] font-black uppercase transition-all ${gameState.status.startsWith('final_question') ? 'bg-brand-primary text-white' : 'bg-white/5 text-brand-muted hover:bg-white/10'}`}
              >
                Final Question
              </button>
            </div>
          </div>

          <div className="card-surface p-6 text-center space-y-6">
            <div 
              className="qr-section-header"
              onClick={() => setIsQRCollapsed(!isQRCollapsed)}
            >
              <div className="flex items-center gap-2">
                <QrCode size={16} className="text-brand-muted" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-muted">Join Session</h2>
              </div>
              {isQRCollapsed ? <ChevronDown size={14} className="text-brand-muted" /> : <ChevronUp size={14} className="text-brand-muted" />}
            </div>

            <AnimatePresence>
              {!isQRCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-6"
                >
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <div className="text-left">
                      <p className="text-[10px] text-slate-500 font-mono">{gameState.id}</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHostQR(!showHostQR);
                      }}
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
                        <div className="bg-white p-2 rounded-xl inline-block shadow-lg border border-brand-accent/20">
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
                        <div className="bg-white p-2 rounded-xl inline-block shadow-lg">
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
                </motion.div>
              )}
            </AnimatePresence>
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
                  <h1 className="game-title text-6xl">GAME LOBBY</h1>
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
                  <h1 className="text-2xl font-black italic tracking-tighter text-brand-primary uppercase">{currentBoard.name}</h1>
                  <p className="text-brand-muted text-xs uppercase tracking-widest">Select a question to display on the board</p>
                </div>
                
                <div className="grid grid-cols-5 gap-4 flex-1 overflow-auto p-2">
                  {currentBoard.categories.map(category => (
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
                          {question.points}
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
                      {currentQuestionData?.points} Points
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
                  {currentQuestionData?.text}
                </h1>

                {currentQuestionData?.imageUrl && (
                  <div className="max-w-xs mx-auto rounded-lg overflow-hidden border border-white/10 bg-black/20">
                    <img 
                      src={currentQuestionData.imageUrl} 
                      alt="Question Visual" 
                      className="w-full h-auto object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                
                <div className="host-answer-box space-y-2">
                  <p className="text-brand-accent text-xs font-black uppercase tracking-[0.2em]">Correct Answer</p>
                  <p className="text-3xl font-black italic text-brand-accent">
                    {currentQuestionData?.answer}
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

            {gameState.status === 'final_question_wager' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-8">
                <h1 className="game-title text-4xl uppercase">FINAL QUESTION WAGERS</h1>
                <p className="text-brand-muted">Contestants are submitting their wagers...</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  {gameState.players.map(p => (
                    <div key={p.id} className="p-4 rounded bg-white/5 border border-white/10">
                      <p className="text-xs font-black uppercase text-brand-muted">{p.name}</p>
                      <p className="text-xl font-black italic text-brand-accent">{p.wager !== undefined ? 'WAGERED' : 'WAITING...'}</p>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={advanceToFinalQuestion}
                  className="btn-primary px-12 py-4 text-xl italic tracking-tighter"
                >
                  ADVANCE TO QUESTION
                </button>
              </motion.div>
            )}

            {gameState.status === 'final_question_answer' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-8">
                <h1 className="game-title text-4xl uppercase">FINAL QUESTION ANSWERS</h1>
                {gameState.finalQuestion.imageUrl && (
                  <div className="max-w-xs mx-auto rounded-lg overflow-hidden border border-white/10 bg-black/20">
                    <img src={gameState.finalQuestion.imageUrl} alt="Final Question Visual" className="w-full h-auto object-contain" referrerPolicy="no-referrer" />
                  </div>
                )}
                <p className="text-brand-muted">Contestants are typing their answers...</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  {gameState.players.map(p => (
                    <div key={p.id} className="p-4 rounded bg-white/5 border border-white/10">
                      <p className="text-xs font-black uppercase text-brand-muted">{p.name}</p>
                      <p className="text-xl font-black italic text-brand-accent">{p.finalAnswer ? 'ANSWERED' : 'WAITING...'}</p>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={advanceToFinalReveal}
                  className="btn-primary px-12 py-4 text-xl italic tracking-tighter"
                >
                  REVEAL ANSWERS
                </button>
              </motion.div>
            )}

            {gameState.status === 'final_question_reveal' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-8 overflow-auto max-h-full p-4">
                <h1 className="game-title text-4xl">REVEAL & SCORE</h1>
                {gameState.finalQuestion.imageUrl && (
                  <div className="max-w-xs mx-auto rounded-lg overflow-hidden border border-white/10 bg-black/20">
                    <img src={gameState.finalQuestion.imageUrl} alt="Final Question Visual" className="w-full h-auto object-contain" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {gameState.players.map(p => (
                    <div key={p.id} className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-lg font-black italic uppercase text-brand-primary">{p.name}</p>
                        <p className="text-brand-accent font-bold">Wager: {p.wager}</p>
                      </div>
                      <div className="bg-black/20 p-4 rounded italic text-xl">
                        "{p.finalAnswer || 'No Answer'}"
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => markFinalResult(p.id, true)}
                          disabled={p.isCorrect !== undefined}
                          className={`flex-1 py-3 rounded font-black uppercase text-xs ${p.isCorrect === true ? 'bg-green-500 text-white' : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'}`}
                        >
                          Correct
                        </button>
                        <button 
                          onClick={() => markFinalResult(p.id, false)}
                          disabled={p.isCorrect !== undefined}
                          className={`flex-1 py-3 rounded font-black uppercase text-xs ${p.isCorrect === false ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                        >
                          Incorrect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
