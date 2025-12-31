import * as THREE from 'three';
import { gameState, CONSTANTS, inputs } from './globals.js'; // Importa inputs daqui
import * as UI from './ui.js';

let currentAmmo = CONSTANTS.MAX_AMMO;
let isReloading = false;
let lastShotTime = 0;
const raycaster = new THREE.Raycaster();

export function createWeapon(parentGroup) {
    const gunMesh = new THREE.Group();
    gunMesh.position.set(8, 14, -8); 
    parentGroup.add(gunMesh);
    gameState.gunMesh = gunMesh;

    const gunMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.4, metalness: 0.5 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.7, metalness: 0.3 });
    
    // Modelagem da Arma
    const body = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 14), gunMat);
    body.position.z = -2;
    gunMesh.add(body);

    const mag = new THREE.Mesh(new THREE.BoxGeometry(2.5, 8, 4), darkMetal);
    mag.position.set(0, -5, -2);
    mag.rotation.x = 0.3;
    gunMesh.add(mag);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 14, 12), gunMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -14;
    gunMesh.add(barrel);
    
    const sup = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 8, 12), darkMetal);
    sup.rotation.x = Math.PI / 2;
    sup.position.z = -23;
    gunMesh.add(sup);

    // Ponta do cano
    const gunBarrelTip = new THREE.Object3D();
    gunBarrelTip.position.set(0, 0, -28);
    gunMesh.add(gunBarrelTip);
    gameState.gunBarrelTip = gunBarrelTip;

    // Mira Holográfica
    const sightGroup = new THREE.Group();
    sightGroup.position.set(0, 3.5, -4); 
    gunMesh.add(sightGroup);
    
    sightGroup.add(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 5), gunMat)); 
    
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 4), gunMat);
    sideL.position.set(-1.1, 1.5, 0);
    sightGroup.add(sideL);
    const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 4), gunMat);
    sideR.position.set(1.1, 1.5, 0);
    sightGroup.add(sideR);
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 3), gunMat);
    top.position.set(0, 2.8, 0.5); 
    sightGroup.add(top);
    
    const lensGeo = new THREE.PlaneGeometry(2.0, 2.2);
    const lensMat = new THREE.MeshBasicMaterial({ 
        color: 0x88ccff, transparent: true, opacity: 0.15, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, 1.5, -0.5); 
    sightGroup.add(lens);

    const reticleMat = createReticleTexture();
    const reticleMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), reticleMat);
    reticleMesh.position.set(0, 1.5, -0.55); 
    sightGroup.add(reticleMesh);
    
    const cameraFPSPoint = new THREE.Object3D();
    cameraFPSPoint.position.set(0, 5.0, -1.0); 
    gunMesh.add(cameraFPSPoint);
    gameState.cameraFPSPoint = cameraFPSPoint;
}

function createReticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.strokeStyle = '#ff0000'; ctx.fillStyle = '#ff0000';
    ctx.shadowBlur = 5; ctx.shadowColor = "#ff0000";
    const cx = 64; const cy = 64;
    
    ctx.beginPath(); ctx.lineWidth = 3; ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, cy-40); ctx.lineTo(cx, cy-50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy+40); ctx.lineTo(cx, cy+50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx-40, cy); ctx.lineTo(cx-50, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+40, cy); ctx.lineTo(cx+50, cy); ctx.stroke();

    return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, side: THREE.DoubleSide, depthTest: false });
}

export function reload() {
    if (isReloading || currentAmmo === CONSTANTS.MAX_AMMO) return;
    isReloading = true;
    UI.showReloadMsg(true);
    
    const originalRot = gameState.gunMesh.rotation.x;
    gameState.gunMesh.rotation.x += 0.8; 

    setTimeout(() => {
        currentAmmo = CONSTANTS.MAX_AMMO;
        UI.updateAmmoUI(currentAmmo, CONSTANTS.MAX_AMMO);
        isReloading = false;
        UI.showReloadMsg(false);
        gameState.gunMesh.rotation.x = originalRot;
    }, 1500);
}

export function tryShoot(time) {
    if (inputs.isLeftMouseDown && time - lastShotTime > CONSTANTS.FIRE_RATE) {
        shoot(time);
    }
}

function shoot(time) {
    if (currentAmmo <= 0) {
        UI.showNoAmmoMsg();
        return;
    }
    if (isReloading) return;

    lastShotTime = time;
    currentAmmo--;
    UI.updateAmmoUI(currentAmmo, CONSTANTS.MAX_AMMO);

    const flash = new THREE.PointLight(0xffffaa, 4, 25);
    gameState.gunBarrelTip.getWorldPosition(flash.position);
    gameState.scene.add(flash);
    setTimeout(() => gameState.scene.remove(flash), 40);

    const bullet = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 4, 4), 
        new THREE.MeshBasicMaterial({ color: 0xffffaa })
    );
    const startPos = new THREE.Vector3();
    gameState.gunBarrelTip.getWorldPosition(startPos);
    bullet.position.copy(startPos);

    raycaster.setFromCamera(new THREE.Vector2(0, 0), gameState.camera);
    const intersects = raycaster.intersectObjects(gameState.scene.children, true);
    let targetPoint = new THREE.Vector3();
    let found = false;

    for(let hit of intersects) {
        let obj = hit.object;
        let isPlayer = false;
        while(obj) {
            if(obj === gameState.playerGroup) { isPlayer = true; break; }
            obj = obj.parent;
        }
        if(!isPlayer) {
            targetPoint.copy(hit.point);
            found = true;
            break;
        }
    }
    if(!found) raycaster.ray.at(1000, targetPoint);

    let dir = new THREE.Vector3().subVectors(targetPoint, startPos).normalize();
    
    let spread = 0.03; 
    if (inputs.aimMode === 1) spread = 0.004; 
    if (inputs.aimMode === 2) spread = 0.0005; 

    dir.x += (Math.random() - 0.5) * spread;
    dir.y += (Math.random() - 0.5) * spread;
    dir.z += (Math.random() - 0.5) * spread;
    dir.normalize();

    bullet.userData = { velocity: dir.multiplyScalar(CONSTANTS.BULLET_SPEED), life: 100 };
    gameState.bullets.push(bullet);
    gameState.scene.add(bullet);

    if (inputs.aimMode !== 2) {
        gameState.camera.rotation.x += 0.003;
    }
    gameState.gunMesh.position.z += 0.5;
    setTimeout(() => gameState.gunMesh.position.z -= 0.5, 40);
}

export function updateBullets(delta) {
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const b = gameState.bullets[i];
        b.position.add(b.userData.velocity.clone().multiplyScalar(delta));
        
        let hit = false;
        for(let j = gameState.enemies.length - 1; j >= 0; j--) {
            if(b.position.distanceTo(gameState.enemies[j].position) < 14) {
                const enemy = gameState.enemies[j];
                enemy.userData.health--;
                enemy.position.add(b.userData.velocity.clone().normalize().multiplyScalar(3));
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
        if(!hit) {
            for(let obs of gameState.obstacles) {
                 if(b.position.x > obs.position.x - 10 && b.position.x < obs.position.x + 10 &&
                   b.position.z > obs.position.z - 10 && b.position.z < obs.position.z + 10 &&
                   b.position.y > 0 && b.position.y < 30) {
                    hit = true; break;
                }
            }
        }

        if(hit || b.userData.life-- <= 0) {
            gameState.scene.remove(b);
            gameState.bullets.splice(i, 1);
        }
    }
}
