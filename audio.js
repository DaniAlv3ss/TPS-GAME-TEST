import { gameState } from './globals.js';

let lastStepTime = 0;
let lastMusicTick = 0;

function ensureAudio() {
    if (gameState.audioCtx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    gameState.audioCtx = new AudioCtx();
    gameState.audioMaster = gameState.audioCtx.createGain();
    gameState.audioMaster.gain.value = 0.18;
    gameState.audioMaster.connect(gameState.audioCtx.destination);
    gameState.audioReady = true;
    initAdaptiveMusic();
}

function beep({ frequency = 440, type = 'sine', duration = 0.08, gain = 0.1, attack = 0.002, release = 0.08, detune = 0, slideTo = null }) {
    ensureAudio();
    if (!gameState.audioCtx || !gameState.audioMaster) return;

    const t0 = gameState.audioCtx.currentTime;
    const osc = gameState.audioCtx.createOscillator();
    const amp = gameState.audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t0);
    osc.detune.setValueAtTime(detune, t0);
    if (slideTo) osc.frequency.linearRampToValueAtTime(slideTo, t0 + duration);

    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(attack + 0.001, release));

    osc.connect(amp);
    amp.connect(gameState.audioMaster);
    osc.start(t0);
    osc.stop(t0 + duration);
}

export function resumeAudio() {
    ensureAudio();
    if (!gameState.audioCtx) return;
    if (gameState.audioCtx.state === 'suspended') gameState.audioCtx.resume();
}

export function playShotSound(weapon) {
    const isHeavy = weapon.damage >= 1.5;
    const base = Math.max(120, 340 - weapon.speed * 0.06);
    beep({ frequency: base, type: isHeavy ? 'sawtooth' : 'square', duration: 0.055, gain: isHeavy ? 0.2 : 0.13, slideTo: base * 0.56 });
    beep({ frequency: base * 1.8, type: 'triangle', duration: 0.03, gain: 0.08, detune: (Math.random() - 0.5) * 16 });
}

export function playReloadSound() {
    beep({ frequency: 560, type: 'square', duration: 0.03, gain: 0.05, slideTo: 480 });
    setTimeout(() => beep({ frequency: 240, type: 'triangle', duration: 0.08, gain: 0.06, slideTo: 160 }), 60);
}

export function playHitSound() {
    beep({ frequency: 720, type: 'triangle', duration: 0.045, gain: 0.07, slideTo: 530 });
}

export function playEnemyDownSound() {
    beep({ frequency: 420, type: 'square', duration: 0.06, gain: 0.08, slideTo: 300 });
    setTimeout(() => beep({ frequency: 680, type: 'triangle', duration: 0.05, gain: 0.07, slideTo: 540 }), 55);
}

export function playPickupSound() {
    beep({ frequency: 740, type: 'triangle', duration: 0.05, gain: 0.06, slideTo: 920 });
}

export function playDamageSound(intensity = 1) {
    beep({ frequency: 160 + (1 - intensity) * 70, type: 'sawtooth', duration: 0.05, gain: 0.08 * intensity, slideTo: 95 });
}

export function playExplosionSound(scale = 1) {
    const gainBase = Math.min(0.22, 0.1 + scale * 0.08);
    beep({ frequency: 90, type: 'sawtooth', duration: 0.12, gain: gainBase, slideTo: 42 });
    setTimeout(() => beep({ frequency: 220, type: 'triangle', duration: 0.09, gain: gainBase * 0.45, slideTo: 110 }), 22);
    setTimeout(() => beep({ frequency: 48, type: 'square', duration: 0.18, gain: gainBase * 0.25, slideTo: 33 }), 40);
}

export function playStormSiren() {
    beep({ frequency: 420, type: 'sawtooth', duration: 0.22, gain: 0.09, slideTo: 230 });
    setTimeout(() => beep({ frequency: 240, type: 'triangle', duration: 0.2, gain: 0.08, slideTo: 410 }), 180);
}

export function playThunder() {
    beep({ frequency: 70, type: 'sawtooth', duration: 0.22, gain: 0.16, slideTo: 30 });
    setTimeout(() => beep({ frequency: 130, type: 'triangle', duration: 0.12, gain: 0.08, slideTo: 70 }), 32);
}

export function playCinematicSting() {
    beep({ frequency: 190, type: 'sawtooth', duration: 0.18, gain: 0.14, slideTo: 86 });
    setTimeout(() => beep({ frequency: 460, type: 'triangle', duration: 0.12, gain: 0.09, slideTo: 220 }), 55);
    setTimeout(() => beep({ frequency: 95, type: 'square', duration: 0.2, gain: 0.08, slideTo: 55 }), 100);
}

export function triggerFootstep(speedNorm) {
    ensureAudio();
    if (!gameState.audioCtx) return;

    const now = performance.now();
    const interval = 340 - speedNorm * 150;
    if (now - lastStepTime < interval) return;
    lastStepTime = now;

    const freq = 80 + speedNorm * 35 + Math.random() * 10;
    beep({ frequency: freq, type: 'triangle', duration: 0.04, gain: 0.03 + speedNorm * 0.03, slideTo: 40 });
}

function initAdaptiveMusic() {
    if (!gameState.audioCtx || !gameState.audioMaster || gameState.musicNodes) return;

    const ctx = gameState.audioCtx;
    const drone = ctx.createOscillator();
    const pulse = ctx.createOscillator();
    const sub = ctx.createOscillator();

    const droneGain = ctx.createGain();
    const pulseGain = ctx.createGain();
    const subGain = ctx.createGain();

    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 420;

    drone.type = 'triangle';
    drone.frequency.value = 74;
    pulse.type = 'sawtooth';
    pulse.frequency.value = 148;
    sub.type = 'sine';
    sub.frequency.value = 37;

    droneGain.gain.value = 0.0001;
    pulseGain.gain.value = 0.0001;
    subGain.gain.value = 0.0001;

    drone.connect(droneFilter);
    droneFilter.connect(droneGain);
    pulse.connect(pulseGain);
    sub.connect(subGain);

    droneGain.connect(gameState.audioMaster);
    pulseGain.connect(gameState.audioMaster);
    subGain.connect(gameState.audioMaster);

    drone.start();
    pulse.start();
    sub.start();

    gameState.musicNodes = { drone, pulse, sub, droneGain, pulseGain, subGain, droneFilter };
}

export function updateAudio(delta, time) {
    if (!gameState.audioCtx || !gameState.audioMaster || !gameState.musicNodes) return;

    const enemies = gameState.enemies.length;
    const healthDanger = 1 - Math.max(0, gameState.health) / 100;
    const scorePulse = Math.min(1, (gameState.score % 500) / 500);
    const targetIntensity = Math.min(1, enemies * 0.1 + healthDanger * 0.8 + scorePulse * 0.2);

    gameState.musicIntensity += (targetIntensity - gameState.musicIntensity) * Math.min(1, delta * 2.5);

    const { drone, pulse, sub, droneGain, pulseGain, subGain, droneFilter } = gameState.musicNodes;
    const t = gameState.audioCtx.currentTime;
    const i = gameState.musicIntensity;

    drone.frequency.setTargetAtTime(70 + i * 24, t, 0.2);
    pulse.frequency.setTargetAtTime(132 + i * 120, t, 0.14);
    sub.frequency.setTargetAtTime(34 + i * 18, t, 0.2);
    droneFilter.frequency.setTargetAtTime(380 + i * 900, t, 0.2);

    droneGain.gain.setTargetAtTime(0.018 + i * 0.055, t, 0.2);
    pulseGain.gain.setTargetAtTime(0.0 + i * 0.03, t, 0.15);
    subGain.gain.setTargetAtTime(0.01 + i * 0.03, t, 0.2);

    if (time - lastMusicTick > 420 - i * 170) {
        lastMusicTick = time;
        const accentFreq = 300 + i * 260 + Math.random() * 50;
        beep({ frequency: accentFreq, type: 'triangle', duration: 0.04, gain: 0.012 + i * 0.02, slideTo: accentFreq * 0.7 });
    }
}
