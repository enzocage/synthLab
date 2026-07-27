// Slot-getriebene FX-Kette (plan10 §5.1): baut den Audiographen aus der
// geordneten Slot-Liste des V2-Racks (fxRackFromLegacy), statt sieben fest
// verdrahtete Member zu halten. Neue Module (plan10) brauchen dadurch keine
// Änderung an dieser Datei mehr - nur einen Registry-Eintrag mit `create`.
//
// Hot-Path-Optimierung: Reglerbewegungen/Enabled-Umschalten ändern die
// Slot-REIHENFOLGE nicht - in diesem (häufigsten) Fall wird nur `update()`
// auf den bestehenden Node-Instanzen aufgerufen (kein Reconnect, kein Klick).
// Nur wenn sich das Set/die Reihenfolge der Slot-Typen tatsächlich ändert
// (Rack umsortiert, Modul hinzugefügt/entfernt), wird der Graph neu verkabelt.
import { fxRackFromLegacy } from "./types";
import type { FxChainSettings } from "./types";
import { getFxFactory, type FxNode } from "./registry";

export class FxChain {
  readonly input: GainNode;
  readonly output: GainNode;
  private ctx: BaseAudioContext;
  private nodes = new Map<string, FxNode>();
  private slotTypesKey = "";
  private started = false;
  private startedAt = 0;

  constructor(ctx: BaseAudioContext, settings: FxChainSettings) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.rebuild(settings);
  }

  /** Muss einmalig aufgerufen werden, um interne LFOs/Oszillatoren zu starten. */
  start(time: number): void {
    this.started = true;
    this.startedAt = time;
    for (const node of this.nodes.values()) node.start?.(time);
  }

  update(settings: FxChainSettings): void {
    const rack = fxRackFromLegacy(settings);
    const key = rack.slots.map((s) => s.type).join("|");
    if (key !== this.slotTypesKey) {
      this.rebuild(settings);
      return;
    }
    for (const slot of rack.slots) {
      this.nodes.get(slot.id)?.update({ enabled: slot.enabled, ...slot.params });
    }
  }

  setFreeze(freeze: boolean): void {
    for (const node of this.nodes.values()) node.setFreeze?.(freeze);
  }

  private rebuild(settings: FxChainSettings): void {
    for (const node of this.nodes.values()) {
      try { node.dispose(); } catch { /* noop */ }
    }
    this.nodes.clear();
    try { this.input.disconnect(); } catch { /* noop */ }

    const rack = fxRackFromLegacy(settings);
    this.slotTypesKey = rack.slots.map((s) => s.type).join("|");

    let prev: AudioNode = this.input;
    for (const slot of rack.slots) {
      const factory = getFxFactory(slot.type);
      if (!factory) continue; // Slot-Typ ohne Audio-Implementierung (noch) - übersprungen, nicht verworfen (bleibt im Preset erhalten)
      const node = factory(this.ctx, { enabled: slot.enabled, ...slot.params });
      this.nodes.set(slot.id, node);
      prev.connect(node.input);
      prev = node.output;
      if (this.started) node.start?.(this.startedAt);
    }
    prev.connect(this.output);
  }

  dispose(): void {
    for (const node of this.nodes.values()) {
      try { node.dispose(); } catch { /* noop */ }
    }
    this.nodes.clear();
    this.input.disconnect();
    this.output.disconnect();
  }
}
