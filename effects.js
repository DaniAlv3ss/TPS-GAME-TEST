import * as THREE from 'three';
import { gameState } from './globals.js';
import { playExplosionSound } from './audio.js';
import * as UI from './ui.js';

const RAIN_COUNT = 2200;

export function initEffects() {
    createRain();
}

export function updateEffects(delta, time) {
    updateStormEvent(delta, time);
    updateRain(delta, time);
    updateExplosions(delta);
    updateLightning(delta, time);
}

export function triggerStormEvent(duration = 20) {
    gameState.stormEvent.active = true;
    gameState.stormEvent.timer = 0;
    gameState.stormEvent.duration = duration;
    UI.showStormAlert(true);
}

export function createExplosion(position, config = {}) {
    const radius = config.radius ?? 60;
    const maxLife = config.life ?? 0.75;
    const damage = config.damage ?? 4;

    const shockwave = new THREE.Mesh(
        new THREE.RingGeometry(2, 3.5, 32),
        new THREE.MeshBasicMaterial({ color: config.color ?? 0xffaa55, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
    );
    shockwave.position.copy(position);
    shockwave.position.y = Math.max(0.2, shockwave.position.y);
    shockwave.rotation.x = -Math.PI / 2;

    const core = new THREE.Mesh(
        new THREE.SphereGeometry(2.6, 12, 12),
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

function createRain() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(RAIN_COUNT * 3);
    const velocities = new Float32Array(RAIN_COUNT);

    for (let i = 0; i < RAIN_COUNT; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 700;
        positions[i3 + 1] = Math.random() * 220 + 40;
        positions[i3 + 2] = (Math.random() - 0.5) * 700;
        velocities[i] = 90 + Math.random() * 120;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
        color: 0xaad8ff,
        size: 0.75,
        transparent: true,
        opacity: 0.46,
        depthWrite: false
    });

    const points = new THREE.Points(geo, mat);
    points.visible = true;
    gameState.scene.add(points);

    gameState.rainSystem = points;
    gameState.rainVelocities = velocities;
}

function updateRain(delta, time) {
    if (!gameState.rainSystem || !gameState.playerContainer) return;

    const stormBoost = gameState.stormEvent.active ? 0.45 + gameState.stormEvent.intensity * 0.35 : 0;
    const intensityTarget = 0.35 + Math.sin(time * 0.00013) * 0.3 + Math.min(0.3, gameState.wave * 0.02) + stormBoost;
    gameState.weatherLevel += (THREE.MathUtils.clamp(intensityTarget, 0.08, 0.95) - gameState.weatherLevel) * Math.min(1, delta * 0.25);

    const positions = gameState.rainSystem.geometry.attributes.position.array;
    const velocities = gameState.rainVelocities;
    const px = gameState.playerContainer.position.x;
    const pz = gameState.playerContainer.position.z;

    for (let i = 0; i < RAIN_COUNT; i++) {
        const i3 = i * 3;
        positions[i3 + 1] -= velocities[i] * delta * (0.8 + gameState.weatherLevel * 0.6);
        positions[i3] += Math.sin((time * 0.001) + i) * delta * 4;

        if (positions[i3 + 1] < 0) {
            positions[i3 + 1] = 200 + Math.random() * 80;
            positions[i3] = px + (Math.random() - 0.5) * 700;
            positions[i3 + 2] = pz + (Math.random() - 0.5) * 700;
        }
    }

    gameState.rainSystem.geometry.attributes.position.needsUpdate = true;
    gameState.rainSystem.material.opacity = 0.2 + gameState.weatherLevel * 0.35;
}

function updateLightning(delta, time) {
    if (!gameState.renderer || !gameState.scene) return;

    const flashChance = 0.0009 + gameState.weatherLevel * 0.0012 + gameState.stormEvent.intensity * 0.003;
    if (Math.random() < flashChance) gameState.lightningFlash = 0.65 + Math.random() * 0.5;

    if (gameState.lightningFlash > 0) {
        gameState.lightningFlash = Math.max(0, gameState.lightningFlash - delta * 2.2);
        gameState.renderer.toneMappingExposure = 1.08 + gameState.lightningFlash * 0.55 - gameState.stormEvent.intensity * 0.2;
        const c = gameState.scene.fog.color;
        c.lerp(new THREE.Color(0xddeeff), gameState.lightningFlash * 0.4);
    } else {
        const targetExposure = 1.25 - gameState.stormEvent.intensity * 0.35;
        gameState.renderer.toneMappingExposure = THREE.MathUtils.lerp(gameState.renderer.toneMappingExposure, targetExposure, 0.03);
    }
}

function updateStormEvent(delta, time) {
    if (!gameState.stormEvent.active) {
        gameState.stormEvent.intensity = Math.max(0, gameState.stormEvent.intensity - delta * 0.35);
        return;
    }

    gameState.stormEvent.timer += delta;
    const t = gameState.stormEvent.timer / gameState.stormEvent.duration;
    const ramp = Math.sin(Math.min(1, t) * Math.PI);
    gameState.stormEvent.intensity = THREE.MathUtils.lerp(gameState.stormEvent.intensity, 0.45 + ramp * 0.55, delta * 3.2);

    if (gameState.stormEvent.timer >= gameState.stormEvent.duration) {
        gameState.stormEvent.active = false;
        UI.showStormAlert(false);
    }
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
            const push = new THREE.Vector3().subVectors(enemy.position, exp.shockwave.position).normalize().multiplyScalar(9);
            enemy.position.add(push);

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
