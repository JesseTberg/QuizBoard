import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = Number(process.env.PORT) || 3000;

// In-memory game state
const games = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-game', (gameData) => {
    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hostToken = Math.random().toString(36).substring(2, 15);
    const game = {
      id: gameId,
      hostToken,
      authorizedHosts: new Set([socket.id]),
      ...gameData,
      players: [],
      status: 'lobby',
      currentQuestion: null,
      buzzedPlayerId: null,
      buzzedAt: null,
      buzzedHistory: [],
      currentBoardIndex: 0
    };
    games.set(gameId, game);
    socket.join(gameId);
    socket.emit('game-created', { game, hostToken });
  });

  socket.on('join-game', ({ gameId, name, role, hostToken }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    socket.join(gameId);

    if (role === 'host') {
      if (game.hostToken === hostToken) {
        game.authorizedHosts.add(socket.id);
        socket.emit('host-authorized', { hostToken });
      } else {
        socket.emit('error', 'Unauthorized: Invalid host token');
        return;
      }
    }

    if (role === 'player' && name) {
      // Prevent duplicate players with the same socket ID
      const existingPlayerIndex = game.players.findIndex(p => p.id === socket.id);
      if (existingPlayerIndex === -1) {
        const player = { id: socket.id, name, score: 0 };
        game.players.push(player);
      } else {
        // Update name if they are re-joining
        game.players[existingPlayerIndex].name = name;
      }
      io.to(gameId).emit('player-joined', game.players);
    }

    socket.emit('game-state', game);
  });

  socket.on('select-question', ({ gameId, categoryId, questionId }) => {
    const game = games.get(gameId);
    if (game && game.authorizedHosts.has(socket.id)) {
      game.status = 'question';
      game.currentQuestion = { categoryId, questionId };
      game.buzzedPlayerId = null;
      game.buzzedAt = null;
      game.buzzedHistory = []; // Reset history for new question
      io.to(gameId).emit('game-state', game);
    }
  });

  socket.on('buzz', ({ gameId }) => {
    const game = games.get(gameId);
    if (game && game.status === 'question' && !game.buzzedPlayerId) {
      // Check if player already buzzed for this question
      if (game.buzzedHistory.includes(socket.id)) {
        return;
      }
      
      game.status = 'buzzed';
      game.buzzedPlayerId = socket.id;
      game.buzzedAt = Date.now();
      game.buzzedHistory.push(socket.id);
      io.to(gameId).emit('game-state', game);
    }
  });

  socket.on('answer-result', ({ gameId, correct }) => {
    const game = games.get(gameId);
    if (game && game.authorizedHosts.has(socket.id) && game.buzzedPlayerId) {
      const player = game.players.find(p => p.id === game.buzzedPlayerId);
      const { categoryId, questionId } = game.currentQuestion;
      const currentBoard = game.boards[game.currentBoardIndex];
      const category = currentBoard.categories.find(c => c.id === categoryId);
      const question = category.questions.find(q => q.id === questionId);

      if (player && question) {
        player.score += correct ? question.points : -question.points;
      }

      if (correct) {
        question.isAnswered = true;
        game.status = 'playing';
        game.currentQuestion = null;
        game.buzzedPlayerId = null;
        game.buzzedHistory = [];
      } else {
        game.status = 'question';
        game.buzzedPlayerId = null;
      }
      io.to(gameId).emit('game-state', game);
    }
  });

  socket.on('skip-question', ({ gameId }) => {
    const game = games.get(gameId);
    if (game && game.authorizedHosts.has(socket.id) && game.currentQuestion) {
      const { categoryId, questionId } = game.currentQuestion;
      const currentBoard = game.boards[game.currentBoardIndex];
      const category = currentBoard.categories.find(c => c.id === categoryId);
      const question = category.questions.find(q => q.id === questionId);
      
      if (question) {
        question.isAnswered = true;
      }
      
      game.status = 'playing';
      game.currentQuestion = null;
      game.buzzedPlayerId = null;
      game.buzzedHistory = [];
      io.to(gameId).emit('game-state', game);
    }
  });

  socket.on('switch-board', ({ gameId, boardIndex }) => {
    const game = games.get(gameId);
    if (game && game.authorizedHosts.has(socket.id)) {
      if (boardIndex >= 0 && boardIndex < game.boards.length) {
        game.currentBoardIndex = boardIndex;
        game.status = 'playing';
        game.currentQuestion = null;
        io.to(gameId).emit('game-state', game);
      }
    }
  });

  socket.on('start-final-question', ({ gameId }) => {
    const game = games.get(gameId);
    if (game && game.authorizedHosts.has(socket.id)) {
      game.status = 'final_question_wager';
      game.players.forEach(p => {
        p.wager = undefined;
        p.finalAnswer = undefined;
        p.isCorrect = undefined;
      });
      io.to(gameId).emit('game-state', game);
    }
  });

  socket.on('submit-wager', ({ gameId, wager }) => {
    const game = games.get(gameId);
    if (game && game.status === 'final_question_wager') {
      const player = game.players.find(p => p.id === socket.id);
      if (player) {
        // Limit wager to player's current score (min 0)
        const maxWager = Math.max(0, player.score);
        player.wager = Math.min(maxWager, Math.max(0, wager));
        
        // Check if all players have submitted wagers
        const allWagered = game.players.every(p => p.wager !== undefined);
        if (allWagered) {
          // Wait for host to advance manually or auto-advance? Let's let host advance.
        }
        io.to(gameId).emit('game-state', game);
      }
    }
  });

  socket.on('advance-to-final-question', ({ gameId }) => {
    const game = games.get(gameId);
    if (game && game.authorizedHosts.has(socket.id)) {
      game.status = 'final_question_answer';
      io.to(gameId).emit('game-state', game);
    }
  });

  socket.on('submit-final-answer', ({ gameId, answer }) => {
    const game = games.get(gameId);
    if (game && game.status === 'final_question_answer') {
      const player = game.players.find(p => p.id === socket.id);
      if (player) {
        player.finalAnswer = answer;
        io.to(gameId).emit('game-state', game);
      }
    }
  });

  socket.on('advance-to-final-reveal', ({ gameId }) => {
    const game = games.get(gameId);
    if (game && game.authorizedHosts.has(socket.id)) {
      game.status = 'final_question_reveal';
      io.to(gameId).emit('game-state', game);
    }
  });

  socket.on('mark-final-result', ({ gameId, playerId, correct }) => {
    const game = games.get(gameId);
    if (game && game.authorizedHosts.has(socket.id)) {
      const player = game.players.find(p => p.id === playerId);
      if (player && player.wager !== undefined) {
        player.isCorrect = correct;
        // Adjust score based on wager
        if (correct) {
          player.score += player.wager;
        } else {
          player.score -= player.wager;
        }
        io.to(gameId).emit('game-state', game);
      }
    }
  });

  socket.on('adjust-score', ({ gameId, playerId, amount }) => {
    const game = games.get(gameId);
    if (game && game.authorizedHosts.has(socket.id)) {
      const player = game.players.find(p => p.id === playerId);
      if (player) {
        player.score += amount;
        io.to(gameId).emit('game-state', game);
      }
    }
  });

  socket.on('start-game', (gameId) => {
    const game = games.get(gameId);
    if (game && game.authorizedHosts.has(socket.id)) {
      game.status = 'playing';
      io.to(gameId).emit('game-state', game);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove player from any games they were in
    games.forEach((game, gameId) => {
      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1);
        // If the buzzed player disconnects, reset the buzzer
        if (game.buzzedPlayerId === socket.id) {
          game.buzzedPlayerId = null;
          game.buzzedAt = null;
          game.status = game.currentQuestion ? 'question' : 'playing';
        }
        io.to(gameId).emit('game-state', game);
      }
    });
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
