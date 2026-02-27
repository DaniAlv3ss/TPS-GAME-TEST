import * as THREE from 'three';
import { gameState } from './globals.js';

export function createMap() {
    const floorGeo = new THREE.PlaneGeometry(3600, 3600);
    const floorMat = new THREE.MeshStandardMaterial({
        map: createGroundTexture(),
        color: 0xffffff,
        roughness: 0.94,
        metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    gameState.scene.add(floor);

    const grid = new THREE.GridHelper(3600, 120, 0x456280, 0x2a3b52);
    grid.material.opacity = 0.22;
    grid.material.transparent = true;
    gameState.scene.add(grid);

    createProps();
    createLightPoles();

    for(let i=0; i<5; i++) spawnHealthPack();
}

export function spawnHealthPack() {
    const group = new THREE.Group();

    const box = new THREE.Mesh(
        new THREE.BoxGeometry(8, 6, 4),
        new THREE.MeshStandardMaterial({ color: 0xd8f0ff, emissive: 0x123344, emissiveIntensity: 0.35 })
    );
    group.add(box);

    const v = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 4.2), new THREE.MeshBasicMaterial({color: 0x63ff94}));
    const h = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 4.2), new THREE.MeshBasicMaterial({color: 0x63ff94}));
    group.add(v);
    group.add(h);

    const halo = new THREE.Mesh(
        new THREE.RingGeometry(5, 7, 24),
        new THREE.MeshBasicMaterial({ color: 0x5aff9c, side: THREE.DoubleSide, transparent: true, opacity: 0.35 })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = -2.9;
    group.add(halo);

    let x = (Math.random() - 0.5) * 1000;
    let z = (Math.random() - 0.5) * 1000;
    group.position.set(x, 5, z);

    group.userData = { timeOffset: Math.random() * 100, halo };
    
    gameState.scene.add(group);
    gameState.healthPacks.push(group);
}

export function updateMapObjects(time) {
    for (let pack of gameState.healthPacks) {
        pack.rotation.y += 0.022;
        pack.position.y = 5 + Math.sin(time * 2 + pack.userData.timeOffset) * 1.5;
        pack.userData.halo.material.opacity = 0.2 + Math.sin(time * 4 + pack.userData.timeOffset) * 0.1;
    }
}

function createGroundTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#313942';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 9000; i++) {
        const shade = 46 + Math.floor(Math.random() * 35);
        ctx.fillStyle = `rgb(${shade}, ${shade + 8}, ${shade + 14})`;
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    for (let i = 0; i < 140; i++) {
        ctx.strokeStyle = `rgba(50,60,74,${0.1 + Math.random() * 0.12})`;
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(Math.random() * 512, Math.random() * 512);
        ctx.lineTo(Math.random() * 512, Math.random() * 512);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    texture.anisotropy = 8;
    return texture;
}

function createProps() {
    const crateGeo = new THREE.BoxGeometry(20, 20, 20);
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x65748a, roughness: 0.6, metalness: 0.15 });
    const rockGeo = new THREE.DodecahedronGeometry(10, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x515964, roughness: 0.98, metalness: 0.04 });

    for (let i = 0; i < 65; i++) {
        const isRock = i % 3 === 0;
        const mesh = new THREE.Mesh(isRock ? rockGeo : crateGeo, isRock ? rockMat : crateMat);
        let x = (Math.random() - 0.5) * 1400;
        let z = (Math.random() - 0.5) * 1400;

        if (Math.abs(x) < 220 && Math.abs(z) < 220) {
            x += Math.sign(x || 1) * 300;
            z += Math.sign(z || 1) * 300;
        }

        const scale = isRock ? 0.8 + Math.random() * 1.6 : 0.7 + Math.random() * 1.4;
        mesh.scale.set(scale, scale * (isRock ? 0.6 : 1.1), scale);
        mesh.position.set(x, isRock ? 10 : 11, z);
        mesh.rotation.y = Math.random() * Math.PI;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        gameState.scene.add(mesh);
        mesh.userData.isObstacle = true;
        gameState.obstacles.push(mesh);

        if (i % 8 === 0) createTree(x + 24, z - 16);
    }
}

function createTree(x, z) {
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 2.4, 20, 8),
        new THREE.MeshStandardMaterial({ color: 0x4a341e, roughness: 0.95 })
    );
    trunk.position.set(x, 10, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;

    const top = new THREE.Mesh(
        new THREE.ConeGeometry(10, 24, 10),
        new THREE.MeshStandardMaterial({ color: 0x2e5f3e, roughness: 1.0 })
    );
    top.position.set(x, 27, z);
    top.castShadow = true;
    top.receiveShadow = true;

    gameState.scene.add(trunk);
    gameState.scene.add(top);
}

function createLightPoles() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x202a35, roughness: 0.7, metalness: 0.5 });
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0xcdefff, emissive: 0x4ab8ff, emissiveIntensity: 1.2 });

    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 520;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 45, 10), poleMat);
        pole.position.set(x, 22, z);
        pole.castShadow = true;
        gameState.scene.add(pole);

        const bulb = new THREE.Mesh(new THREE.SphereGeometry(2.4, 12, 12), bulbMat);
        bulb.position.set(x, 45, z);
        gameState.scene.add(bulb);

        const light = new THREE.PointLight(0x7dcfff, 35, 220, 2);
        light.position.set(x, 45, z);
        gameState.scene.add(light);
    }
}
