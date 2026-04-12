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
    const game = {
      id: gameId,
      ...gameData,
      players: [],
      status: 'lobby',
      currentQuestion: null,
      buzzedPlayerId: null,
      buzzedAt: null,
      buzzedHistory: [] // Track who buzzed for the current question
    };
    games.set(gameId, game);
    socket.join(gameId);
    socket.emit('game-created', game);
  });

  socket.on('join-game', ({ gameId, name, role }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    socket.join(gameId);

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
    if (game) {
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
    if (game && game.buzzedPlayerId) {
      const player = game.players.find(p => p.id === game.buzzedPlayerId);
      const { categoryId, questionId } = game.currentQuestion;
      const category = game.board.categories.find(c => c.id === categoryId);
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
    if (game && game.currentQuestion) {
      const { categoryId, questionId } = game.currentQuestion;
      const category = game.board.categories.find(c => c.id === categoryId);
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

  socket.on('adjust-score', ({ gameId, playerId, amount }) => {
    const game = games.get(gameId);
    if (game) {
      const player = game.players.find(p => p.id === playerId);
      if (player) {
        player.score += amount;
        io.to(gameId).emit('game-state', game);
      }
    }
  });

  socket.on('start-game', (gameId) => {
    const game = games.get(gameId);
    if (game) {
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
