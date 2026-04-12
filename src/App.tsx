import { useEffect, useState } from 'react';
import socket from './lib/socket';
import { GameState, GameBoard } from './types';
import { DEFAULT_BOARD } from './constants';
import HostView from './components/HostView';
import PlayerView from './components/PlayerView';
import BoardView from './components/BoardView';
import SetupView from './components/SetupView';
import { Users, PlayCircle, Settings, X, Monitor } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [role, setRole] = useState<'host' | 'player' | 'board' | 'setup' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('gameId');
    const r = params.get('role') as any;

    if (gameId) {
      socket.emit('join-game', { gameId, role: r });
      setRole(r || 'player');
    } else {
      setRole('setup');
    }

    socket.on('game-state', (state: GameState) => {
      setGameState(state);
    });

    socket.on('game-created', (state: GameState) => {
      setGameState(state);
      const newUrl = `${window.location.origin}?gameId=${state.id}&role=host`;
      window.history.pushState({}, '', newUrl);
      setRole('host');
    });

    socket.on('player-joined', (players) => {
      setGameState(prev => prev ? { ...prev, players } : null);
    });

    socket.on('error', (msg: string) => {
      setError(msg);
    });

    return () => {
      socket.off('game-state');
      socket.off('game-created');
      socket.off('player-joined');
      socket.off('error');
    };
  }, []);

  const handleStartGame = (board: GameBoard) => {
    socket.emit('create-game', { board });
  };

  const openPlayerTab = () => {
    if (gameState) {
      window.open(`${window.location.origin}?gameId=${gameState.id}&role=player`, '_blank');
    }
  };

  const resetToSetup = () => {
    window.location.href = window.location.origin;
  };

  if (error) {
    return (
      <div className="error-screen">
        <h1 className="error-title">Error</h1>
        <p className="error-message">{error}</p>
        <button onClick={resetToSetup} className="btn-primary">Go Home</button>
      </div>
    );
  }

  return (
    <div className="app-container selection:bg-brand-primary/30">
      {error && (
        <div className="floating-error">
          <X size={20} /> {error}
        </div>
      )}

      {/* Persistent View Switcher Menu */}
      <div className="view-switcher">
        {[
          { id: 'setup', label: 'SETUP', icon: Settings },
          { id: 'host', label: 'HOST', icon: Monitor },
          { id: 'player', label: 'PLAYER', icon: Users },
          { id: 'board', label: 'BOARD', icon: Monitor }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setRole(item.id as any)}
            className={`view-switcher-btn ${role === item.id ? 'view-switcher-btn-active' : ''}`}
          >
            <item.icon size={14} />
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        ))}
      </div>

      {role === 'setup' && <SetupView onStart={handleStartGame} />}
      
      {/* Global Test & Navigation Controls */}
      {gameState && (
        <div className="test-controls">
          {role === 'host' && (
            <button onClick={resetToSetup} className="btn-test btn-test-setup" title="Back to Setup">
              <Settings size={20} /> <span className="hidden md:inline">Back to Setup</span>
            </button>
          )}
          <button onClick={openPlayerTab} className="btn-test btn-test-player" title="Open Player Tab">
            <Users size={20} /> <span className="hidden md:inline">Test: Join as Player</span>
          </button>
        </div>
      )}

      {gameState && (
        <div className="relative min-h-screen">
          {role === 'host' && <HostView gameState={gameState} />}
          {role === 'player' && <PlayerView gameState={gameState} />}
          {role === 'board' && <BoardView gameState={gameState} />}
        </div>
      )}

      {!gameState && role && role !== 'setup' && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Monitor className="text-brand-muted" size={32} />
          </div>
          <div className="text-center-spacing">
            <h2 className="empty-state-title">NO ACTIVE SESSION</h2>
            <p className="empty-state-text">You need to start a game in the SETUP view before you can access the {role} view.</p>
          </div>
          <button onClick={() => setRole('setup')} className="btn-primary">GO TO SETUP</button>
        </div>
      )}
    </div>
  );
}
