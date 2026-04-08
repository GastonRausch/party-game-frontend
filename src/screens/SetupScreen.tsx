import { useState } from 'react';
import { useGameStore } from '../store';

const AVATARS = ['🐸', '🦊', '🐻', '🐙', '🦁', '🐷', '🐨', '🦄', '🐵', '🦋', '🐬', '🦚'];

export default function SetupScreen() {
  const {
    playerName,
    playerAvatar,
    pendingJoinId,
    setPlayerName,
    setPlayerAvatar,
    createGame,
    joinGame,
  } = useGameStore();

  const [manualJoinId, setManualJoinId] = useState('');

  // If there's an invite link, land directly on the join form
  const [mode, setMode] = useState<'choice' | 'host' | 'join'>(
    pendingJoinId ? 'join' : 'choice',
  );

  const canProceed = playerName.trim().length >= 2;

  // The ID to actually join: invite-link ID takes priority, then manual input
  const resolvedJoinId = pendingJoinId ?? manualJoinId.trim();

  const handleJoin = () => {
    if (!canProceed || !resolvedJoinId) return;
    joinGame(resolvedJoinId);
  };

  return (
    <div className="screen setup-screen">
      <h1 className="app-title">🎉 Party Game</h1>
      <p className="subtitle">Reúne a tu grupo y jueguen juntos</p>

      {/* Name & avatar — always shown */}
      <div className="card">
        <label className="field-label">Tu Nombre</label>
        <input
          className="input"
          placeholder="Escribe tu nombre..."
          value={playerName}
          maxLength={20}
          onChange={(e) => setPlayerName(e.target.value)}
        />

        <label className="field-label">Elige un Avatar</label>
        <div className="avatar-grid">
          {AVATARS.map((av) => (
            <button
              key={av}
              className={`avatar-btn ${playerAvatar === av ? 'selected' : ''}`}
              onClick={() => setPlayerAvatar(av)}
            >
              {av}
            </button>
          ))}
        </div>
      </div>

      {/* ── Choice ── */}
      {mode === 'choice' && (
        <div className="btn-group">
          <button
            className="btn btn-primary"
            disabled={!canProceed}
            onClick={() => setMode('host')}
          >
            Crear Partida
          </button>
          <button
            className="btn btn-secondary"
            disabled={!canProceed}
            onClick={() => setMode('join')}
          >
            Unirse a Partida
          </button>
        </div>
      )}

      {/* ── Host ── */}
      {mode === 'host' && (
        <div className="card">
          <p className="hint">Recibirás un enlace para compartir con tus amigos.</p>
          <div className="btn-group">
            <button className="btn btn-primary" disabled={!canProceed} onClick={createGame}>
              ¡Crear Partida!
            </button>
            <button className="btn btn-ghost" onClick={() => setMode('choice')}>
              Volver
            </button>
          </div>
        </div>
      )}

      {/* ── Join ── */}
      {mode === 'join' && (
        <div className="card">
          <label className="field-label">ID de la Partida</label>

          {pendingJoinId ? (
            /* Invite link was used — show the ID pre-filled, read-only */
            <div className="invite-id-box">
              <span className="invite-id-value">{pendingJoinId}</span>
              <span className="invite-id-hint">ID detectado desde el enlace de invitación</span>
            </div>
          ) : (
            /* No link — let the user type it */
            <input
              className="input"
              placeholder="Pega el ID aquí..."
              value={manualJoinId}
              onChange={(e) => setManualJoinId(e.target.value)}
            />
          )}

          <div className="btn-group">
            <button
              className="btn btn-primary"
              disabled={!canProceed || !resolvedJoinId}
              onClick={handleJoin}
            >
              ¡Unirse!
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setMode('choice')}
            >
              Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
