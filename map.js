import * as THREE from 'three';
import { gameState } from './globals.js';

export function createMap() {
    // Chão
    const floorGeo = new THREE.PlaneGeometry(3000, 3000);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x151515, 
        roughness: 0.9,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    gameState.scene.add(floor);

    // Grid
    const grid = new THREE.GridHelper(3000, 100, 0x333333, 0x1a1a1a);
    gameState.scene.add(grid);

    // Obstáculos
    const boxGeo = new THREE.BoxGeometry(20, 30, 20);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.6 });
    
    for (let i = 0; i < 50; i++) {
        const box = new THREE.Mesh(boxGeo, boxMat);
        let x = (Math.random() - 0.5) * 1200;
        let z = (Math.random() - 0.5) * 1200;
        
        // Zona segura no centro
        if(Math.abs(x) < 200 && Math.abs(z) < 200) x += 300; 

        box.position.set(x, 15, z);
        box.castShadow = true;
        box.receiveShadow = true;
        gameState.scene.add(box);
        
        box.isObstacle = true;
        gameState.obstacles.push(box);
    }
}