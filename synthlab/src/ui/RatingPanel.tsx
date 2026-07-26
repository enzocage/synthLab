interface Props {
  rating: number;
  favorite: boolean;
  notes: string;
  tags: string[];
  roles: string[];
  onRate(n: number): void;
  onToggleFavorite(): void;
  onNotesChange(notes: string): void;
  onDiscard(): void;
}

export function RatingPanel({ rating, favorite, notes, tags, roles, onRate, onToggleFavorite, onNotesChange, onDiscard }: Props) {
  return (
    <div className="rating-panel">
      <div className="rating-panel__stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className={n <= rating ? "star star--filled" : "star"}
            onClick={() => onRate(n)}
          >
            ●
          </button>
        ))}
        <button className={favorite ? "fav fav--active" : "fav"} onClick={onToggleFavorite} title="Favorit (F)">
          ★
        </button>
        <button className="discard" onClick={onDiscard} title="Verwerfen (0)">
          ✕
        </button>
      </div>
      <div className="rating-panel__meta">
        <div>Rollen: {roles.join(", ")}</div>
        <div>Tags: {tags.join(", ")}</div>
      </div>
      <textarea
        className="rating-panel__notes"
        placeholder="Notizen…"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
      />
    </div>
  );
}
