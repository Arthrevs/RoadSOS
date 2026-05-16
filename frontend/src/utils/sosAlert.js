/**
 * SOS alert — emergency audio tone + device torch flash.
 *
 * Called the moment SOS fires (manual tap or crash auto-send) to maximise
 * visibility when the phone may be face-down or the user is incapacitated.
 *
 * Both channels are best-effort:
 *   • Web Audio API may be blocked in some browsers (no autoplay policy hit
 *     because we only call this inside a user-gesture handler).
 *   • Torch requires a rear camera with torch capability + HTTPS + permission.
 *     No permission prompt is shown — if the browser declines, we move on.
 */

let _audioCtx = null;

// ─── Audio ────────────────────────────────────────────────────────────────────

/**
 * Play a 3-beep SOS alert (high–low–high) via Web Audio API.
 * Total duration ≈ 0.55 s so it doesn't block the UI thread.
 */
export function playSOSAlert() {
  try {
    _audioCtx =
      _audioCtx ||
      new (window.AudioContext || window.webkitAudioContext)();

    // Browsers may suspend AudioContext until a user gesture; resume if so.
    if (_audioCtx.state === 'suspended') _audioCtx.resume();

    const BEEPS = [
      { freq: 880, start: 0.00, dur: 0.12 },   // high
      { freq: 660, start: 0.18, dur: 0.12 },   // low
      { freq: 880, start: 0.36, dur: 0.18 },   // high (longer)
    ];

    BEEPS.forEach(({ freq, start, dur }) => {
      const osc  = _audioCtx.createOscillator();
      const gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, _audioCtx.currentTime + start);

      // Ramp up → sustain → ramp down (no click artifacts)
      gain.gain.setValueAtTime(0, _audioCtx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.55, _audioCtx.currentTime + start + 0.01);
      gain.gain.linearRampToValueAtTime(0,    _audioCtx.currentTime + start + dur);

      osc.start(_audioCtx.currentTime + start);
      osc.stop (_audioCtx.currentTime + start + dur + 0.02);
    });
  } catch {
    // Web Audio unavailable (old browser, WebView restriction, etc.)
  }
}

// ─── Torch ────────────────────────────────────────────────────────────────────

/**
 * Flash the device torch 3× (on–off–on–off–on–off) as a visual distress signal.
 * Runs async; always resolves — never throws.
 */
export async function flashTorch() {
  let stream = null;
  try {
    stream = await navigator.mediaDevices?.getUserMedia({
      video: { facingMode: 'environment' },
    });
    if (!stream) return;

    const track = stream.getVideoTracks()[0];
    if (!track) return;

    const caps = track.getCapabilities?.();
    if (!caps?.torch) return; // device has no torch — skip silently

    const PATTERN = [true, false, true, false, true, false];
    for (const on of PATTERN) {
      await track.applyConstraints({ advanced: [{ torch: on }] });
      await new Promise(r => setTimeout(r, 300));
    }
    // Ensure torch is off when done
    await track.applyConstraints({ advanced: [{ torch: false }] });
  } catch {
    // Permission denied, no camera, torch API unsupported — all silent
  } finally {
    stream?.getTracks().forEach(t => t.stop());
  }
}

// ─── Combined entry point ─────────────────────────────────────────────────────

/**
 * Fire both alert channels simultaneously (non-blocking).
 * Call this inside a user-gesture handler (button click / crash auto-fire).
 */
export function triggerSOSAlert() {
  playSOSAlert();   // sync, ~0 ms delay
  flashTorch();     // async, fire-and-forget
}
