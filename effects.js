import * as THREE from 'three';
import { gameState } from './globals.js';
import { playExplosionSound } from './audio.js';
import * as UI from './ui.js';

export function initEffects() {
    gameState.rainSystem = null;
    gameState.rainVelocities = null;
}

export function updateEffects(delta, time) {
    disableStorm();
    updateExplosions(delta);
}

export function triggerStormEvent(duration = 20) {
    disableStorm();
}

export function createExplosion(position, config = {}) {
    if (gameState.explosions.length > 14) {
        const old = gameState.explosions.shift();
        if (old) {
            gameState.scene.remove(old.shockwave);
            gameState.scene.remove(old.core);
            gameState.scene.remove(old.light);
        }
    }

    const radius = config.radius ?? 60;
    const maxLife = config.life ?? 0.75;
    const damage = config.damage ?? 4;

    const shockwave = new THREE.Mesh(
        new THREE.RingGeometry(2, 3.5, 20),
        new THREE.MeshBasicMaterial({ color: config.color ?? 0xffaa55, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
    );
    shockwave.position.copy(position);
    shockwave.position.y = Math.max(0.2, shockwave.position.y);
    shockwave.rotation.x = -Math.PI / 2;

    const core = new THREE.Mesh(
        new THREE.SphereGeometry(2.6, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffddaa, transparent: true, opacity: 0.85 })
    );
    core.position.copy(position);

    const light = new THREE.PointLight(config.color ?? 0xff8c42, 14, radius * 1.6, 2);
    light.position.copy(position);

    gameState.scene.add(shockwave);
    gameState.scene.add(core);
    gameState.scene.add(light);

    gameState.explosions.push({
        shockwave,
        core,
        light,
        life: maxLife,
        maxLife,
        radius,
        damage,
        hitEnemies: new Set(),
        playerHit: false
    });

    playExplosionSound(radius / 60);
}

function disableStorm() {
    gameState.stormEvent.active = false;
    gameState.stormEvent.intensity = 0;
    gameState.stormEvent.timer = 0;
    UI.showStormAlert(false);
}

function updateExplosions(delta) {
    for (let i = gameState.explosions.length - 1; i >= 0; i--) {
        const exp = gameState.explosions[i];
        exp.life -= delta;
        const t = 1 - exp.life / exp.maxLife;
        const currentRadius = THREE.MathUtils.lerp(3, exp.radius, t);

        exp.shockwave.scale.set(currentRadius, currentRadius, currentRadius);
        exp.shockwave.material.opacity = Math.max(0, (1 - t) * 0.85);
        exp.core.scale.setScalar(1 + t * 3.2);
        exp.core.material.opacity = Math.max(0, 0.75 - t * 0.75);
        exp.light.intensity = Math.max(0, 16 - t * 20);

        applyShockwaveDamage(exp, currentRadius);

        if (exp.life <= 0) {
            gameState.scene.remove(exp.shockwave);
            gameState.scene.remove(exp.core);
            gameState.scene.remove(exp.light);
            gameState.explosions.splice(i, 1);
        }
    }
}

function applyShockwaveDamage(exp, currentRadius) {
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        if (exp.hitEnemies.has(enemy)) continue;
        const distance = enemy.position.distanceTo(exp.shockwave.position);
        if (distance <= currentRadius) {
            exp.hitEnemies.add(enemy);
            enemy.userData.health -= exp.damage;
            const push = new THREE.Vector3().subVectors(enemy.position, exp.shockwave.position).setY(0).normalize().multiplyScalar(9);
            enemy.position.add(push);
            if (!enemy.userData?.isBoss) enemy.position.y = 0;

            if (enemy.userData.health <= 0) {
                const isBoss = enemy.userData?.isBoss;
                gameState.scene.remove(enemy);
                gameState.enemies.splice(i, 1);
                gameState.score += isBoss ? 400 : 50;
                UI.updateScoreUI();

                if (isBoss) {
                    createExplosion(enemy.position.clone(), { radius: 95, life: 0.8, damage: 5.5, color: 0xff7040 });
                }
            }
        }
    }

    if (!exp.playerHit && gameState.playerContainer) {
        const playerDist = gameState.playerContainer.position.distanceTo(exp.shockwave.position);
        if (playerDist <= currentRadius * 0.55) {
            exp.playerHit = true;
            gameState.health = Math.max(0, gameState.health - exp.damage * 2.2);
            UI.updateHealthUI();
            if (gameState.health <= 0 && !gameState.isGameOver) {
                gameState.isGameOver = true;
                UI.showGameOver();
            }
        }
    }
}
