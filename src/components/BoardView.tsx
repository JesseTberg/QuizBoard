import { GameState } from '../types';
import socket from '../lib/socket';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Monitor } from 'lucide-react';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';

interface BoardViewProps {
  gameState: GameState;
}

export default function BoardView({ gameState }: BoardViewProps) {
  const currentBoard = gameState.boards[gameState.currentBoardIndex];
  
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
    <main className="board-container h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="board-header py-4 md:py-8 shrink-0">
        <h1 className="game-title text-3xl md:text-5xl lg:text-7xl">{currentBoard.name}</h1>
      </header>

      {/* Main Board Area */}
      <section className="flex-1 relative bg-brand-bg flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {gameState.status === 'playing' || gameState.status === 'lobby' ? (
            <motion.div 
              key="board"
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 1.02 }}
              className="board-grid h-full p-4 md:p-8"
            >
              {currentBoard.categories.map(category => (
                <div key={category.id} className="flex flex-col gap-3 md:gap-5">
                  {/* Category Title */}
                  <Card className="category-card shrink-0">
                    <h2 className="text-sm md:text-lg lg:text-xl font-black uppercase tracking-tight leading-tight text-white drop-shadow-md px-1">
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
                        "text-3xl md:text-5xl font-black italic tracking-tighter drop-shadow-lg",
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className="question-overlay h-full flex items-center justify-center p-8 text-center"
            >
              <article className="space-y-10 md:space-y-16 max-w-6xl w-full">
                <header className="space-y-6">
                  <span className="text-brand-primary font-black uppercase tracking-[0.5em] text-sm md:text-lg bg-brand-primary/5 px-6 py-2 rounded-full border border-brand-primary/20">THE CHALLENGE</span>
                  {currentQuestionData?.imageUrl && (
                    <motion.div 
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-3xl mx-auto rounded-3xl overflow-hidden border-8 border-brand-primary/20 shadow-[-20px_-20px_60px_rgba(0,0,0,0.5),20px_20px_60px_rgba(0,0,0,0.5)] bg-black/40 aspect-video"
                    >
                      <img 
                        src={currentQuestionData.imageUrl} 
                        alt="Question Reference" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  )}
                  <h2 className="question-text text-5xl md:text-7xl lg:text-9xl font-black italic tracking-tighter uppercase leading-[0.9] drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                    {currentQuestionData?.text}
                  </h2>
                </header>
                
                <AnimatePresence>
                  {gameState.status === 'buzzed' && buzzedPlayer && (
                    <motion.div 
                      initial={{ y: 200, opacity: 0, scale: 0.5 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      className="buzzed-badge p-10 md:p-16 border-[12px]"
                    >
                      <div className="flex items-center justify-center gap-6 mb-4">
                        <Zap fill="currentColor" size={48} className="animate-bounce" />
                        <p className="text-2xl md:text-4xl font-black uppercase tracking-[0.3em] leading-none">CONTESTANT BUZZED</p>
                        <Zap fill="currentColor" size={48} className="animate-bounce" />
                      </div>
                      <h3 className="text-6xl md:text-9xl font-black italic tracking-tighter uppercase leading-none mt-4 drop-shadow-2xl">{buzzedPlayer.name}</h3>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            </motion.div>
          ) : gameState.status.startsWith('final_question') ? (
            <motion.div 
              key="final-question"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="question-overlay h-full flex flex-col items-center justify-center p-8 gap-12"
            >
              <header className="text-center space-y-4">
                <span className="text-brand-accent font-black uppercase tracking-[0.4em] text-2xl md:text-4xl bg-brand-accent/5 px-10 py-4 rounded-full border-4 border-brand-accent/30 shadow-[0_0_80px_rgba(234,179,8,0.2)]">FINAL JEOPARDY</span>
                <h2 className="text-4xl md:text-6xl lg:text-8xl font-black italic tracking-tighter uppercase text-brand-primary leading-none pt-8">
                  {gameState.finalQuestion.category}
                </h2>
              </header>

              {(gameState.status === 'final_question_answer' || gameState.status === 'final_question_reveal') && (
                <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col items-center gap-12 max-w-6xl">
                  {gameState.finalQuestion.imageUrl && (
                    <div className="max-w-3xl w-full rounded-3xl overflow-hidden border-8 border-brand-accent/20 shadow-2xl bg-black/40 aspect-video">
                      <img 
                        src={gameState.finalQuestion.imageUrl} 
                        alt="Final Challenge" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  {gameState.status === 'final_question_answer' && (
                    <h2 className="question-text text-4xl md:text-6xl lg:text-8xl leading-tight">
                      {gameState.finalQuestion.question}
                    </h2>
                  )}

                  {gameState.status === 'final_question_reveal' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                      {gameState.players.map(player => (
                        <Card 
                          key={player.id}
                          className={cn(
                            "p-10 border-4 pt-12 text-center flex flex-col gap-6",
                            player.isCorrect === true ? 'bg-green-600/20 border-green-500 shadow-[0_0_60px_rgba(34,197,94,0.3)]' : 
                            player.isCorrect === false ? 'bg-red-600/20 border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.3)]' : 
                            'bg-brand-surface/80 border-white/5'
                          )}
                        >
                          <header className="absolute -top-6 inset-x-0 flex justify-center">
                            <span className="bg-brand-bg px-6 py-2 rounded-full border-2 border-brand-primary text-[10px] font-black uppercase tracking-widest text-brand-primary">
                              {player.name}
                            </span>
                          </header>
                          <p className="text-3xl md:text-4xl font-black italic text-white uppercase tracking-tighter leading-tight">
                            "{player.finalAnswer || 'NO RESPONSE'}"
                          </p>
                          {player.wager !== undefined && (
                            <footer className="pt-4 border-t border-white/5">
                              <p className="text-xl font-black italic tracking-tight text-brand-accent uppercase">Wagered: {player.wager}</p>
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
      <footer className="board-footer shrink-0 py-6 md:py-10 no-scrollbar items-center bg-brand-surface border-t-8 border-brand-accent relative z-20">
        <div className="flex gap-6 md:gap-12 px-8">
          {gameState.players.sort((a,b) => b.score - a.score).map(player => (
            <Card 
              key={player.id} 
              className={cn(
                "min-w-[160px] md:min-w-[240px] p-6 lg:p-8 border-4 transition-all duration-700 relative",
                gameState.buzzedPlayerId === player.id 
                  ? 'bg-brand-accent border-white scale-110 shadow-[0_0_100px_rgba(234,179,8,0.5)] -translate-y-4' 
                  : 'bg-blue-900/40 border-white/10 opacity-70 grayscale-[0.3]'
              )}
            >
              <h3 className={cn(
                "text-center font-black italic uppercase tracking-widest truncate text-sm md:text-lg mb-2",
                gameState.buzzedPlayerId === player.id ? 'text-blue-950' : 'text-brand-muted'
              )}>
                {player.name}
              </h3>
              <p className={cn(
                "text-4xl md:text-6xl font-black italic tracking-tighter text-center leading-none",
                gameState.buzzedPlayerId === player.id ? 'text-blue-950 text-7xl' : (player.score >= 0 ? 'text-brand-accent' : 'text-red-500')
              )}>
                {player.score}
              </p>
              {gameState.buzzedPlayerId === player.id && (
                <Zap className="absolute -top-4 -right-4 text-white fill-white w-10 h-10 animate-pulse" />
              )}
            </Card>
          ))}
          {gameState.players.length === 0 && (
            <div className="flex items-center gap-6 text-brand-muted font-black italic tracking-[0.5em] text-xl md:text-4xl animate-pulse py-4">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                <Monitor size={32} />
              </div>
              WAITING FOR PLAYERS...
            </div>
          )}
        </div>
      </footer>
    </main>
  );
}
