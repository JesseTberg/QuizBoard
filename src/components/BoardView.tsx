import { useState, useEffect } from 'react';
import { GameState } from '../types';
import socket from '../lib/socket';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Monitor, Settings, Sliders } from 'lucide-react';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';

interface BoardViewProps {
  gameState: GameState;
}

export default function BoardView({ gameState }: BoardViewProps) {
  const currentBoard = gameState.boards[gameState.currentBoardIndex];
  
  // Unified layout scale settings persistence - Defaulting to 'sm' for a compact, centered layout!
  const [boardScale, setBoardScale] = useState<'sm' | 'md' | 'lg'>(() => {
    return (localStorage.getItem('board_layout_scale') as 'sm' | 'md' | 'lg') || 'sm';
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('board_layout_scale', boardScale);
  }, [boardScale]);

  const selectQuestion = (categoryId: number, questionId: number) => {
    if (gameState.status !== 'playing') return;
    socket.emit('select-question', { gameId: gameState.id, categoryId, questionId });
  };

  const currentQuestionData = gameState.currentQuestion 
    ? currentBoard.categories.find(c => c.id === gameState.currentQuestion?.categoryId)
        ?.questions.find(q => q.id === gameState.currentQuestion?.questionId)
    : null;

  const buzzedPlayer = gameState.players.find(p => p.id === gameState.buzzedPlayerId);

  return (
    <main className="board-container h-screen flex flex-col overflow-hidden relative">
      
      {/* Floating Settings Gear - Increased default opacity slightly to make discovery easier */}
      <div className="absolute top-4 right-4 z-50">
        <div className="relative group">
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="w-10 h-10 rounded-full bg-slate-900/85 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-slate-800 transition-all cursor-pointer backdrop-blur-md opacity-45 hover:opacity-100 shadow-xl"
            title="Adjust Board Layout Settings"
          >
            <Settings size={20} className={cn("transition-transform duration-500", isSettingsOpen && "rotate-90")} />
          </button>

          <AnimatePresence>
            {isSettingsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-72 bg-slate-950/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl space-y-4"
              >
                <header className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <Sliders size={14} className="text-brand-accent" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted">DISPLAY MODIFIERS</span>
                </header>

                {/* Combined Board Scale Sizer */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">General Board scale</span>
                  <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl">
                    {(['sm', 'md', 'lg'] as const).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setBoardScale(sz)}
                        className={cn(
                          "py-2 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all cursor-pointer",
                          boardScale === sz 
                            ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20" 
                            : "text-brand-muted hover:text-white"
                        )}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <footer className="text-[8px] font-bold text-center text-brand-muted uppercase tracking-widest pt-2 border-t border-white/5">
                  PERSISTING OPTIONS IN BROWSER
                </footer>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Header */}
      <header className={cn(
        "board-header shrink-0 transition-all duration-300 flex items-center justify-center relative",
        boardScale === 'sm' && "py-1.5 md:py-3 border-b-2 border-brand-accent/50",
        boardScale === 'md' && "py-4 md:py-6 border-b-4 border-brand-accent",
        boardScale === 'lg' && "py-6 md:py-12 border-b-8 border-brand-accent shadow-[0_10px_40px_rgba(234,179,8,0.15)]"
      )}>
        {/* Rapid Desktop Sizing adjuster inline - Super convenient! */}
        <div className="absolute left-6 hidden xl:flex items-center gap-1 bg-slate-950/40 border border-white/5 p-1 rounded-xl">
          <span className="text-[7px] text-brand-muted font-black uppercase tracking-wider px-1.5">SCALE</span>
          {(['sm', 'md', 'lg'] as const).map((sz) => (
            <button
              key={sz}
              onClick={() => setBoardScale(sz)}
              className={cn(
                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer",
                boardScale === sz 
                  ? "bg-brand-primary text-white" 
                  : "text-brand-muted hover:text-white"
              )}
            >
              {sz}
            </button>
          ))}
        </div>

        <h1 className={cn(
          "game-title font-black italic tracking-tighter uppercase leading-none transition-all duration-300 text-center text-brand-text drop-shadow-xl px-4",
          boardScale === 'sm' && "text-lg md:text-2xl lg:text-3xl",
          boardScale === 'md' && "text-2xl md:text-4xl lg:text-5xl",
          boardScale === 'lg' && "text-4xl md:text-6xl lg:text-8xl"
        )}>
          {currentBoard.name}
        </h1>
      </header>

      {/* Main Board Area - That central div centered and fitted properly */}
      <section className="flex-1 relative bg-brand-bg flex flex-col items-center justify-center overflow-hidden w-full">
        <AnimatePresence mode="wait">
          {gameState.status === 'playing' || gameState.status === 'lobby' ? (
            <motion.div 
              key="board"
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 1.02 }}
              className="board-grid h-full w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8"
            >
              {currentBoard.categories.map(category => (
                <div key={category.id} className="flex flex-col gap-2 md:gap-3 lg:gap-4 h-full">
                  {/* Category Title */}
                  <Card className="category-card shrink-0">
                    <h2 className="text-xs md:text-sm lg:text-base font-black uppercase tracking-tight leading-tight text-white drop-shadow-md px-1">
                      {category.title}
                    </h2>
                  </Card>
                  {/* Questions */}
                  {category.questions.map(question => (
                    <button
                      key={question.id}
                      onClick={() => selectQuestion(category.id, question.id)}
                      disabled={gameState.status !== 'playing'}
                      className={cn(
                        "question-card",
                        question.isAnswered ? "question-card-answered" : "question-card-active"
                      )}
                    >
                      <span className={cn(
                        "text-xl md:text-3xl lg:text-4xl font-black italic tracking-tighter drop-shadow-lg",
                        question.isAnswered ? "opacity-20 line-through" : "text-brand-accent"
                      )}>
                        {question.points}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </motion.div>
          ) : gameState.status === 'question' || gameState.status === 'buzzed' ? (
            <motion.div 
              key="question-overlay"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.02, opacity: 0 }}
              className="question-overlay h-full w-full max-w-6xl mx-auto flex items-center justify-center p-6 md:p-12 text-center"
            >
              <article className="space-y-6 md:space-y-10 max-w-4xl w-full mx-auto px-4">
                <header className="space-y-3">
                  <span className="text-brand-primary font-black uppercase tracking-[0.5em] text-[10px] md:text-xs bg-brand-primary/5 px-4 py-1.5 rounded-full border border-brand-primary/20 inline-block">THE CHALLENGE</span>
                  {currentQuestionData?.imageUrl && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-xl mx-auto rounded-2xl overflow-hidden border-2 border-brand-primary/20 shadow-[-10px_-10px_40px_rgba(0,0,0,0.5),10px_10px_40px_rgba(0,0,0,0.5)] bg-black/40 aspect-video max-h-[180px] md:max-h-[240px]"
                    >
                      <img 
                        src={currentQuestionData.imageUrl} 
                        alt="Question Reference" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  )}
                  <h2 className="question-text text-2xl md:text-4xl lg:text-6xl font-black italic tracking-tighter uppercase leading-[0.95] drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                    {currentQuestionData?.text}
                  </h2>
                </header>
                
                <AnimatePresence>
                  {gameState.status === 'buzzed' && buzzedPlayer && (
                    <motion.div 
                      initial={{ y: 50, opacity: 0, scale: 0.9 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: 30, opacity: 0, scale: 0.9 }}
                      className="buzzed-badge p-3 md:p-6 rounded-[1.2rem] md:rounded-[2rem] border-[4px] md:border-[6px] bg-brand-accent text-blue-900 inline-block shadow-[0_0_60px_rgba(234,179,8,0.35)] border-white/20 mx-auto"
                    >
                      <div className="flex items-center justify-center gap-3 mb-1.5">
                        <Zap fill="currentColor" size={18} className="animate-pulse shrink-0" />
                        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] leading-none">CONTESTANT BUZZED</p>
                        <Zap fill="currentColor" size={18} className="animate-pulse shrink-0" />
                      </div>
                      <h3 className="text-2xl md:text-4xl lg:text-5xl font-black italic tracking-tight uppercase leading-none mt-1 drop-shadow-md">{buzzedPlayer.name}</h3>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            </motion.div>
          ) : gameState.status.startsWith('final_question') ? (
            <motion.div 
              key="final-question"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="question-overlay h-full w-full max-w-6xl mx-auto flex flex-col items-center justify-center p-6 gap-8"
            >
              <header className="text-center space-y-3">
                <span className="text-brand-accent font-black uppercase tracking-[0.4em] text-lg md:text-2xl bg-brand-accent/5 px-6 py-2.5 rounded-full border-2 border-brand-accent/30 shadow-[0_0_60px_rgba(234,179,8,0.15)]">FINAL CHALLENGE</span>
                <h2 className="text-2xl md:text-4.xl lg:text-6xl font-black italic tracking-tighter uppercase text-brand-primary leading-none pt-4">
                  {gameState.finalQuestion.category}
                </h2>
              </header>

              {(gameState.status === 'final_question_answer' || gameState.status === 'final_question_reveal') && (
                <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col items-center gap-6 max-w-4xl">
                  {gameState.finalQuestion.imageUrl && (
                    <div className="max-w-xl w-full rounded-2xl overflow-hidden border-2 border-brand-accent/20 shadow-2xl bg-black/40 aspect-video max-h-[180px] md:max-h-[220px]">
                      <img 
                        src={gameState.finalQuestion.imageUrl} 
                        alt="Final Challenge" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  {gameState.status === 'final_question_answer' && (
                    <h2 className="question-text text-2xl md:text-4xl lg:text-6xl leading-tight">
                      {gameState.finalQuestion.question}
                    </h2>
                  )}

                  {gameState.status === 'final_question_reveal' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                      {gameState.players.map(player => (
                        <Card 
                          key={player.id}
                          className={cn(
                            "p-6 border-2 pt-8 text-center flex flex-col gap-3",
                            player.isCorrect === true ? 'bg-green-600/20 border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.25)]' : 
                            player.isCorrect === false ? 'bg-red-600/20 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.25)]' : 
                            'bg-brand-surface/80 border-white/5'
                          )}
                        >
                          <header className="absolute -top-4 inset-x-0 flex justify-center">
                            <span className="bg-brand-bg px-4 py-1.5 rounded-full border-2 border-brand-primary text-[9px] font-black uppercase tracking-widest text-brand-primary shadow-lg">
                              {player.name}
                            </span>
                          </header>
                          <p className="text-xl md:text-2xl font-black italic text-white uppercase tracking-tighter leading-tight">
                            "{player.finalAnswer || 'NO RESPONSE'}"
                          </p>
                          {player.wager !== undefined && (
                            <footer className="pt-2 border-t border-white/5">
                              <p className="text-sm font-black italic tracking-tight text-brand-accent uppercase">Wagered: {player.wager}</p>
                            </footer>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </motion.article>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      {/* Players Footer / Scoreboard */}
      <footer className={cn(
        "board-footer shrink-0 no-scrollbar items-center bg-brand-surface border-t-2 border-brand-accent relative z-20 transition-all duration-300",
        boardScale === 'sm' && "py-2 md:py-3 px-4 gap-4",
        boardScale === 'md' && "py-4 md:py-6 px-6 gap-6 border-t-4",
        boardScale === 'lg' && "py-8 md:py-12 px-10 gap-10 border-t-8 shadow-[0_-15px_60px_rgba(0,0,0,0.5)]"
      )}>
        <div className={cn(
          "flex justify-center transition-all duration-300 w-full max-w-7xl mx-auto",
          boardScale === 'sm' && "gap-3 md:gap-4",
          boardScale === 'md' && "gap-4 md:gap-8",
          boardScale === 'lg' && "gap-6 md:gap-12"
        )}>
          {gameState.players.sort((a,b) => b.score - a.score).map(player => (
            <Card 
              key={player.id} 
              className={cn(
                "transition-all duration-700 relative",
                boardScale === 'sm' && "min-w-[100px] md:min-w-[140px] p-2.5 md:p-3.5 border-2 rounded-xl",
                boardScale === 'md' && "min-w-[140px] md:min-w-[200px] p-4 lg:p-6 border-4 rounded-2xl",
                boardScale === 'lg' && "min-w-[180px] md:min-w-[280px] p-6 lg:p-10 border-8 rounded-4xl",
                gameState.buzzedPlayerId === player.id 
                  ? 'bg-brand-accent border-white scale-105 shadow-[0_0_80px_rgba(234,179,8,0.45)] -translate-y-2' 
                  : 'bg-blue-900/40 border-white/10 opacity-70 grayscale-[0.2]'
              )}
            >
              <h3 className={cn(
                "text-center font-black italic uppercase tracking-widest truncate mb-1 transition-all",
                boardScale === 'sm' && "text-[9px] md:text-2xs",
                boardScale === 'md' && "text-xs md:text-sm",
                boardScale === 'lg' && "text-md md:text-xl",
                gameState.buzzedPlayerId === player.id ? 'text-blue-950 font-black' : 'text-brand-muted'
              )}>
                {player.name}
              </h3>
              <p className={cn(
                "font-black italic tracking-tighter text-center leading-none transition-all",
                boardScale === 'sm' && "text-lg md:text-3xl",
                boardScale === 'md' && "text-2xl md:text-5xl",
                boardScale === 'lg' && "text-4xl md:text-7xl",
                gameState.buzzedPlayerId === player.id 
                  ? 'text-blue-950' 
                  : (player.score >= 0 ? 'text-brand-accent' : 'text-red-500')
              )}>
                {player.score}
              </p>
              {gameState.buzzedPlayerId === player.id && (
                <Zap className={cn(
                  "absolute text-white fill-white animate-pulse transition-all",
                  boardScale === 'sm' && "-top-1.5 -right-1.5 w-5 h-5",
                  boardScale === 'md' && "-top-3 -right-3 w-8 h-8",
                  boardScale === 'lg' && "-top-5 -right-5 w-12 h-12"
                )} />
              )}
            </Card>
          ))}
          {gameState.players.length === 0 && (
            <div className={cn(
              "flex items-center gap-4 text-brand-muted font-black italic tracking-[0.4em] animate-pulse py-2 transition-all",
              boardScale === 'sm' && "text-xs md:text-sm",
              boardScale === 'md' && "text-md md:text-2xl",
              boardScale === 'lg' && "text-xl md:text-4xl"
            )}>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white/5 rounded-full flex items-center justify-center shrink-0">
                <Monitor size={20} />
              </div>
              WAITING FOR CHALLENGERS...
            </div>
          )}
        </div>
      </footer>
    </main>
  );
}
