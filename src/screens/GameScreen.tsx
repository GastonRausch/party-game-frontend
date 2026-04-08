import { useGameStore } from '../store';
import {
  GAME_DEFINITIONS,
  MODALITY_LABELS,
  type RoundContent,
  type MovieRoundContent,
  type ThreeCluesRoundContent,
} from '../types';

// ─── Per-game content panels (active player only) ─────────────────────────────

function MovieContent({ content }: { content: MovieRoundContent }) {
  return (
    <div className="content-reveal">
      <span className="content-modality-label">{MODALITY_LABELS[content.modality]}</span>
      {content.image && (
        <img
          src={content.image}
          alt={`Póster de ${content.movie}`}
          className="movie-poster"
        />
      )}
      <span className="content-value">{content.reveal}</span>
      {content.modality === 'actua' && (
        <span className="content-hint">Actúa la película sin hablar</span>
      )}
      {content.modality === 'dialogo' && (
        <span className="content-hint">Di esta frase sin mencionar el título</span>
      )}
      {content.modality === 'personaje' && (
        <span className="content-hint">Describe o actúa este personaje</span>
      )}
    </div>
  );
}

function ThreeCluesContent({ content }: { content: ThreeCluesRoundContent }) {
  return (
    <div className="content-reveal">
      <span className="content-label">La palabra secreta:</span>
      <span className="content-value">{content.word}</span>
      <div className="clues-list">
        <span className="content-hint">Tus pistas preparadas:</span>
        {content.clues.map((c, i) => (
          <span key={i} className="clue-chip">
            {i + 1}. {c}
          </span>
        ))}
      </div>
    </div>
  );
}

function ActivePlayerContent({ content }: { content: RoundContent }) {
  if (content.type === 'movie') return <MovieContent content={content} />;
  if (content.type === 'three-clues') return <ThreeCluesContent content={content} />;
  if (content.type === 'pictionary') {
    return (
      <div className="content-reveal">
        <span className="content-label">Dibuja esto:</span>
        <span className="content-value">{content.word}</span>
        <span className="content-hint">Sin letras, números ni hablar</span>
      </div>
    );
  }
  if (content.type === 'answer-wrong') {
    return (
      <div className="content-reveal answer-wrong-reveal">
        <span className="content-label">Pregunta para todos:</span>
        <span className="content-value question-text">{content.question}</span>
        <span className="content-hint">Cada equipo da la respuesta incorrecta más creativa</span>
      </div>
    );
  }
  return null;
}

// ─── Spectator panel (shown to everyone, no content) ─────────────────────────

function SpectatorPanel({
  gameType,
  isAnswerWrong,
  question,
}: {
  gameType: string;
  isAnswerWrong: boolean;
  question?: string;
}) {
  const def = GAME_DEFINITIONS[gameType as keyof typeof GAME_DEFINITIONS];
  return (
    <div className="card spectator-panel">
      {isAnswerWrong && question ? (
        <>
          <span className="content-label">¡Pregunta para todos!</span>
          <span className="question-big">{question}</span>
          <span className="hint">Piensa en la respuesta incorrecta más creativa y divertida</span>
        </>
      ) : (
        <>
          <p className="game-rules">{def?.rules}</p>
        </>
      )}
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function GameScreen() {
  const { game, playerId, timerRemaining, roundsLeft, addPoints, startTimer, endRound, leaveGame } =
    useGameStore();

  if (!game || !game.currentRound) return null;

  const round = game.currentRound;
  const isHost = game.players.find((p) => p.id === game.hostId)?.id === playerId;
  const isActivePlayer = round.activePlayerId === playerId;
  const activePlayer = game.players.find((p) => p.id === round.activePlayerId);
  const activeTeam = game.teams.find((t) => t.id === round.teamId);
  const gameDef = GAME_DEFINITIONS[round.gameType];

  const timerMax = round.timerMax ?? 60;
  const currentTimer = timerRemaining ?? timerMax;
  const timerPct = (currentTimer / timerMax) * 100;
  const timerDanger = currentTimer <= 10;

  const isAnswerWrong = round.gameType === 'respuesta-incorrecta-gana';

  // For answer-wrong, the question is shown to everyone (in spectator view too)
  const awQuestion =
    isAnswerWrong && round.content?.type === 'answer-wrong'
      ? round.content.question
      : undefined;

  return (
    <div className="screen game-screen">

      {/* Rondas restantes */}
      {roundsLeft != null && (
        <div className="rounds-left-badge">
          {roundsLeft > 0 ? `${roundsLeft} ronda${roundsLeft !== 1 ? 's' : ''} restante${roundsLeft !== 1 ? 's' : ''}` : 'Última ronda'}
        </div>
      )}

      {/* Scoreboard */}
      <div className="scoreboard">
        {game.teams.map((t) => (
          <div
            key={t.id}
            className={`score-card ${t.id === round.teamId ? 'active-team' : ''}`}
          >
            <span className="score-avatar">{t.avatar}</span>
            <span className="score-name">{t.name}</span>
            <span className="score-pts">{t.points}</span>
          </div>
        ))}
      </div>

      {/* Timer */}
      <div className={`timer-bar-wrap ${timerDanger ? 'danger' : ''}`}>
        <div className="timer-bar" style={{ width: `${timerPct}%` }} />
      </div>
      <div className={`timer-display ${timerDanger ? 'danger' : ''}`}>
        {currentTimer}s
      </div>

      {/* Game name + modality */}
      <div className="card game-info-card">
        <h2 className="game-type-title">{gameDef.name}</h2>
        {round.gameType === 'adivina-la-pelicula' && round.content?.type === 'movie' && (
          <span className="modality-badge">
            Modalidad: {MODALITY_LABELS[round.content.modality]}
          </span>
        )}
      </div>

      {/* Active player */}
      <div className={`card active-player-card ${isActivePlayer ? 'is-me' : ''}`}>
        <span className="active-label">Jugador Activo</span>
        <div className="active-player-info">
          <span className="player-avatar large">{activePlayer?.avatar}</span>
          <div className="active-player-text">
            <span className="player-name">{activePlayer?.name}</span>
            {activeTeam && (
              <span className="team-tag">
                {activeTeam.avatar} {activeTeam.name}
              </span>
            )}
          </div>
          <span className="turn-badge">↻ Turno rotativo</span>
        </div>

        {/* Content: only shown to the active player */}
        {isActivePlayer && round.content && (
          <ActivePlayerContent content={round.content} />
        )}
      </div>

      {/* Spectator panel / answer-wrong question for all */}
      {(!isActivePlayer || isAnswerWrong) && (
        <SpectatorPanel
          gameType={round.gameType}
          isAnswerWrong={isAnswerWrong}
          question={awQuestion}
        />
      )}

      {/* Host controls */}
      {isHost && (
        <div className="card host-controls">
          <h3 className="section-title">Controles del Anfitrión</h3>

          {/* Start timer (only if not yet started) */}
          {timerRemaining === timerMax && (
            <button className="btn btn-primary" onClick={startTimer}>
              ▶ Iniciar Cronómetro
            </button>
          )}

          {/* Points */}
          {!isAnswerWrong ? (
            <div className="points-section">
              <span className="field-label">Dar puntos a {activeTeam?.name}:</span>
              <div className="points-btns">
                {[1, 2, 3].map((pts) => (
                  <button
                    key={pts}
                    className="btn btn-secondary"
                    onClick={() => addPoints(round.teamId, pts)}
                  >
                    +{pts}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="points-section">
              <span className="field-label">Otorgar puntos al equipo ganador:</span>
              <div className="points-btns-teams">
                {game.teams.map((t) => (
                  <button
                    key={t.id}
                    className="btn btn-secondary team-point-btn"
                    onClick={() => addPoints(t.id, 2)}
                  >
                    {t.avatar} {t.name} <span className="pts-label">+2</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button className="btn btn-danger" onClick={endRound}>
            Terminar Ronda
          </button>
        </div>
      )}

      {/* Exit button — available to everyone */}
      <button className="btn btn-ghost exit-btn" onClick={leaveGame}>
        {isHost ? 'Abandonar Partida' : 'Salir de la Partida'}
      </button>
    </div>
  );
}
