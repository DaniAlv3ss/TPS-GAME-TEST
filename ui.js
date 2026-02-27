import { gameState } from './globals.js';

// Cache de elementos DOM
const ammoCountEl = document.getElementById('ammo-count');
const ammoMaxEl = document.getElementById('ammo-max');
const weaponNameEl = document.getElementById('weapon-name');
const weaponAttachmentsEl = document.getElementById('weapon-attachments');
const reloadMsgEl = document.getElementById('reload-msg');
const crosshairContainer = document.getElementById('crosshair-container');
const hitMarkerEl = document.getElementById('hit-marker');
const healthFill = document.getElementById('health-bar-fill');
const damageOverlay = document.getElementById('damage-overlay');
const stormAlertEl = document.getElementById('storm-alert');
const bossThreatEl = document.getElementById('boss-threat');
const bossHudEl = document.getElementById('boss-hud');
const bossNameEl = document.getElementById('boss-name');
const bossPhaseEl = document.getElementById('boss-phase');
const bossHealthFillEl = document.getElementById('boss-health-fill');
const scoreEl = document.getElementById('score-val');
const waveEl = document.getElementById('wave-val');
const blocker = document.getElementById('blocker');
const menuTitle = document.getElementById('menu-title');

export function updateWeaponInfo(name, current, max) {
    if(weaponNameEl) weaponNameEl.innerText = name;
    updateAmmoUI(current, max);
}

export function updateAttachmentsUI(text) {
    if (weaponAttachmentsEl) weaponAttachmentsEl.innerText = text;
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

export function setCrosshairGap(gap) {
    if (!crosshairContainer) return;
    crosshairContainer.style.setProperty('--crosshair-gap', `${gap.toFixed(1)}px`);
}

export function pulseCrosshair() {
    if (!crosshairContainer) return;
    crosshairContainer.classList.add('firing');
    setTimeout(() => crosshairContainer.classList.remove('firing'), 60);
}

export function flashHitMarker() {
    if (!hitMarkerEl) return;
    hitMarkerEl.classList.add('active');
    setTimeout(() => hitMarkerEl.classList.remove('active'), 70);
}

export function updateHealthUI() {
    if(healthFill) healthFill.style.width = Math.max(0, gameState.health) + '%';
    if (damageOverlay) {
        const intensity = 1 - Math.max(0, gameState.health) / 100;
        damageOverlay.style.opacity = Math.min(0.85, intensity * 0.9).toFixed(2);
    }
}

export function updateScoreUI() {
    if(scoreEl) scoreEl.innerText = gameState.score;
    if(waveEl) waveEl.innerText = gameState.wave;
}

export function showGameOver() {
    document.exitPointerLock();
    if(menuTitle) menuTitle.innerText = "SINAL PERDIDO";
    if(blocker) blocker.style.display = 'flex';
}

export function showStormAlert(show) {
    if (!stormAlertEl) return;
    stormAlertEl.classList.toggle('active', !!show);
}

export function showBossThreat(wave = 1) {
    if (!bossThreatEl) return;
    bossThreatEl.innerText = `⚠ ALVO PRIORITÁRIO • WAVE ${wave} • WARLORD TITAN`;
    bossThreatEl.classList.add('active');
    setTimeout(() => bossThreatEl.classList.remove('active'), 1900);
}

export function showBossHud(show) {
    if (!bossHudEl) return;
    bossHudEl.classList.toggle('hidden', !show);
}

export function updateBossHud({ name = 'WARLORD TITAN', health = 1, maxHealth = 1, phase = 1, weakspot = '', lastHit = '' } = {}) {
    if (bossNameEl) bossNameEl.innerText = name;
    if (bossPhaseEl) {
        const hint = weakspot ? ` • WEAK SPOT: ${weakspot}` : '';
        const hitInfo = lastHit ? ` • ÚLTIMO HIT: ${lastHit}` : '';
        bossPhaseEl.innerText = `FASE ${phase}${hint}${hitInfo}`;
    }
    if (bossHealthFillEl) {
        const pct = Math.max(0, Math.min(100, (health / Math.max(1, maxHealth)) * 100));
        bossHealthFillEl.style.width = `${pct}%`;
    }
}
