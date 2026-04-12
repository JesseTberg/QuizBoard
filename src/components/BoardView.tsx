import { GameState } from '../types';
import socket from '../lib/socket';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Monitor } from 'lucide-react';

interface BoardViewProps {
  gameState: GameState;
}

export default function BoardView({ gameState }: BoardViewProps) {
  const selectQuestion = (categoryId: number, questionId: number) => {
    if (gameState.status !== 'playing') return;
    socket.emit('select-question', { gameId: gameState.id, categoryId, questionId });
  };

  const currentQuestionData = gameState.currentQuestion 
    ? gameState.board.categories.find(c => c.id === gameState.currentQuestion?.categoryId)
        ?.questions.find(q => q.id === gameState.currentQuestion?.questionId)
    : null;

  const buzzedPlayer = gameState.players.find(p => p.id === gameState.buzzedPlayerId);

  return (
    <div className="board-container">
      {/* Header */}
      <div className="board-header">
        <h1 className="board-title">JEOPARDY!</h1>
      </div>

      {/* Main Board Area */}
      <div className="board-main">
        <AnimatePresence mode="wait">
          {gameState.status === 'playing' || gameState.status === 'lobby' ? (
            <motion.div 
              key="board"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
              className="board-grid"
            >
              {gameState.board.categories.map(category => (
                <div key={category.id} className="flex flex-col gap-4 md:gap-6">
                  {/* Category Title */}
                  <div className="category-card">
                    <h2 className="text-sm md:text-xl font-black uppercase tracking-tight leading-tight drop-shadow-md">
                      {category.title}
                    </h2>
                  </div>
                  {/* Questions */}
                  {category.questions.map(question => (
                    <button
                      key={question.id}
                      onClick={() => selectQuestion(category.id, question.id)}
                      disabled={gameState.status !== 'playing'}
                      className={`
                        question-card
                        ${question.isAnswered ? 'question-card-answered' : 'question-card-active'}
                      `}
                    >
                      <span className={`question-value ${question.isAnswered ? 'opacity-40 line-through' : ''}`}>
                        ${question.points}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="question-overlay"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className="question-overlay"
            >
              <div className="space-y-8 md:space-y-16 max-w-6xl">
                <div className="space-y-4">
                  <p className="text-brand-primary font-black uppercase tracking-[0.4em] text-xs md:text-sm">Question</p>
                  <h2 className="question-text drop-shadow-2xl">
                    {currentQuestionData?.text}
                  </h2>
                </div>
                
                <AnimatePresence>
                  {gameState.status === 'buzzed' && buzzedPlayer && (
                    <motion.div 
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="buzzed-badge"
                    >
                      <div className="flex items-center justify-center gap-4 mb-2">
                        <Zap fill="currentColor" size={24} />
                        <p className="text-xl md:text-2xl font-black uppercase tracking-[0.2em]">Buzzed In</p>
                        <Zap fill="currentColor" size={24} />
                      </div>
                      <h3 className="text-4xl md:text-7xl font-black italic tracking-tighter uppercase">{buzzedPlayer.name}</h3>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Players Footer */}
      <div className="board-footer no-scrollbar">
        {gameState.players.sort((a,b) => b.score - a.score).map(player => (
          <div key={player.id} className="flex flex-col items-center gap-2 min-w-[120px] md:min-w-[160px]">
            <div className={`
              board-player-card
              ${gameState.buzzedPlayerId === player.id ? 'board-player-card-active' : 'board-player-card-inactive'}
            `}>
              <p className={`text-center font-black uppercase tracking-wider truncate text-xs md:text-base ${gameState.buzzedPlayerId === player.id ? 'text-blue-900' : 'text-brand-muted'}`}>
                {player.name}
              </p>
              <p className={`player-score-display ${gameState.buzzedPlayerId === player.id ? 'text-blue-900' : 'text-brand-accent'}`}>
                ${player.score}
              </p>
            </div>
          </div>
        ))}
        {gameState.players.length === 0 && (
          <div className="flex items-center gap-4 text-brand-muted font-black italic tracking-widest text-sm md:text-xl animate-pulse">
            <Monitor size={32} /> WAITING FOR CONTESTANTS...
          </div>
        )}
      </div>
    </div>
  );
}
