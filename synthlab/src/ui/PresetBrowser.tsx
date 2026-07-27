import { useMemo, useRef, useEffect, useState } from "react";
import { useSessionStore } from "../store/sessionStore";
import { ENGINES } from "../audio/engines/registry";
import { ROLES } from "../presets/schema";
import { saveSongProjectJson, loadSongProjectJson } from "../store/projectSerializer";

const ROW_HEIGHT = 30;
const OVERSCAN = 10;

export function PresetBrowser() {
  const bank = useSessionStore((s) => s.bank);
  const filter = useSessionStore((s) => s.filter);
  const setFilter = useSessionStore((s) => s.setFilter);
  const currentIndex = useSessionStore((s) => s.currentIndex);
  const setIndexInFiltered = useSessionStore((s) => s.setIndexInFiltered);
  const ratings = useSessionStore((s) => s.ratings);
  const favorites = useSessionStore((s) => s.favorites);
  const discarded = useSessionStore((s) => s.discarded);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

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
    else if (rowTop + ROW_HEIGHT > el.scrollTop + el.clientHeight) {
      el.scrollTop = rowTop - el.clientHeight + ROW_HEIGHT * 2;
    }
  }, [currentPos]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const updateContainerHeight = () => setContainerHeight(el.clientHeight || 400);
    updateContainerHeight();

    const onScroll = () => setScrollTop(el.scrollTop);
    const resizeObserver = new ResizeObserver(updateContainerHeight);
    el.addEventListener("scroll", onScroll);
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
    };
  }, []);

  const totalCount = filteredIndices.length;
  const sliderPosition = currentPos >= 0 ? currentPos : 0;
  const totalHeight = totalCount * ROW_HEIGHT;

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(totalCount - 1, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN);

  const visibleIndices = useMemo(() => {
    const items: { pos: number; bankIdx: number }[] = [];
    for (let pos = startIndex; pos <= endIndex; pos++) {
      if (filteredIndices[pos] !== undefined) {
        items.push({ pos, bankIdx: filteredIndices[pos] });
      }
    }
    return items;
  }, [startIndex, endIndex, filteredIndices]);

  const engineOptions = useMemo(() => ["", ...ENGINES.map((e) => e.id)], []);

  return (
    <div className="preset-browser">
      {/* Song Project Section (Save & Load .json) */}
      <div
        style={{
          padding: "8px 10px",
          background: "#1e1d1b",
          borderBottom: "1px solid #33312f",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ fontSize: 11, color: "var(--color-accent, #fbad60)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            📁 Song-Projekte (.json)
          </strong>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={() => {
              const name = prompt("Name für das Song-Projekt eingeben:", "Mein_SynthLab_Song");
              if (name) saveSongProjectJson(name);
            }}
            style={{
              flex: 1,
              background: "var(--color-accent, #fbad60)",
              color: "#000",
              border: "none",
              borderRadius: 4,
              padding: "5px 8px",
              fontWeight: 700,
              fontSize: 10.5,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
            title="Gesamten Song (Spuren, Instrumente, Presets, Parameter, Clips & MIDI-Noten) als .json speichern"
          >
            💾 Song speichern
          </button>

          <label
            style={{
              flex: 1,
              background: "#2a2826",
              color: "#fff",
              border: "1px solid #444",
              borderRadius: 4,
              padding: "5px 8px",
              fontWeight: 700,
              fontSize: 10.5,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              textAlign: "center",
            }}
            title="Song-Projekt aus einer .json Datei laden"
          >
            📂 Song laden
            <input
              type="file"
              accept=".json,.synthlab.json"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void loadSongProjectJson(file);
                  e.target.value = "";
                }
              }}
            />
          </label>
        </div>
      </div>

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
              {id ? ENGINES.find((e) => e.id === id)?.name : "all synthesizers"}
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
      <div className="preset-browser__navigation">
        <span className="preset-browser__count">{filteredIndices.length} / {bank.length} Presets</span>
        <input
          className="preset-browser__scrubber"
          type="range"
          min={0}
          max={Math.max(0, totalCount - 1)}
          value={sliderPosition}
          disabled={totalCount === 0}
          onChange={(event) => setIndexInFiltered(Number(event.target.value))}
          aria-label="Durch alle gefilterten Presets navigieren"
          aria-valuetext={totalCount > 0 ? `Preset ${sliderPosition + 1} von ${totalCount}` : "Keine Presets"}
        />
        <span className="preset-browser__position">{totalCount > 0 ? `${sliderPosition + 1} / ${totalCount}` : "0 / 0"}</span>
      </div>
      <div
        className="preset-browser__list"
        ref={listRef}
        style={{ position: "relative" }}
        tabIndex={0}
        role="listbox"
        aria-label="Gefilterte Presets"
      >
        <div style={{ height: totalHeight, width: "100%", position: "relative" }}>
          {visibleIndices.map(({ pos, bankIdx }) => {
            const p = bank[bankIdx];
            const isCurrent = bankIdx === currentIndex;
            const rating = ratings[p.id] ?? 0;
            return (
              <div
                key={p.id}
                className={`preset-row${isCurrent ? " preset-row--active" : ""}`}
                style={{
                  position: "absolute",
                  top: pos * ROW_HEIGHT,
                  left: 0,
                  right: 0,
                  height: ROW_HEIGHT,
                }}
                onClick={() => setIndexInFiltered(pos)}
              >
                <span className="preset-row__fav">{favorites[p.id] ? "★" : ""}</span>
                <span className="preset-row__name">{p.name}</span>
                <span className="preset-row__rating">{rating > 0 ? "●".repeat(rating) : ""}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
