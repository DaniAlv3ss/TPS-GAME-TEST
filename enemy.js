import * as THREE from 'three';
import { gameState } from './globals.js';
import * as UI from './ui.js';
import { playCinematicSting, playDamageSound } from './audio.js';
import { createExplosion, triggerStormEvent } from './effects.js';

const ENEMY_SPEED = 22.0;
let lastSpawnTime = 0;
let enemySpawnRate = 2000;

export function updateEnemies(delta, time) {
    // Spawn
    enemySpawnRate = Math.max(1100, 2300 - gameState.wave * 80);

    if(time - lastSpawnTime > enemySpawnRate && gameState.enemies.length < 20) {
        spawnEnemy();
        lastSpawnTime = time;
    }

    const playerPos = gameState.playerContainer.position;

    let activeBoss = null;

    for(let i = gameState.enemies.length - 1; i >= 0; i--) {
        const e = gameState.enemies[i];
        const distanceToPlayer = e.position.distanceTo(playerPos);
        let dir = new THREE.Vector3().subVectors(playerPos, e.position).normalize();
        const speedMult = e.userData?.speedMult || 1;
        const moveStep = (ENEMY_SPEED + gameState.wave * 1.5) * speedMult * delta;
        e.position.add(dir.multiplyScalar(moveStep));
        e.lookAt(playerPos);
        if (e.userData?.isBoss) e.rotation.x = Math.sin(time * 0.006 + i) * 0.07;
        else e.rotation.x = 0;

        if (!e.userData?.isBoss) {
            e.position.y = 0;
        }

        if (e.userData?.isSoldier) {
            updateSoldierAnimation(e, time, delta, moveStep, distanceToPlayer);
        }

        if (e.userData?.isBoss) {
            activeBoss = e;
            updateBossPhase(e, playerPos, delta, time);
            const pulse = 0.8 + Math.sin(time * 0.01 + i) * 0.25;
            e.userData.core.scale.setScalar(pulse);
            e.userData.auraLight.intensity = 14 + pulse * 8;
        }
        
        // Dano no Player
        if(distanceToPlayer < 15) {
            gameState.health -= 30 * delta;
            UI.updateHealthUI();
            playDamageSound(Math.min(1, delta * 9));
            if(gameState.health <= 0) {
                gameState.isGameOver = true;
                UI.showGameOver();
            }
        }
    }

    gameState.currentBoss = activeBoss;
    if (activeBoss) {
        UI.showBossHud(true);
        UI.updateBossHud({
            name: activeBoss.userData.name,
            health: activeBoss.userData.health,
            maxHealth: activeBoss.userData.maxHealth,
            phase: activeBoss.userData.phase,
            weakspot: activeBoss.userData.weakspotHint,
            lastHit: activeBoss.userData.lastWeakspotHit
        });
    } else {
        UI.showBossHud(false);
    }

    gameState.wave = Math.max(1, Math.floor(gameState.score / 400) + 1);
    if (gameState.wave >= 3 && gameState.wave % 3 === 0 && gameState.lastBossWave !== gameState.wave) {
        spawnBoss();
        gameState.lastBossWave = gameState.wave;
    }
}

function spawnEnemy() {
    if(!gameState.controlsEnabled || gameState.isGameOver) return;

    const typeRoll = Math.random();
    const isHeavy = typeRoll > 0.78;
    const enemy = createSoldierEnemyModel(isHeavy);
    
    const angle = Math.random() * Math.PI * 2;
    const dist = 600 + Math.random() * 400;
    enemy.position.set(
        gameState.playerContainer.position.x + Math.sin(angle) * dist,
        0,
        gameState.playerContainer.position.z + Math.cos(angle) * dist
    );
    
    enemy.userData = {
        ...enemy.userData,
        health: isHeavy ? 11 + gameState.wave * 0.7 : 6 + gameState.wave * 0.45,
        isBoss: false,
        speedMult: isHeavy ? 0.9 : 1,
        hitReact: 0,
        hitReactKick: 0
    };
    gameState.scene.add(enemy);
    gameState.enemies.push(enemy);
}

function spawnBoss() {
    if(!gameState.controlsEnabled || gameState.isGameOver) return;

    const boss = new THREE.Group();
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(20, 30, 18),
        new THREE.MeshStandardMaterial({ color: 0x4a0f0f, roughness: 0.6, metalness: 0.3, emissive: 0x3a0000, emissiveIntensity: 0.35 })
    );
    body.castShadow = true;
    body.receiveShadow = true;
    boss.add(body);

    const core = new THREE.Mesh(
        new THREE.SphereGeometry(4.2, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xff9966, emissive: 0xff5522, emissiveIntensity: 1.3 })
    );
    core.position.y = 3;
    boss.add(core);

    const weakSpotMat = new THREE.MeshStandardMaterial({ color: 0x90e6ff, emissive: 0x42bfff, emissiveIntensity: 1.5 });
    const headWeakspot = new THREE.Mesh(new THREE.SphereGeometry(2.1, 12, 12), weakSpotMat.clone());
    headWeakspot.position.set(0, 12, -3);
    boss.add(headWeakspot);

    const shoulderLWeakspot = new THREE.Mesh(new THREE.SphereGeometry(1.7, 12, 12), weakSpotMat.clone());
    shoulderLWeakspot.position.set(-7.6, 6.2, -2.8);
    boss.add(shoulderLWeakspot);

    const shoulderRWeakspot = new THREE.Mesh(new THREE.SphereGeometry(1.7, 12, 12), weakSpotMat.clone());
    shoulderRWeakspot.position.set(7.6, 6.2, -2.8);
    boss.add(shoulderRWeakspot);

    const auraLight = new THREE.PointLight(0xff6633, 18, 180, 2);
    auraLight.position.y = 3;
    boss.add(auraLight);

    const angle = Math.random() * Math.PI * 2;
    const dist = 900;
    boss.position.set(
        gameState.playerContainer.position.x + Math.sin(angle) * dist,
        15,
        gameState.playerContainer.position.z + Math.cos(angle) * dist
    );

    boss.userData = {
        health: 50 + gameState.wave * 8,
        maxHealth: 50 + gameState.wave * 8,
        name: 'WARLORD TITAN',
        isBoss: true,
        auraLight,
        core,
        speedMult: 0.72,
        phase: 1,
        weakspotHint: 'NÚCLEO PEITORAL',
        attackCooldown: 2.2,
        dashCooldown: 0,
        rageShotTimer: 0,
        weakSpots: [
            { name: 'NÚCLEO PEITORAL', node: core, radius: 6.6, multiplier: 2.15, phaseMin: 1 },
            { name: 'VISOR CRANIANO', node: headWeakspot, radius: 3.2, multiplier: 2.8, phaseMin: 2 },
            { name: 'SERVO OMBRO ESQ', node: shoulderLWeakspot, radius: 2.8, multiplier: 2.35, phaseMin: 3 },
            { name: 'SERVO OMBRO DIR', node: shoulderRWeakspot, radius: 2.8, multiplier: 2.35, phaseMin: 3 }
        ]
    };

    gameState.scene.add(boss);
    gameState.enemies.push(boss);

    triggerStormEvent(0);
    gameState.cinematic.active = true;
    gameState.cinematic.timer = 0;
    gameState.cinematic.shakeTimer = 0.9;
    gameState.cinematic.shakeIntensity = 0.12;
    UI.showBossThreat(gameState.wave);
    playCinematicSting();
}

export function onEnemyKilled(enemy) {
    if (!enemy.userData?.isBoss) return;
    createExplosion(enemy.position.clone(), { radius: 120, life: 1.05, damage: 9, color: 0xff6a33 });
    gameState.score += 350;
    UI.updateScoreUI();
    UI.showBossHud(false);
}

function updateBossPhase(boss, playerPos, delta, time) {
    const d = boss.userData;
    const ratio = d.health / Math.max(1, d.maxHealth);
    const phase = ratio <= 0.33 ? 3 : (ratio <= 0.66 ? 2 : 1);

    if (phase !== d.phase) {
        d.phase = phase;
        createExplosion(boss.position.clone(), {
            radius: phase === 3 ? 90 : 70,
            life: 0.65,
            damage: phase === 3 ? 5.5 : 4,
            color: phase === 3 ? 0xff3f2b : 0xff7a48
        });
    }

    if (phase === 1) d.weakspotHint = 'NÚCLEO PEITORAL';
    if (phase === 2) d.weakspotHint = 'VISOR CRANIANO';
    if (phase === 3) d.weakspotHint = 'SERVOS DOS OMBROS';

    d.speedMult = phase === 1 ? 0.72 : (phase === 2 ? 0.92 : 1.12);
    d.attackCooldown -= delta;
    d.dashCooldown -= delta;
    d.rageShotTimer -= delta;

    const distance = boss.position.distanceTo(playerPos);

    if (phase >= 2 && d.dashCooldown <= 0 && distance > 40 && distance < 240) {
        d.dashCooldown = phase === 2 ? 4.2 : 2.8;
        const dashDir = new THREE.Vector3().subVectors(playerPos, boss.position).normalize();
        boss.position.add(dashDir.multiplyScalar(40 + phase * 18));
        createExplosion(boss.position.clone(), { radius: 46 + phase * 8, life: 0.38, damage: 2.8 + phase, color: 0xff8a4a });
    }

    if (d.attackCooldown <= 0) {
        d.attackCooldown = phase === 1 ? 2.8 : (phase === 2 ? 2.0 : 1.4);

        if (phase === 1) {
            if (distance < 90) {
                createExplosion(boss.position.clone(), { radius: 70, life: 0.55, damage: 4, color: 0xff9d63 });
            }
            return;
        }

        if (phase === 2) {
            const strikePos = playerPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 22, 0, (Math.random() - 0.5) * 22));
            createExplosion(strikePos, { radius: 58, life: 0.52, damage: 4.8, color: 0xff7845 });
            return;
        }

        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2 + time * 0.0015;
            const pos = playerPos.clone().add(new THREE.Vector3(Math.cos(angle) * 28, 0, Math.sin(angle) * 28));
            createExplosion(pos, { radius: 52, life: 0.46, damage: 4.6, color: 0xff4f37 });
        }
    }

    if (phase === 3 && d.rageShotTimer <= 0) {
        d.rageShotTimer = 0.55;
        const pulsePos = boss.position.clone().add(new THREE.Vector3(0, 0, 0));
        createExplosion(pulsePos, { radius: 44, life: 0.3, damage: 2.4, color: 0xff3a2a });
    }
}

function createSoldierEnemyModel(isHeavy) {
    const soldier = new THREE.Group();
    const uniformColor = isHeavy ? 0x2f353d : 0x3b4552;
    const gearColor = isHeavy ? 0x1f252c : 0x252c36;
    const skin = new THREE.MeshStandardMaterial({ color: 0xc49b86, roughness: 0.9 });
    const uniform = new THREE.MeshStandardMaterial({ color: uniformColor, roughness: 0.95, metalness: 0.05 });
    const gear = new THREE.MeshStandardMaterial({ color: gearColor, roughness: 0.75, metalness: 0.15 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(isHeavy ? 11 : 10, isHeavy ? 14 : 13, 6), uniform);
    torso.position.y = 16;
    torso.castShadow = true;
    soldier.add(torso);

    const vest = new THREE.Mesh(new THREE.BoxGeometry(isHeavy ? 11.5 : 10.5, isHeavy ? 10 : 9, 6.6), gear);
    vest.position.set(0, 15.8, -0.2);
    vest.castShadow = true;
    soldier.add(vest);

    const head = new THREE.Mesh(new THREE.BoxGeometry(5.4, 6.4, 5.6), skin);
    head.position.y = 26;
    head.castShadow = true;
    soldier.add(head);

    const helmet = new THREE.Mesh(new THREE.BoxGeometry(5.8, 3.2, 6), gear);
    helmet.position.set(0, 29.2, 0);
    helmet.castShadow = true;
    soldier.add(helmet);

    const visor = new THREE.Mesh(
        new THREE.BoxGeometry(4.9, 1.6, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x89d7ff, emissive: 0x1d6f9d, emissiveIntensity: 0.7 })
    );
    visor.position.set(0, 25.8, -3.2);
    soldier.add(visor);

    const legGeo = new THREE.BoxGeometry(2.8, 12, 3.2);
    const leftLeg = new THREE.Mesh(legGeo, uniform);
    const rightLeg = new THREE.Mesh(legGeo, uniform);
    leftLeg.position.set(-2.1, 6, 0);
    rightLeg.position.set(2.1, 6, 0);
    leftLeg.castShadow = true;
    rightLeg.castShadow = true;
    soldier.add(leftLeg);
    soldier.add(rightLeg);

    const armGeo = new THREE.BoxGeometry(2.4, 10, 2.8);
    const leftArm = new THREE.Mesh(armGeo, uniform);
    const rightArm = new THREE.Mesh(armGeo, uniform);
    leftArm.position.set(-6, 17.5, 0);
    rightArm.position.set(6, 17.5, 0);
    leftArm.castShadow = true;
    rightArm.castShadow = true;
    soldier.add(leftArm);
    soldier.add(rightArm);

    const rifle = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 10), gear);
    rifle.position.set(3.8, 14, -3.8);
    rifle.rotation.x = -0.25;
    rifle.rotation.z = 0.22;
    soldier.add(rifle);

    soldier.userData = {
        isSoldier: true,
        anim: {
            torso,
            head,
            leftLeg,
            rightLeg,
            leftArm,
            rightArm,
            rifle
        }
    };

    return soldier;
}

function updateSoldierAnimation(enemy, time, delta, moveStep, distanceToPlayer) {
    const anim = enemy.userData?.anim;
    if (!anim) return;

    const strideSpeed = Math.min(2.2, 0.7 + moveStep * 5.5);
    const t = time * 0.01 * strideSpeed;
    const nearTarget = distanceToPlayer < 95 ? 0.45 : 1;
    const runAmp = 0.62 * nearTarget;

    anim.leftLeg.rotation.x = Math.sin(t) * runAmp;
    anim.rightLeg.rotation.x = Math.sin(t + Math.PI) * runAmp;

    anim.leftArm.rotation.x = Math.sin(t + Math.PI) * 0.42;
    anim.rightArm.rotation.x = -0.8 + Math.sin(t) * 0.28;

    anim.rifle.rotation.x = -0.24 + Math.sin(t * 0.45) * 0.05;
    anim.rifle.rotation.y = Math.cos(t * 0.4) * 0.06;

    anim.torso.rotation.y = Math.sin(t * 0.5) * 0.08;
    anim.head.rotation.y = Math.sin(t * 0.4) * 0.06;

    if (enemy.userData.hitReact > 0) {
        enemy.userData.hitReact = Math.max(0, enemy.userData.hitReact - delta * 6.5);
        const react = enemy.userData.hitReact;
        const kick = enemy.userData.hitReactKick || new THREE.Vector3();
        anim.torso.rotation.x = -react * 0.45;
        enemy.position.add(kick.clone().multiplyScalar(delta * 12 * react));
        enemy.position.y = 0;
    } else {
        anim.torso.rotation.x = THREE.MathUtils.lerp(anim.torso.rotation.x, 0, 0.18);
    }
}