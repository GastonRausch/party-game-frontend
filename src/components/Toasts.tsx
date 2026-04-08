import { useGameStore } from '../store';

export default function Toasts() {
  const toasts = useGameStore((s) => s.toasts);
  if (!toasts.length) return null;
  return (
    <div className="toasts-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
