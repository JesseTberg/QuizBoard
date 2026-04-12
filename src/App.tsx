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
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isHost, setIsHost] = useState(false);
  const [hostToken, setHostToken] = useState<string | null>(null);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('gameId');
    const r = params.get('role') as any;

    console.log('App mounted. GameId:', gameId, 'Role:', r);

    if (gameId) {
      const hostKey = `jeopardy_host_${gameId}`;
      
      // Allow transferring host status via URL parameter (used by Host QR code)
      const urlToken = params.get('hostToken');
      if (urlToken) {
        localStorage.setItem(hostKey, 'true');
        localStorage.setItem(`jeopardy_token_${gameId}`, urlToken);
      } else if (params.get('isHost') === 'true') {
        localStorage.setItem(hostKey, 'true');
      }

      const wasHost = localStorage.getItem(hostKey) === 'true';
      const token = localStorage.getItem(`jeopardy_token_${gameId}`);
      setHostToken(token);
      
      let initialRole = r || 'player';
      // Restrict access to host/setup if not the original host
      if ((initialRole === 'host' || initialRole === 'setup') && !wasHost) {
        console.warn('Unauthorized access attempt to host/setup view. Redirecting to player.');
        initialRole = 'player';
        params.set('role', 'player');
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
      }

      if (wasHost) setIsHost(true);
      
      console.log('Emitting join-game for:', gameId, 'as', initialRole);
      socket.emit('join-game', { gameId, role: initialRole, hostToken });
      setRole(initialRole);
    } else {
      setRole('setup');
    }

    const handleGameState = (state: GameState) => {
      console.log('Received game-state:', state.id);
      setGameState(state);
    };

    socket.on('game-state', handleGameState);

    socket.on('game-created', ({ game, hostToken }: { game: GameState, hostToken: string }) => {
      setGameState(game);
      setHostToken(hostToken);
      localStorage.setItem(`jeopardy_host_${game.id}`, 'true');
      localStorage.setItem(`jeopardy_token_${game.id}`, hostToken);
      setIsHost(true);
      const newUrl = `${window.location.origin}?gameId=${game.id}&role=host`;
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
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game-state');
      socket.off('game-created');
      socket.off('player-joined');
      socket.off('error');
    };
  }, []);

  const handleStartGame = (board: GameBoard) => {
    socket.emit('create-game', { board });
  };

  const handleRoleChange = (newRole: 'host' | 'player' | 'board' | 'setup') => {
    setRole(newRole);
    if (gameState) {
      const params = new URLSearchParams(window.location.search);
      params.set('role', newRole);
      window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    }
  };

  const openPlayerTab = () => {
    if (gameState) {
      const url = `${window.location.origin}?gameId=${gameState.id}&role=player`;
      window.open(url, '_blank');
    }
  };

  const copyJoinLink = () => {
    if (gameState) {
      const url = `${window.location.origin}?gameId=${gameState.id}&role=player`;
      navigator.clipboard.writeText(url);
      alert('Join link copied to clipboard!');
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
      {!isConnected && (
        <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-brand-muted font-bold tracking-widest uppercase">Connecting to Server...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="floating-error">
          <X size={20} /> {error}
        </div>
      )}

      {/* Persistent View Switcher Menu - Only for Host */}
      {isHost && (
        <div className="view-switcher">
            { [
              { id: 'setup', label: 'SETUP', icon: Settings },
              { id: 'host', label: 'HOST', icon: Monitor },
              { id: 'player', label: 'PLAYER', icon: Users },
              { id: 'board', label: 'BOARD', icon: Monitor }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleRoleChange(item.id as any)}
                className={`view-switcher-btn ${role === item.id ? 'view-switcher-btn-active' : ''}`}
              >
              <item.icon size={14} />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {role === 'setup' && <SetupView onStart={handleStartGame} />}
      
      {/* Global Test & Navigation Controls - Only for Host */}
      {gameState && isHost && (
        <div className="test-controls">
          {role === 'host' && (
            <button onClick={resetToSetup} className="btn-test btn-test-setup" title="Back to Setup">
              <Settings size={20} /> <span className="hidden md:inline">Back to Setup</span>
            </button>
          )}
          <button onClick={openPlayerTab} className="btn-test btn-test-player" title="Open Player Tab">
            <Users size={20} /> <span className="hidden md:inline">Open Player Tab</span>
          </button>
          <button onClick={copyJoinLink} className="btn-test btn-test-setup" title="Copy Join Link">
            <PlayCircle size={20} /> <span className="hidden md:inline">Copy Link</span>
          </button>
        </div>
      )}

      {gameState && (
        <div className="relative min-h-screen">
          {role === 'host' && <HostView gameState={gameState} hostToken={hostToken} />}
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
