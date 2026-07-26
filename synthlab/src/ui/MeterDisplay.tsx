import { useEffect, useState } from "react";
import { AudioController } from "../audio/AudioController";
import type { MeterReading } from "../audio/core/Meters";

export function MeterDisplay() {
  const [meter, setMeter] = useState<MeterReading>({ peakL: 0, peakR: 0, rms: 0, correlation: 1 });
  const [voiceCount, setVoiceCount] = useState(0);

  useEffect(() => {
    const unsub = AudioController.onMeter((m) => {
      setMeter(m);
      setVoiceCount(AudioController.activeVoiceCount);
    });
    return unsub;
  }, []);

  return (
    <>
      <span className="transport-bar__voices">Voices: {voiceCount}</span>
      <span className="transport-bar__meter">
        Peak {meter.peakL.toFixed(2)}/{meter.peakR.toFixed(2)} · RMS {meter.rms.toFixed(2)}
      </span>
    </>
  );
}
