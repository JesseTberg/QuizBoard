import { GameState } from '../types';
import socket from '../lib/socket';
import { QRCodeSVG } from 'qrcode.react';
import { Check, X, Play, Users, Monitor, Zap, QrCode, Plus, Minus, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';

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
    <main className="host-container py-8 px-4">
      <div className="host-grid max-width-container">
        
        {/* Sidebar: Players & QR */}
        <aside className="host-sidebar">
          <Card className="p-6">
            <header className="mb-6 flex items-center gap-2">
              <Users size={16} className="text-brand-primary" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-brand-muted">Contestants ({gameState.players.length})</h2>
            </header>
            <div className="flex flex-col gap-3">
              {gameState.players.sort((a,b) => b.score - a.score).map((player, idx) => (
                <article key={player.id} className="host-sidebar-item flex-col items-stretch gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-brand-muted">#{idx + 1}</span>
                      <span className="font-bold text-sm">{player.name}</span>
                    </div>
                    <span className={cn(
                      "font-black text-sm",
                      player.score >= 0 ? 'text-brand-accent' : 'text-red-500'
                    )}>
                      {player.score}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={() => adjustScore(player.id, -100)}
                      className="h-8 w-8 text-red-500"
                    >
                      <Minus size={12} />
                    </Button>
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={() => adjustScore(player.id, 100)}
                      className="h-8 w-8 text-brand-accent"
                    >
                      <Plus size={12} />
                    </Button>
                  </div>
                </article>
              ))}
              {gameState.players.length === 0 && (
                <div className="text-center py-8 space-y-2">
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-600">
                    <Users size={16} />
                  </div>
                  <p className="text-xs text-brand-muted italic">Waiting for contestants...</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 text-center flex flex-col gap-4">
            <header className="text-left">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-muted">Game Controls</h2>
            </header>
            <nav className="grid grid-cols-1 gap-2">
              {gameState.boards.map((board, idx) => (
                <Button
                  key={board.id}
                  variant={gameState.currentBoardIndex === idx ? 'accent' : 'ghost'}
                  onClick={() => switchBoard(idx)}
                  className="px-4 py-2 text-[10px] tracking-[0.2em]"
                >
                  {board.name}
                </Button>
              ))}
              <Button
                variant={gameState.status.startsWith('final_question') ? 'primary' : 'ghost'}
                onClick={startFinalQuestion}
                className="px-4 py-2 text-[10px] tracking-[0.2em]"
              >
                Final Question
              </Button>
            </nav>
          </Card>

          <Card className="p-6 text-center space-y-6">
            <header 
              className="flex items-center justify-between cursor-pointer group"
              onClick={() => setIsQRCollapsed(!isQRCollapsed)}
            >
              <div className="flex items-center gap-2">
                <QrCode size={16} className="text-brand-muted group-hover:text-brand-primary transition-colors" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-muted group-hover:text-brand-primary transition-colors">Join Session</h2>
              </div>
              {isQRCollapsed ? <ChevronDown size={14} className="text-brand-muted" /> : <ChevronUp size={14} className="text-brand-muted" />}
            </header>

            <AnimatePresence>
              {!isQRCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-6 pt-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-left">
                      <p className="text-[10px] text-slate-500 font-mono tracking-tighter truncate max-w-[120px]">{gameState.id}</p>
                    </div>
                    <Button 
                      variant={showHostQR ? 'primary' : 'ghost'}
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHostQR(!showHostQR);
                      }}
                      className="h-8 w-8"
                    >
                      <QrCode size={16} />
                    </Button>
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
                        <div className="bg-white p-3 rounded-2xl inline-block shadow-2xl border border-brand-accent/20">
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
                        <div className="bg-white p-3 rounded-2xl inline-block shadow-2xl">
                          <QRCodeSVG value={joinUrl} size={140} />
                        </div>
                        <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Player Join QR</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="pt-2">
                    <a 
                      href={boardUrl} 
                      target="_blank" 
                      className="btn-base btn-primary btn-size-md w-full text-xs tracking-[0.2em]"
                    >
                      <Monitor size={14} /> Board View
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </aside>

        {/* Main Control Panel */}
        <section className="host-main">
          <Card className="host-control-panel relative">
            {/* Background Accent Gradient */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-50" />

            {gameState.status === 'lobby' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center-spacing py-12"
              >
                <div className="space-y-4">
                  <h1 className="game-title text-5xl md:text-7xl">GAME LOBBY</h1>
                  <p className="text-brand-muted text-lg max-w-md mx-auto">Ready to start the session with <span className="text-brand-primary font-black">{gameState.players.length}</span> contestants?</p>
                </div>
                <div className="pt-8">
                  <Button 
                    variant="primary"
                    size="lg"
                    onClick={startGame}
                    disabled={gameState.players.length === 0}
                    className="px-16 py-8 text-2xl"
                  >
                    <Play fill="currentColor" size={24} /> START SESSION
                  </Button>
                </div>
              </motion.div>
            )}

            {gameState.status === 'playing' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full flex flex-col p-6"
              >
                <header className="mb-8 text-center">
                  <h1 className="text-3xl font-black italic tracking-tighter text-brand-primary uppercase">{currentBoard.name}</h1>
                  <p className="text-brand-muted text-[10px] uppercase tracking-[0.2em] font-black pt-2">Select a question to display on the board</p>
                </header>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-1 overflow-auto pr-2 custom-scrollbar">
                  {currentBoard.categories.map(category => (
                    <div key={category.id} className="flex flex-col gap-2">
                      <header className="bg-brand-surface/40 p-2 rounded-xl text-center border border-brand-primary/20 h-12 flex items-center justify-center">
                        <h3 className="text-[10px] font-black uppercase truncate text-brand-primary px-1">{category.title}</h3>
                      </header>
                      {category.questions.map(question => (
                        <Button
                          key={question.id}
                          variant={question.isAnswered ? 'ghost' : 'ghost'}
                          onClick={() => !question.isAnswered && selectQuestion(category.id, question.id)}
                          className={cn(
                            "w-full py-4 text-lg font-black tracking-tighter transition-all",
                            question.isAnswered 
                              ? 'bg-brand-surface/50 text-brand-muted cursor-not-allowed opacity-40' 
                              : 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30 hover:bg-brand-primary hover:text-white'
                          )}
                        >
                          {question.points}
                        </Button>
                      ))}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {(gameState.status === 'question' || gameState.status === 'buzzed') && (
              <motion.article 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full flex flex-col gap-8 p-6"
              >
                <header className="w-full flex justify-between items-start">
                  <div className="flex flex-col gap-2">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block w-fit",
                      gameState.status === 'question' ? 'bg-brand-primary/20 text-brand-primary' : 'bg-brand-accent/20 text-brand-accent animate-pulse'
                    )}>
                      {gameState.status === 'question' ? 'Question Active' : 'Contestant Buzzed'}
                    </span>
                    <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">
                      {currentQuestionData?.points} Points
                    </p>
                  </div>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={skipQuestion}
                    className="text-red-500 hover:text-white hover:bg-red-500"
                  >
                    <ChevronLeft size={16} /> Skip Questions
                  </Button>
                </header>

                <div className="flex-1 flex flex-col gap-8 justify-center items-center text-center max-w-3xl mx-auto">
                  <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter leading-tight uppercase">
                    {currentQuestionData?.text}
                  </h2>

                  {currentQuestionData?.imageUrl && (
                    <Card className="max-w-md w-full overflow-hidden aspect-video bg-black/40">
                      <img 
                        src={currentQuestionData.imageUrl} 
                        alt="Question Content" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </Card>
                  )}
                  
                  <div className="host-answer-box p-10 w-full flex flex-col gap-3">
                    <span className="text-brand-accent text-[10px] font-black uppercase tracking-[0.3em]">Official Answer</span>
                    <p className="text-4xl font-black italic text-brand-accent leading-none">
                      {currentQuestionData?.answer}
                    </p>
                  </div>

                  {gameState.status === 'question' && (
                    <div className="flex items-center gap-3 text-brand-muted animate-pulse pt-4">
                      <div className="w-2.5 h-2.5 bg-brand-primary rounded-full" />
                      <p className="text-sm font-black italic uppercase tracking-widest">Waiting for buzzer...</p>
                    </div>
                  )}
                </div>

                {gameState.status === 'buzzed' && buzzedPlayer && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-8 w-full pb-8"
                  >
                    <div className="text-center">
                      <div className="inline-flex items-center gap-3 px-8 py-3 bg-brand-accent text-blue-900 rounded-full font-black italic uppercase tracking-widest shadow-[0_0_50px_rgba(234,179,8,0.3)] animate-pulse">
                        <Zap size={24} fill="currentColor" /> {buzzedPlayer.name.toUpperCase()} BUZZED IN!
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
                      <Button 
                        variant="primary"
                        onClick={() => handleAnswer(true)}
                        className="host-btn-correct py-10 rounded-[2rem] flex flex-col items-center gap-4 border-4 border-white/10"
                      >
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                          <Check size={48} strokeWidth={4} />
                        </div>
                        <span className="text-3xl font-black italic tracking-tighter uppercase leading-none">Correct</span>
                      </Button>
                      <Button 
                        variant="primary"
                        onClick={() => handleAnswer(false)}
                        className="host-btn-incorrect text-white py-10 rounded-[2rem] flex flex-col items-center gap-4 border-4 border-white/10"
                      >
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                          <X size={48} strokeWidth={4} color="white" />
                        </div>
                        <span className="text-3xl font-black italic tracking-tighter uppercase leading-none">Incorrect</span>
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.article>
            )}

            {gameState.status === 'final_question_wager' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-10 py-10 items-center w-full">
                <header className="text-center space-y-4">
                  <h1 className="game-title text-4xl italic uppercase">FINAL WAGERS</h1>
                  <p className="text-brand-muted text-sm uppercase tracking-widest font-black">Contestants are calculating their risk...</p>
                </header>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-4xl px-6">
                  {gameState.players.map(p => (
                    <Card key={p.id} className={cn(
                      "p-6 text-center border-t-4 flex flex-col gap-2",
                      p.wager !== undefined ? 'border-brand-primary' : 'border-slate-700 opacity-60'
                    )}>
                      <p className="text-[10px] font-black uppercase text-brand-muted tracking-widest">{p.name}</p>
                      <p className={cn(
                        "text-xl font-black italic uppercase tracking-tighter",
                        p.wager !== undefined ? 'text-brand-accent' : 'text-slate-600'
                      )}>
                        {p.wager !== undefined ? 'Locked In' : 'Calculating...'}
                      </p>
                    </Card>
                  ))}
                </div>
                
                <Button 
                  variant="primary"
                  size="lg"
                  onClick={advanceToFinalQuestion}
                  className="px-16"
                >
                  ADVANCE TO QUESTION
                </Button>
              </motion.div>
            )}

            {gameState.status === 'final_question_answer' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-10 py-10 items-center w-full">
                <header className="text-center space-y-4">
                  <h1 className="game-title text-4xl italic uppercase">FINAL ANSWERS</h1>
                  <p className="text-brand-muted text-sm uppercase tracking-widest font-black">Waiting for the final revelations...</p>
                </header>

                {gameState.finalQuestion.imageUrl && (
                  <Card className="max-w-md w-full overflow-hidden aspect-video bg-black/40">
                    <img src={gameState.finalQuestion.imageUrl} alt="Final Content" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </Card>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-4xl px-6">
                  {gameState.players.map(p => (
                    <Card key={p.id} className={cn(
                      "p-6 text-center border-t-4 flex flex-col gap-2",
                      p.finalAnswer ? 'border-brand-primary' : 'border-slate-700 opacity-60'
                    )}>
                      <p className="text-[10px] font-black uppercase text-brand-muted tracking-widest">{p.name}</p>
                      <p className={cn(
                        "text-xl font-black italic uppercase tracking-tighter",
                        p.finalAnswer ? 'text-brand-primary' : 'text-slate-600'
                      )}>
                        {p.finalAnswer ? 'Submitted' : 'Thinking...'}
                      </p>
                    </Card>
                  ))}
                </div>

                <Button 
                  variant="primary"
                  size="lg"
                  onClick={advanceToFinalReveal}
                  className="px-16"
                >
                  REVEAL ALL ANSWERS
                </Button>
              </motion.div>
            )}

            {gameState.status === 'final_question_reveal' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-10 py-10 items-center w-full h-full overflow-auto px-6">
                <header className="text-center">
                  <h1 className="game-title text-4xl">Final Question</h1>
                  <p className="text-brand-muted text-sm uppercase tracking-widest font-black pt-2 italic">Confirm correct answers to update scores</p>
                </header>

                {gameState.finalQuestion.imageUrl && (
                  <Card className="max-w-md w-full overflow-hidden aspect-video bg-black/40 shrink-0">
                    <img src={gameState.finalQuestion.imageUrl} alt="Final Reveal" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
                  {gameState.players.map(p => (
                    <Card key={p.id} className="p-8 flex flex-col gap-6 bg-brand-surface/40 border-2 border-white/5 shadow-2xl">
                      <header className="flex justify-between items-center border-b border-white/5 pb-4">
                        <h3 className="text-2xl font-black italic uppercase text-brand-primary leading-none">{p.name}</h3>
                        <span className="bg-brand-accent/10 px-4 py-1.5 rounded-full text-brand-accent font-black text-xs uppercase tracking-widest">
                          Wager: {p.wager}
                        </span>
                      </header>
                      
                      <div className="bg-black/30 p-6 rounded-2xl italic text-xl border border-white/5 shadow-inner min-h-[100px] flex items-center justify-center text-center">
                        "{p.finalAnswer || 'NO RESPONSE'}"
                      </div>

                      <footer className="flex gap-3 pt-2">
                      <Button 
                        variant={p.isCorrect === true ? 'primary' : 'ghost'}
                        onClick={() => markFinalResult(p.id, true)}
                        disabled={p.isCorrect !== undefined}
                        className={cn(
                          "flex-1 py-5 text-sm uppercase tracking-[0.2em] font-black h-auto text-white", // Added text-white here
                          p.isCorrect === true && 'bg-green-600 hover:bg-green-600',
                          p.isCorrect === undefined && 'bg-green-500/80 hover:bg-green-600 border-green-500/30' // Increased opacity
                        )}
                      >
                        <Check size={18} /> Correct
                      </Button>
                      
                      <Button 
                        variant={p.isCorrect === false ? 'danger' : 'ghost'}
                        onClick={() => markFinalResult(p.id, false)}
                        disabled={p.isCorrect !== undefined}
                        className={cn(
                          "flex-1 py-5 text-sm uppercase tracking-[0.2em] font-black h-auto text-white", // Added text-white here
                          p.isCorrect === false && 'bg-red-600 hover:bg-red-600',
                          p.isCorrect === undefined && 'bg-red-500/80 hover:bg-red-600 border-red-500/30' // Increased opacity
                        )}
                      >
                        <X size={18} /> Incorrect
                      </Button>
                    </footer>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </Card>
        </section>
      </div>
    </main>
  );
}
