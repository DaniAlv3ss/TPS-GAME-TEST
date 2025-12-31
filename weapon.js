import * as THREE from 'three';
import { gameState, inputs } from './globals.js';
import * as UI from './ui.js';

// --- BANCO DE DADOS DE ARMAS ---
const WEAPON_DB = [
    {
        name: "MK-17 TACTICAL",
        type: "auto", damage: 1, fireRate: 100, ammo: 30, reloadTime: 1500, speed: 1500, spread: 0.03, recoil: 0.003,
        color: 0x3d352b, sight: "holo", model: { barrelLen: 14, bodyLen: 12, magType: "box" }, camOffset: { y: 5.0, z: -1.0 }
    },
    {
        name: "MP5 SUBMACHINE",
        type: "auto", damage: 0.6, fireRate: 60, ammo: 45, reloadTime: 1000, speed: 1200, spread: 0.06, recoil: 0.002,
        color: 0x1a1a1a, sight: "red_dot", model: { barrelLen: 6, bodyLen: 8, magType: "thin" }, camOffset: { y: 4.5, z: -0.5 }
    },
    {
        name: "M4A1 CARBINE",
        type: "auto", damage: 1, fireRate: 90, ammo: 30, reloadTime: 1300, speed: 1600, spread: 0.025, recoil: 0.0025,
        color: 0x222222, sight: "holo", model: { barrelLen: 12, bodyLen: 10, magType: "box" }, camOffset: { y: 5.0, z: -1.0 }
    },
    {
        name: "AK-47 VETERAN",
        type: "auto", damage: 1.5, fireRate: 120, ammo: 30, reloadTime: 1800, speed: 1400, spread: 0.05, recoil: 0.006,
        color: 0x5c4033, sight: "iron", model: { barrelLen: 14, bodyLen: 12, magType: "curve" }, camOffset: { y: 3.8, z: 0.0 }
    },
    {
        name: "AWP SNIPER",
        type: "semi", damage: 10, fireRate: 1500, ammo: 5, reloadTime: 2500, speed: 3000, spread: 0.001, recoil: 0.05,
        color: 0x2f4f2f, sight: "scope", model: { barrelLen: 22, bodyLen: 14, magType: "box" }, camOffset: { y: 5.5, z: -2.0 }
    },
    {
        name: "M870 SHOTGUN",
        type: "shotgun", damage: 1, fireRate: 800, ammo: 8, reloadTime: 3000, speed: 900, spread: 0.15, recoil: 0.04,
        color: 0x333333, sight: "iron", model: { barrelLen: 16, bodyLen: 10, magType: "none" }, camOffset: { y: 3.5, z: 0.0 }
    },
    {
        name: "GLOCK 18C",
        type: "auto", damage: 0.4, fireRate: 50, ammo: 20, reloadTime: 800, speed: 1000, spread: 0.08, recoil: 0.004,
        color: 0x555555, sight: "iron_pistol", model: { barrelLen: 4, bodyLen: 5, magType: "pistol" }, camOffset: { y: 3.0, z: 1.0 }
    },
    {
        name: "M249 SAW",
        type: "auto", damage: 1.2, fireRate: 85, ammo: 100, reloadTime: 4000, speed: 1400, spread: 0.06, recoil: 0.004,
        color: 0x3d352b, sight: "red_dot", model: { barrelLen: 18, bodyLen: 14, magType: "box_big" }, camOffset: { y: 5.0, z: -0.5 }
    },
    {
        name: "VECTOR .45",
        type: "auto", damage: 0.5, fireRate: 40, ammo: 35, reloadTime: 900, speed: 1100, spread: 0.04, recoil: 0.001,
        color: 0xeeeeee, sight: "holo", model: { barrelLen: 8, bodyLen: 8, magType: "thin" }, camOffset: { y: 5.0, z: -1.0 }
    },
    {
        name: "RAILGUN PROTO",
        type: "semi", damage: 20, fireRate: 1000, ammo: 3, reloadTime: 2000, speed: 5000, spread: 0.0, recoil: 0.02,
        color: 0x00aaff, sight: "scope_digital", model: { barrelLen: 20, bodyLen: 16, magType: "energy" }, camOffset: { y: 5.5, z: -1.5 }
    }
];

let currentWeapon = WEAPON_DB[0];
let currentAmmo = currentWeapon.ammo;
let isReloading = false;
let lastShotTime = 0;
const raycaster = new THREE.Raycaster();

export function initWeaponSystem() {
    currentWeapon = WEAPON_DB[gameState.currentWeaponIdx];
    currentAmmo = currentWeapon.ammo;
    UI.updateWeaponInfo(currentWeapon.name, currentAmmo, currentWeapon.ammo);
}

export function switchWeapon(index) {
    if (index < 0 || index >= WEAPON_DB.length) return;
    if (gameState.currentWeaponIdx === index) return;
    
    gameState.currentWeaponIdx = index;
    currentWeapon = WEAPON_DB[index];
    currentAmmo = currentWeapon.ammo;
    isReloading = false;
    
    UI.updateWeaponInfo(currentWeapon.name, currentAmmo, currentWeapon.ammo);
    
    if (gameState.aimPivot) {
        if (gameState.gunMesh) gameState.aimPivot.remove(gameState.gunMesh);
        createWeapon(gameState.aimPivot);
    }
}

export function createWeapon(parentGroup) {
    const gunMesh = new THREE.Group();
    gunMesh.position.set(8, 14, -8); 
    parentGroup.add(gunMesh);
    gameState.gunMesh = gunMesh;

    const gunMat = new THREE.MeshStandardMaterial({ color: currentWeapon.color, roughness: 0.3, metalness: 0.4 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7, metalness: 0.2 });
    const m = currentWeapon.model;

    // Body & Barrel
    const body = new THREE.Mesh(new THREE.BoxGeometry(3, 5, m.bodyLen), gunMat);
    body.position.z = 0;
    gunMesh.add(body);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, m.barrelLen, 12), darkMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = - (m.bodyLen/2 + m.barrelLen/2);
    gunMesh.add(barrel);

    // Magazine
    if (m.magType !== "none") {
        let magGeo = new THREE.BoxGeometry(2.5, 8, 4);
        if(m.magType === "thin") magGeo = new THREE.BoxGeometry(2, 8, 2.5);
        if(m.magType === "pistol") magGeo = new THREE.BoxGeometry(2, 6, 2);
        if(m.magType === "box_big") magGeo = new THREE.BoxGeometry(4, 6, 5);
        
        const mag = new THREE.Mesh(magGeo, darkMetal);
        mag.position.set(0, -4, 0);
        if(m.magType === "curve") mag.rotation.x = 0.3;
        gunMesh.add(mag);
    }

    // Tip
    const gunBarrelTip = new THREE.Object3D();
    gunBarrelTip.position.set(0, 0, - (m.bodyLen/2 + m.barrelLen));
    gunMesh.add(gunBarrelTip);
    gameState.gunBarrelTip = gunBarrelTip;

    // Sight
    buildSight(gunMesh, currentWeapon.sight, gunMat, darkMetal);

    // Camera FPS Point
    const cameraFPSPoint = new THREE.Object3D();
    cameraFPSPoint.position.set(0, currentWeapon.camOffset.y, currentWeapon.camOffset.z); 
    gunMesh.add(cameraFPSPoint);
    gameState.cameraFPSPoint = cameraFPSPoint;
}

function buildSight(parent, type, matBody, matDetail) {
    const sightGroup = new THREE.Group();
    sightGroup.position.set(0, 2.6, 0); 
    parent.add(sightGroup);

    if (type === "holo") {
        sightGroup.add(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 5), matDetail));
        const lens = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), createReticleTexture("circle"));
        lens.position.set(0, 1.5, -1.0);
        sightGroup.add(lens);
    } else if (type === "red_dot" || type === "scope" || type === "scope_digital") {
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 4, 16), matDetail);
        tube.rotation.x = Math.PI / 2;
        tube.position.y = 1.0;
        sightGroup.add(tube);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.8, 16), createReticleTexture(type === "scope" ? "cross" : "dot"));
        lens.position.set(0, 1.0, -2.05);
        sightGroup.add(lens);
    } else {
        // Iron
        const front = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.5), matDetail);
        front.position.set(0, 0.5, -4);
        sightGroup.add(front);
    }
}

function createReticleTexture(style) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,128,128);
    ctx.strokeStyle = '#ff0000'; ctx.fillStyle = '#ff0000'; ctx.lineWidth = 3;
    const cx = 64; const cy = 64;

    if(style === "circle") {
        ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI*2); ctx.fill();
    } else if(style === "cross") {
        ctx.beginPath(); ctx.moveTo(cx,0); ctx.lineTo(cx,128); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,cy); ctx.lineTo(128,cy); ctx.stroke();
    } else {
        ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2); ctx.fill();
    }
    return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, side: THREE.DoubleSide });
}

export function reload() {
    if (isReloading || currentAmmo === currentWeapon.ammo) return;
    isReloading = true;
    UI.showReloadMsg(true);
    gameState.gunMesh.rotation.x += 0.8; 
    setTimeout(() => {
        currentAmmo = currentWeapon.ammo;
        UI.updateAmmoUI(currentAmmo, currentWeapon.ammo);
        isReloading = false;
        UI.showReloadMsg(false);
        gameState.gunMesh.rotation.x -= 0.8;
    }, currentWeapon.reloadTime);
}

export function tryShoot(time) {
    if (inputs.isLeftMouseDown && time - lastShotTime > currentWeapon.fireRate) {
        shoot(time);
    }
}

function shoot(time) {
    if (currentAmmo <= 0) { UI.showNoAmmoMsg(); return; }
    if (isReloading) return;

    lastShotTime = time;
    currentAmmo--;
    UI.updateAmmoUI(currentAmmo, currentWeapon.ammo);

    const pelletCount = currentWeapon.type === "shotgun" ? 6 : 1;
    for(let i=0; i<pelletCount; i++) createBullet();

    // Recuo
    if(inputs.aimMode !== 2) gameState.camera.rotation.x += currentWeapon.recoil;
    gameState.gunMesh.position.z += 0.5;
    setTimeout(() => gameState.gunMesh.position.z -= 0.5, 50);
}

function createBullet() {
    const bullet = new THREE.Mesh(new THREE.SphereGeometry(0.2,4,4), new THREE.MeshBasicMaterial({color:0xffffaa}));
    const startPos = new THREE.Vector3();
    gameState.gunBarrelTip.getWorldPosition(startPos);
    bullet.position.copy(startPos);

    raycaster.setFromCamera(new THREE.Vector2(0,0), gameState.camera);
    const intersects = raycaster.intersectObjects(gameState.scene.children, true);
    let target = new THREE.Vector3();
    let found = false;
    for(let hit of intersects) {
        let obj = hit.object;
        let isPlayer = false;
        while(obj) { if(obj === gameState.playerGroup) { isPlayer = true; break; } obj = obj.parent; }
        if(!isPlayer) { target.copy(hit.point); found = true; break; }
    }
    if(!found) raycaster.ray.at(1000, target);

    let dir = new THREE.Vector3().subVectors(target, startPos).normalize();
    let spread = currentWeapon.spread;
    if(inputs.aimMode !== 0) spread *= 0.2;
    dir.x += (Math.random()-0.5)*spread; dir.y += (Math.random()-0.5)*spread; dir.z += (Math.random()-0.5)*spread;
    dir.normalize();

    bullet.userData = { velocity: dir.multiplyScalar(currentWeapon.speed), life: 100, damage: currentWeapon.damage };
    gameState.bullets.push(bullet);
    gameState.scene.add(bullet);
}

export function updateBullets(delta) {
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const b = gameState.bullets[i];
        b.position.add(b.userData.velocity.clone().multiplyScalar(delta));
        let hit = false;
        
        for(let j = gameState.enemies.length - 1; j >= 0; j--) {
            if(b.position.distanceTo(gameState.enemies[j].position) < 14) {
                const enemy = gameState.enemies[j];
                enemy.userData.health -= b.userData.damage;
                if(enemy.userData.health <= 0) {
                    gameState.scene.remove(enemy);
                    gameState.enemies.splice(j, 1);
                    gameState.score += 50;
                    UI.updateScoreUI();
                }
                hit = true; break;
            }
        }
        if(!hit && b.position.y < 0) hit = true;
        if(hit || b.userData.life-- <= 0) { gameState.scene.remove(b); gameState.bullets.splice(i,1); }
    }
}
