import { useState } from 'react';
import { useGameStore } from '../store';
import { GAME_DEFINITIONS, type GameType } from '../types';

const ALL_GAME_TYPES = Object.keys(GAME_DEFINITIONS) as GameType[];

export default function LobbyScreen() {
  const { game, playerId, generateTeams, configureSession, startNextRound, leaveGame } = useGameStore();

  // Session config state
  const [totalGames, setTotalGames] = useState(6);
  const [selectedTypes, setSelectedTypes] = useState<GameType[]>(ALL_GAME_TYPES);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [showConfig, setShowConfig] = useState(false);

  if (!game) return null;

  const isHost = game.players.find((p) => p.id === game.hostId)?.id === playerId;
  const hasTeams = game.teams.length > 0;
  const isConfigured = !!game.sessionConfig;
  const joinUrl = `${window.location.origin}?join=${game.id}`;

  const toggleType = (type: GameType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleConfigureSession = () => {
    if (selectedTypes.length === 0) return;
    configureSession({ totalGames, gameTypes: selectedTypes });
    setShowConfig(false);
  };

  const handleStartFirstRound = () => {
    startNextRound(timerSeconds);
  };

  const teamForPlayer = (pid: string) =>
    game.teams.find((t) => t.players.some((p) => p.id === pid));

  return (
    <div className="screen lobby-screen">
      <h2 className="screen-title">Sala de Espera</h2>

      {/* Join link */}
      <div className="card join-link-card">
        <span className="field-label">Comparte este ID de Partida</span>
        <div className="join-link-row">
          <code className="game-id">{game.id}</code>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigator.clipboard.writeText(joinUrl)}
          >
            Copiar Enlace
          </button>
        </div>
      </div>

      {/* Players */}
      <div className="card">
        <h3 className="section-title">Jugadores ({game.players.length})</h3>
        <ul className="player-list">
          {game.players.map((p) => {
            const team = teamForPlayer(p.id);
            return (
              <li key={p.id} className={`player-item ${p.id === playerId ? 'me' : ''}`}>
                <span className="player-avatar">{p.avatar}</span>
                <span className="player-name">
                  {p.name}
                  {p.id === game.hostId && <span className="badge host-badge">ANFITRIÓN</span>}
                  {p.id === playerId && <span className="badge me-badge">TÚ</span>}
                </span>
                {team && (
                  <span className="player-team-badge" style={{ marginLeft: 'auto' }}>
                    {team.avatar} {team.name}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Teams */}
      {hasTeams && (
        <div className="card">
          <h3 className="section-title">Equipos</h3>
          <div className="teams-grid">
            {game.teams.map((t) => (
              <div key={t.id} className="team-card">
                <div className="team-header">
                  <span className="team-avatar">{t.avatar}</span>
                  <span className="team-name">{t.name}</span>
                  <span className="team-points">{t.points} pts</span>
                </div>
                <ul className="team-players">
                  {t.players.map((p) => (
                    <li key={p.id}>
                      {p.avatar} {p.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session config summary */}
      {isConfigured && game.sessionConfig && (
        <div className="card session-summary">
          <h3 className="section-title">Sesión Configurada</h3>
          <p className="hint">
            <strong>{game.sessionConfig.totalGames} rondas</strong> en orden aleatorio.
          </p>
          <div className="game-type-pills">
            {game.sessionConfig.gameTypes.map((t) => (
              <span key={t} className="game-type-pill">
                {GAME_DEFINITIONS[t].name}
              </span>
            ))}
          </div>
          <p className="hint">
            Los turnos se asignan en <strong>round-robin</strong> automáticamente. El jugador activo
            de cada equipo rota en cada ronda.
          </p>
        </div>
      )}

      {/* Host actions */}
      {isHost && (
        <div className="btn-group">
          {!hasTeams && (
            <button className="btn btn-secondary" onClick={generateTeams}>
              Generar Equipos
            </button>
          )}
          {hasTeams && (
            <button className="btn btn-ghost" onClick={generateTeams}>
              Reorganizar Equipos
            </button>
          )}
          {hasTeams && !isConfigured && (
            <button className="btn btn-secondary" onClick={() => setShowConfig(true)}>
              Configurar Sesión
            </button>
          )}
          {isConfigured && (
            <button className="btn btn-primary" onClick={handleStartFirstRound}>
              ¡Empezar Partida!
            </button>
          )}
          <button className="btn btn-danger" onClick={leaveGame}>
            Abandonar Partida
          </button>
        </div>
      )}

      {!isHost && (
        <div className="btn-group">
          <button className="btn btn-danger" onClick={leaveGame}>
            Salir de la Partida
          </button>
        </div>
      )}

      {/* Config modal */}
      {showConfig && (
        <div className="modal-backdrop" onClick={() => setShowConfig(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Configurar Sesión</h3>

            <p className="hint">
              El anfitrión solo elige <strong>cuántas rondas</strong> y <strong>qué juegos</strong>{' '}
              incluir. El sistema se encarga de todo lo demás: ordena los juegos al azar, rota los
              equipos y selecciona el jugador activo automáticamente.
            </p>

            {/* Total games */}
            <label className="field-label">
              Número de Rondas: <strong>{totalGames}</strong>
            </label>
            <input
              type="range"
              min={3}
              max={20}
              step={1}
              value={totalGames}
              onChange={(e) => setTotalGames(Number(e.target.value))}
            />

            {/* Game types */}
            <label className="field-label">Juegos a Incluir</label>
            <div className="game-type-checkboxes">
              {ALL_GAME_TYPES.map((type) => {
                const def = GAME_DEFINITIONS[type];
                const checked = selectedTypes.includes(type);
                return (
                  <button
                    key={type}
                    className={`game-type-toggle ${checked ? 'selected' : ''}`}
                    onClick={() => toggleType(type)}
                  >
                    <span className="gtog-name">{def.name}</span>
                    <span className="gtog-desc">{def.description}</span>
                    <span className="gtog-rule-badge">
                      {def.playerSelection === 'round-robin' ? '↻ Turno rotativo' : '🎲 Al azar'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Timer */}
            <label className="field-label">
              Tiempo por ronda: <strong>{timerSeconds}s</strong>
            </label>
            <input
              type="range"
              min={15}
              max={180}
              step={5}
              value={timerSeconds}
              onChange={(e) => setTimerSeconds(Number(e.target.value))}
            />

            <div className="btn-group">
              <button
                className="btn btn-primary"
                disabled={selectedTypes.length === 0}
                onClick={handleConfigureSession}
              >
                Confirmar Sesión
              </button>
              <button className="btn btn-ghost" onClick={() => setShowConfig(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
