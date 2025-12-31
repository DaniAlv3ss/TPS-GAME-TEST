import { gameState } from './globals.js';

const ammoCountEl = document.getElementById('ammo-count');
const reloadMsgEl = document.getElementById('reload-msg');
const crosshairContainer = document.getElementById('crosshair-container');
const healthFill = document.getElementById('health-bar-fill');
const scoreEl = document.getElementById('score-val');
const waveEl = document.getElementById('wave-val');
const blocker = document.getElementById('blocker');
const menuTitle = document.getElementById('menu-title');

export function updateAmmoUI(current, max) {
    ammoCountEl.innerText = current;
    // Atualiza o MAX também visualmente se necessário
    const maxEl = document.getElementById('ammo-max');
    if(maxEl) maxEl.innerText = "/ " + max;
    
    ammoCountEl.style.color = current <= 5 ? '#ff4444' : '#fff';
}

export function showReloadMsg(show) {
    reloadMsgEl.style.opacity = show ? '1' : '0';
    if(show) reloadMsgEl.innerText = "RECARREGANDO...";
}

export function showNoAmmoMsg() {
    reloadMsgEl.innerText = "SEM MUNIÇÃO [R]";
    reloadMsgEl.style.opacity = '1';
}

export function updateCrosshair(aimMode) {
    if(aimMode === 2) {
        crosshairContainer.classList.add('hidden');
    } else {
        crosshairContainer.classList.remove('hidden');
        if(aimMode === 1) {
            crosshairContainer.classList.add('aiming');
        } else {
            crosshairContainer.classList.remove('aiming');
        }
    }
}

export function updateHealthUI() {
    healthFill.style.width = Math.max(0, gameState.health) + '%';
}

export function updateScoreUI() {
    scoreEl.innerText = gameState.score;
}

export function updateWaveUI() {
    waveEl.innerText = gameState.wave;
}

export function showGameOver() {
    document.exitPointerLock();
    menuTitle.innerText = "SINAL PERDIDO";
    blocker.style.display = 'flex';
}
