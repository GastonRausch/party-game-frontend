import { useGameStore } from '../store';

export default function ResultScreen() {
  const { game, playerId, sessionFinished, roundsLeft, startNextRound, leaveGame, resetSession } =
    useGameStore();

  if (!game) return null;

  const isHost = game.players.find((p) => p.id === game.hostId)?.id === playerId;
  const sorted = [...game.teams].sort((a, b) => b.points - a.points);
  const winner = sorted[0];

  return (
    <div className="screen result-screen">
      <h2 className="screen-title">
        {sessionFinished ? '🏆 ¡Fin de la Sesión!' : '⏱ ¡Ronda Terminada!'}
      </h2>

      {/* Winner highlight */}
      {winner && (
        <div className="winner-card">
          <div className="winner-crown">👑</div>
          <div className="winner-avatar">{winner.avatar}</div>
          <div className="winner-name">{winner.name}</div>
          <div className="winner-pts">{winner.points} puntos</div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="card">
        <h3 className="section-title">Clasificación</h3>
        <ol className="leaderboard">
          {sorted.map((t, i) => (
            <li key={t.id} className={`lb-row rank-${i + 1}`}>
              <span className="lb-rank">#{i + 1}</span>
              <span className="lb-avatar">{t.avatar}</span>
              <span className="lb-name">{t.name}</span>
              <span className="lb-pts">{t.points} pts</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Rounds info */}
      {!sessionFinished && roundsLeft != null && roundsLeft > 0 && (
        <p className="hint rounds-info">
          Quedan <strong>{roundsLeft}</strong> ronda{roundsLeft !== 1 ? 's' : ''} en la sesión.
        </p>
      )}

      {/* Host controls */}
      {isHost && (
        <div className="btn-group">
          {!sessionFinished && roundsLeft != null && roundsLeft > 0 ? (
            <button className="btn btn-primary" onClick={() => startNextRound()}>
              ▶ Siguiente Ronda
            </button>
          ) : sessionFinished ? (
            <button className="btn btn-primary" onClick={resetSession}>
              ▶ Nueva Sesión (mismos equipos)
            </button>
          ) : null}
          <button className="btn btn-danger" onClick={leaveGame}>
            Terminar y Salir
          </button>
        </div>
      )}

      {!isHost && !sessionFinished && (
        <p className="hint" style={{ textAlign: 'center' }}>
          Esperando al anfitrión para continuar...
        </p>
      )}

      {!isHost && sessionFinished && (
        <div className="btn-group">
          <button className="btn btn-danger" onClick={leaveGame}>
            Salir de la Partida
          </button>
        </div>
      )}
    </div>
  );
}
