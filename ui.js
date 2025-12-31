import { gameState } from './globals.js';

// Cache de elementos DOM
const ammoCountEl = document.getElementById('ammo-count');
const ammoMaxEl = document.getElementById('ammo-max');
const weaponNameEl = document.getElementById('weapon-name');
const reloadMsgEl = document.getElementById('reload-msg');
const crosshairContainer = document.getElementById('crosshair-container');
const healthFill = document.getElementById('health-bar-fill');
const scoreEl = document.getElementById('score-val');
const waveEl = document.getElementById('wave-val');
const blocker = document.getElementById('blocker');
const menuTitle = document.getElementById('menu-title');

export function updateWeaponInfo(name, current, max) {
    if(weaponNameEl) weaponNameEl.innerText = name;
    updateAmmoUI(current, max);
}

export function updateAmmoUI(current, max) {
    if(ammoCountEl) {
        ammoCountEl.innerText = current;
        ammoCountEl.style.color = current <= (max * 0.2) ? '#ff4444' : '#fff';
    }
    if(ammoMaxEl) ammoMaxEl.innerText = "/ " + max;
}

export function showReloadMsg(show) {
    if(reloadMsgEl) {
        reloadMsgEl.style.opacity = show ? '1' : '0';
        if(show) reloadMsgEl.innerText = "RECARREGANDO...";
    }
}

export function showNoAmmoMsg() {
    if(reloadMsgEl) {
        reloadMsgEl.innerText = "SEM MUNIÇÃO [R]";
        reloadMsgEl.style.opacity = '1';
    }
}

export function updateCrosshair(aimMode) {
    if(!crosshairContainer) return;
    
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
    if(healthFill) healthFill.style.width = Math.max(0, gameState.health) + '%';
}

export function updateScoreUI() {
    if(scoreEl) scoreEl.innerText = gameState.score;
}

export function showGameOver() {
    document.exitPointerLock();
    if(menuTitle) menuTitle.innerText = "SINAL PERDIDO";
    if(blocker) blocker.style.display = 'flex';
}
