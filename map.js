import * as THREE from 'three';
import { gameState } from './globals.js';

export function createMap() {
    // Chão (Mais claro para o dia)
    const floorGeo = new THREE.PlaneGeometry(3000, 3000);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x333333, 
        roughness: 0.9,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    gameState.scene.add(floor);

    // Grid (Sutil)
    const grid = new THREE.GridHelper(3000, 100, 0x555555, 0x444444);
    gameState.scene.add(grid);

    // Obstáculos
    const boxGeo = new THREE.BoxGeometry(20, 30, 20);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x667788, roughness: 0.6 });
    
    for (let i = 0; i < 50; i++) {
        const box = new THREE.Mesh(boxGeo, boxMat);
        let x = (Math.random() - 0.5) * 1200;
        let z = (Math.random() - 0.5) * 1200;
        
        if(Math.abs(x) < 200 && Math.abs(z) < 200) x += 300; 

        box.position.set(x, 15, z);
        box.castShadow = true;
        box.receiveShadow = true;
        gameState.scene.add(box);
        
        box.isObstacle = true;
        gameState.obstacles.push(box);
    }

    // Criar Kits Médicos iniciais
    for(let i=0; i<5; i++) spawnHealthPack();
}

export function spawnHealthPack() {
    const group = new THREE.Group();
    
    // Caixa Branca
    const box = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 4), new THREE.MeshStandardMaterial({color: 0xeeeeee}));
    group.add(box);
    
    // Cruz Verde
    const v = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 4.2), new THREE.MeshBasicMaterial({color: 0x00ff00}));
    const h = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 4.2), new THREE.MeshBasicMaterial({color: 0x00ff00}));
    group.add(v);
    group.add(h);

    let x = (Math.random() - 0.5) * 1000;
    let z = (Math.random() - 0.5) * 1000;
    group.position.set(x, 5, z);
    
    // Animação de flutuar
    group.userData = { timeOffset: Math.random() * 100 };
    
    gameState.scene.add(group);
    gameState.healthPacks.push(group);
}

export function updateMapObjects(time) {
    // Animar medkits
    for (let pack of gameState.healthPacks) {
        pack.rotation.y += 0.02;
        pack.position.y = 5 + Math.sin(time * 2 + pack.userData.timeOffset) * 1.5;
    }
}
