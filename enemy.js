import * as THREE from 'three';
import { gameState } from './globals.js';
import * as UI from './ui.js';

const ENEMY_SPEED = 20.0;
let lastSpawnTime = 0;
let enemySpawnRate = 2000;

export function updateEnemies(delta, time) {
    // Spawn
    if(time - lastSpawnTime > enemySpawnRate) {
        spawnEnemy();
        lastSpawnTime = time;
    }

    const playerPos = gameState.playerContainer.position;

    for(let i = gameState.enemies.length - 1; i >= 0; i--) {
        const e = gameState.enemies[i];
        let dir = new THREE.Vector3().subVectors(playerPos, e.position).normalize();
        e.position.add(dir.multiplyScalar(ENEMY_SPEED * delta));
        e.lookAt(playerPos);
        
        // Dano no Player
        if(e.position.distanceTo(playerPos) < 15) {
            gameState.health -= 30 * delta;
            UI.updateHealthUI();
            if(gameState.health <= 0) {
                gameState.isGameOver = true;
                UI.showGameOver();
            }
        }
    }
}

function spawnEnemy() {
    if(!gameState.controlsEnabled || gameState.isGameOver) return;
    
    const enemy = new THREE.Mesh(
        new THREE.BoxGeometry(10, 18, 10),
        new THREE.MeshStandardMaterial({ color: 0x883333 })
    );
    
    const angle = Math.random() * Math.PI * 2;
    const dist = 600 + Math.random() * 400;
    enemy.position.set(
        gameState.playerContainer.position.x + Math.sin(angle) * dist,
        15,
        gameState.playerContainer.position.z + Math.cos(angle) * dist
    );
    
    enemy.userData = { health: 6 };
    gameState.scene.add(enemy);
    gameState.enemies.push(enemy);
}