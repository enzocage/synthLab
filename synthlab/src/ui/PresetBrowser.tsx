import { useMemo, useRef, useEffect } from "react";
import { useSessionStore } from "../store/sessionStore";
import { ENGINES } from "../audio/engines/registry";
import { ROLES } from "../presets/schema";

const ROW_HEIGHT = 30;

export function PresetBrowser() {
  const bank = useSessionStore((s) => s.bank);
  const filter = useSessionStore((s) => s.filter);
  const setFilter = useSessionStore((s) => s.setFilter);
  const currentIndex = useSessionStore((s) => s.currentIndex);
  const setIndexInFiltered = useSessionStore((s) => s.setIndexInFiltered);
  const ratings = useSessionStore((s) => s.ratings);
  const favorites = useSessionStore((s) => s.favorites);
  const discarded = useSessionStore((s) => s.discarded);
  const filteredIndices = useMemo(() => {
    const search = filter.search.trim().toLowerCase();
    const indices: number[] = [];
    bank.forEach((p, i) => {
      if (discarded[p.id]) return;
      if (filter.role && !p.roles.includes(filter.role)) return;
      if (filter.engine && p.engine !== filter.engine) return;
      if (filter.onlyUnrated && (ratings[p.id] ?? 0) > 0) return;
      if (filter.onlyFavorites && !favorites[p.id]) return;
      if (search && !p.name.toLowerCase().includes(search) && !p.tags.some((t) => t.includes(search))) return;
      indices.push(i);
    });
    return indices;
  }, [bank, filter, ratings, favorites, discarded]);

  const listRef = useRef<HTMLDivElement>(null);
  const currentPos = filteredIndices.indexOf(currentIndex);

  useEffect(() => {
    if (currentPos < 0 || !listRef.current) return;
    const rowTop = currentPos * ROW_HEIGHT;
    const el = listRef.current;
    if (rowTop < el.scrollTop) el.scrollTop = rowTop;
    else if (rowTop + ROW_HEIGHT > el.scrollTop + el.clientHeight) el.scrollTop = rowTop - el.clientHeight + ROW_HEIGHT * 2;
  }, [currentPos]);

  const engineOptions = useMemo(() => ["", ...ENGINES.map((e) => e.id)], []);

  return (
    <div className="preset-browser">
      <div className="preset-browser__filters">
        <input
          type="text"
          placeholder="Suche (Name/Tag)…"
          value={filter.search}
          onChange={(e) => setFilter({ search: e.target.value })}
        />
        <select value={filter.engine ?? ""} onChange={(e) => setFilter({ engine: e.target.value || null })}>
          {engineOptions.map((id) => (
            <option key={id || "all"} value={id}>
              {id ? ENGINES.find((e) => e.id === id)?.name : "Alle Engines"}
            </option>
          ))}
        </select>
        <select value={filter.role ?? ""} onChange={(e) => setFilter({ role: (e.target.value || null) as never })}>
          <option value="">Alle Rollen</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <label>
          <input type="checkbox" checked={filter.onlyUnrated} onChange={(e) => setFilter({ onlyUnrated: e.target.checked })} />
          nur unbewertet
        </label>
        <label>
          <input type="checkbox" checked={filter.onlyFavorites} onChange={(e) => setFilter({ onlyFavorites: e.target.checked })} />
          nur Favoriten
        </label>
      </div>
      <div className="preset-browser__count">{filteredIndices.length} / {bank.length} Presets</div>
      <div className="preset-browser__list" ref={listRef}>
        {filteredIndices.map((idx) => {
          const p = bank[idx];
          const isCurrent = idx === currentIndex;
          const rating = ratings[p.id] ?? 0;
          return (
            <div
              key={p.id}
              className={`preset-row${isCurrent ? " preset-row--active" : ""}`}
              onClick={() => setIndexInFiltered(filteredIndices.indexOf(idx))}
            >
              <span className="preset-row__fav">{favorites[p.id] ? "★" : ""}</span>
              <span className="preset-row__name">{p.name}</span>
              <span className="preset-row__rating">{rating > 0 ? "●".repeat(rating) : ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
