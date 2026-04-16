import { useEffect, useState } from 'react';
import socket from './lib/socket';
import { GameState, GameBoard, FinalQuestion } from './types';
import HostView from './components/HostView';
import PlayerView from './components/PlayerView';
import BoardView from './components/BoardView';
import SetupView from './components/SetupView';
import { Users, PlayCircle, Settings, X, Monitor, Loader2, Zap } from 'lucide-react';
import { Footer } from './components/footer';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

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
    const r = params.get('role') as 'host' | 'player' | 'board' | 'setup' | null;

    if (gameId) {
      const hostKey = `game_host_${gameId}`;
      const urlToken = params.get('hostToken');
      
      if (urlToken) {
        localStorage.setItem(hostKey, 'true');
        localStorage.setItem(`game_token_${gameId}`, urlToken);
        params.delete('hostToken');
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
      } else if (params.get('isHost') === 'true') {
        localStorage.setItem(hostKey, 'true');
      }

      const wasHost = localStorage.getItem(hostKey) === 'true';
      const token = localStorage.getItem(`game_token_${gameId}`);
      setHostToken(token);
      
      let initialRole: 'host' | 'player' | 'board' | 'setup' = r || 'player';
      if ((initialRole === 'host' || initialRole === 'setup') && !wasHost) {
        initialRole = 'player';
        params.set('role', 'player');
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
      }

      if (wasHost) setIsHost(true);
      socket.emit('join-game', { gameId, role: initialRole, hostToken: token });
      setRole(initialRole);
    } else {
      setRole('setup');
    }

    const handleGameState = (state: GameState) => {
      setGameState(state);
    };

    socket.on('game-state', handleGameState);

    socket.on('game-created', ({ game, hostToken: token }: { game: GameState, hostToken: string }) => {
      setGameState(game);
      setHostToken(token);
      localStorage.setItem(`game_host_${game.id}`, 'true');
      localStorage.setItem(`game_token_${game.id}`, token);
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

  const handleStartGame = (boards: GameBoard[], finalQuestion: FinalQuestion) => {
    socket.emit('create-game', { boards, finalQuestion });
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
      navigator.clipboard.writeText(url).then(() => {
         // Simple feedback could be added here
      });
    }
  };

  const resetToSetup = () => {
    window.location.href = window.location.origin;
  };

  if (error) {
    return (
      <main className="error-screen">
        <article className="card-surface p-12 flex flex-col items-center gap-6 max-w-lg">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
            <X size={32} />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-red-500">Security Alert</h1>
          <p className="text-brand-muted text-lg">{error}</p>
          <Button variant="primary" size="lg" onClick={resetToSetup} className="px-12">
            RETURN TO SAFE ZONE
          </Button>
        </article>
      </main>
    );
  }

  return (
    <div className={cn("min-h-screen bg-brand-bg", isHost && 'pt-16')}>
      {!isConnected && (
        <aside className="fixed inset-0 bg-brand-bg/90 backdrop-blur-md z-[200] flex items-center justify-center">
          <div className="text-center space-y-6">
            <Loader2 className="w-16 h-16 text-brand-primary animate-spin mx-auto" strokeWidth={3} />
            <h2 className="text-brand-muted font-black tracking-[0.3em] uppercase italic">Syncing with Trivia Matrix...</h2>
          </div>
        </aside>
      )}

      {/* Persistent View Switcher Menu - Only for Host */}
      {isHost && (
        <nav className="view-switcher flex items-center justify-center gap-2 p-3 bg-slate-950/60 backdrop-blur-2xl border-b border-white/5 fixed top-0 w-full z-[150]">
            {[
              { id: 'setup', label: 'DESIGN', icon: Settings },
              { id: 'host', label: 'MASTER', icon: Zap },
              { id: 'player', label: 'PLAY', icon: Users },
              { id: 'board', label: 'DISPLAY', icon: Monitor }
            ].map((item) => (
              <Button
                key={item.id}
                variant={role === item.id ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleRoleChange(item.id as any)}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] tracking-[0.2em] font-black",
                  role === item.id && "shadow-lg shadow-brand-primary/20"
                )}
              >
                <item.icon size={12} className={cn(role === item.id ? 'text-white' : 'text-brand-muted')} />
                <span className="hidden sm:inline ml-2">{item.label}</span>
              </Button>
            ))}
        </nav>
      )}

      {role === 'setup' && <SetupView onStart={handleStartGame} />}
      
      {/* Global Test & Navigation Controls - Only for Host */}
      {gameState && isHost && (
        <aside className="fixed bottom-6 right-6 z-[100] flex flex-col sm:flex-row gap-3">
          {role === 'host' && (
            <Button variant="ghost" className="card-surface bg-slate-900/80 backdrop-blur-md border border-white/10" onClick={resetToSetup}>
              <Settings size={18} /> <span className="hidden md:inline">Configuration</span>
            </Button>
          )}
          <Button variant="ghost" className="card-surface bg-slate-900/80 backdrop-blur-md border border-white/10" onClick={openPlayerTab}>
            <Users size={18} /> <span className="hidden md:inline">Join as Player</span>
          </Button>
          <Button variant="primary" className="shadow-2xl" onClick={copyJoinLink}>
            <PlayCircle size={18} /> <span className="hidden md:inline">Share Link</span>
          </Button>
        </aside>
      )}

      <AnimatePresence mode="wait">
        {gameState && (
          <motion.div 
            key={role} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="relative"
          >
            {role === 'host' && <HostView gameState={gameState} hostToken={hostToken} />}
            {role === 'player' && <PlayerView gameState={gameState} />}
            {role === 'board' && <BoardView gameState={gameState} />}
          </motion.div>
        )}
      </AnimatePresence>

      {!gameState && role && role !== 'setup' && (
        <main className="empty-state min-h-screen flex items-center justify-center p-6 mt-16">
          <Card className="max-w-md w-full p-12 text-center flex flex-col gap-8 shadow-2xl">
            <div className="w-20 h-20 bg-brand-surface rounded-full flex items-center justify-center mx-auto border-2 border-white/5 shadow-inner">
              <Monitor className="text-brand-muted" size={32} />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">NO ACTIVE SIGNAL</h2>
              <p className="text-brand-muted text-sm leading-relaxed">The board is currently offline. You must finalize the configuration in SETUP to broadcast the session.</p>
            </div>
            <Button variant="primary" size="lg" onClick={() => setRole('setup')}>
              REESTABLISH CONNECTION
            </Button>
          </Card>
        </main>
      )}
      <Footer />
    </div>
  );
}
