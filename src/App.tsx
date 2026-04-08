import { useEffect } from 'react';
import { useGameStore } from './store';
import SetupScreen from './screens/SetupScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import ResultScreen from './screens/ResultScreen';
import Toasts from './components/Toasts';
import './App.css';

export default function App() {
  const { screen, initSocket } = useGameStore();

  useEffect(() => {
    // Read invite link param and store it before wiping the URL
    const params = new URLSearchParams(window.location.search);
    const joinId = params.get('join');
    if (joinId) {
      useGameStore.setState({ pendingJoinId: joinId });
      window.history.replaceState({}, '', '/');
    }

    initSocket();
  }, []);

  return (
    <div className="app">
      {screen === 'setup' && <SetupScreen />}
      {screen === 'lobby' && <LobbyScreen />}
      {screen === 'game' && <GameScreen />}
      {screen === 'result' && <ResultScreen />}
      <Toasts />
    </div>
  );
}
