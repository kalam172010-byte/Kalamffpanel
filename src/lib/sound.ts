// Audio chime synthesizer using standard Web Audio API
// No external mp3 files required, 100% reliable across browsers and offline

let isAudioMuted = false;

export function getSoundMuted(): boolean {
  try {
    const saved = localStorage.getItem('kalam_admin_sound_muted');
    if (saved !== null) {
      isAudioMuted = saved === 'true';
    }
  } catch {}
  return isAudioMuted;
}

export function setSoundMuted(muted: boolean): void {
  isAudioMuted = muted;
  try {
    localStorage.setItem('kalam_admin_sound_muted', muted ? 'true' : 'false');
  } catch {}
}

/**
 * Play a synthesized sound effect for store notifications
 */
export function playNotificationSound(type: 'deposit' | 'purchase' | 'alert' = 'deposit') {
  if (getSoundMuted()) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (type === 'deposit') {
      // 🔔 Crisp Money / Deposit Chime (D5 -> A5 -> D6 Cash sound)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      // Chime note frequencies
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880.00, now + 0.1); // A5
      osc1.frequency.setValueAtTime(1174.66, now + 0.22); // D6
      osc1.frequency.setValueAtTime(1760.00, now + 0.35); // A6

      osc2.frequency.setValueAtTime(1174.66, now);
      osc2.frequency.setValueAtTime(1760.00, now + 0.22);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.75);
      osc2.stop(now + 0.75);
    } else if (type === 'purchase') {
      // 💎 Premium Product / Key Delivery Chime (Ascending triad C5 -> E5 -> G5 -> C6)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.09); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.18); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.27); // C6
      osc.frequency.setValueAtTime(1318.51, now + 0.38); // E6

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } else {
      // ⚠️ Alert / Notification Pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (err) {
    console.warn('[Audio] Notification sound warning:', err);
  }
}
