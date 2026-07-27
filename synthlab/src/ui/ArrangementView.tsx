import { useTracksStore } from "../store/tracksStore";

const BARS = 8;

export function ArrangementView() {
  const tracks = useTracksStore((state) => state.tracks);
  const selectTrack = useTracksStore((state) => state.selectTrack);
  const selectedTrackId = useTracksStore((state) => state.selectedTrackId);

  return (
    <section className="arrangement-view" aria-label="Arrangement View">
      <div className="arrangement-view__overview" aria-label="Arrangement-Übersicht">
        <span />
      </div>
      <div className="arrangement-view__ruler" aria-hidden="true">
        <div />
        {Array.from({ length: BARS }, (_, index) => <span key={index}>{index + 1}</span>)}
      </div>
      <div className="arrangement-view__tracks">
        {tracks.map((track) => (
          <div
            className={`arrangement-track${selectedTrackId === track.id ? " arrangement-track--selected" : ""}`}
            key={track.id}
            onClick={() => selectTrack(track.id)}
          >
            <header>
              <strong>{track.name}</strong>
              <small>{track.muted ? "Muted" : track.armed ? "Armed" : ""}</small>
            </header>
            <div className="arrangement-track__lane">
              {track.clips.map((clip, index) => (
                <button
                  type="button"
                  className="arrangement-clip"
                  key={clip.id}
                  style={{
                    left: `${(index * 2 / BARS) * 100}%`,
                    width: `${Math.min(100, clip.lengthBeats / (BARS * 4) * 100)}%`,
                  }}
                  title={`${clip.name}, ${clip.lengthBeats} Beats`}
                >
                  {clip.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

