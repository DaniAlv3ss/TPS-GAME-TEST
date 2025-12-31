import * as THREE from 'three';
import { gameState, inputs, CONSTANTS } from './globals.js';
import * as UI from './ui.js';

// --- ARMAS CONFIG ---
const WEAPON_DB = [
    { name: "MK-17 SCAR-H", type: "auto", damage: 1.2, fireRate: 110, ammo: 20, reloadTime: 1800, speed: 1600, spread: 0.02, recoil: 0.004, color: 0xc2b280, builder: "scar", sight: "holo", camOffset: { y: 5.2, z: -2.0 } },
    { name: "MP5 A3", type: "auto", damage: 0.7, fireRate: 65, ammo: 30, reloadTime: 1200, speed: 1100, spread: 0.05, recoil: 0.002, color: 0x1a1a1a, builder: "mp5", sight: "red_dot", camOffset: { y: 4.8, z: -1.0 } },
    { name: "M4A1 SOPMOD", type: "auto", damage: 1.0, fireRate: 80, ammo: 30, reloadTime: 1500, speed: 1500, spread: 0.025, recoil: 0.003, color: 0x222222, builder: "ar15", sight: "acog", camOffset: { y: 5.5, z: -3.0 } },
    { name: "AK-47 CLASSIC", type: "auto", damage: 1.6, fireRate: 120, ammo: 30, reloadTime: 2000, speed: 1400, spread: 0.06, recoil: 0.007, color: 0x222222, woodColor: 0x8b4513, builder: "ak47", sight: "iron_ak", camOffset: { y: 3.2, z: 1.5 } },
    { name: "AWP MAGNUM", type: "semi", damage: 15.0, fireRate: 1500, ammo: 5, reloadTime: 3000, speed: 3000, spread: 0.0, recoil: 0.08, color: 0x3d4c3d, builder: "awp", sight: "scope_sniper", camOffset: { y: 6.0, z: -2.5 } },
    { name: "M870 BREACHER", type: "shotgun", damage: 1.2, fireRate: 900, ammo: 7, reloadTime: 3500, speed: 800, spread: 0.12, recoil: 0.05, color: 0x333333, builder: "shotgun", sight: "iron_shotgun", camOffset: { y: 3.5, z: 1.0 } },
    { name: "GLOCK 18C", type: "auto", damage: 0.5, fireRate: 50, ammo: 19, reloadTime: 900, speed: 1000, spread: 0.08, recoil: 0.005, color: 0x444444, builder: "pistol", sight: "iron_pistol", camOffset: { y: 3.0, z: 2.0 } },
    { name: "M249 PARA", type: "auto", damage: 1.1, fireRate: 90, ammo: 100, reloadTime: 4500, speed: 1400, spread: 0.07, recoil: 0.005, color: 0x333333, builder: "lmg", sight: "holo", camOffset: { y: 5.5, z: -1.0 } },
    { name: "VECTOR .45", type: "auto", damage: 0.6, fireRate: 35, ammo: 30, reloadTime: 1000, speed: 1200, spread: 0.03, recoil: 0.001, color: 0xeeeeee, builder: "vector", sight: "red_dot", camOffset: { y: 5.0, z: -1.0 } },
    { name: "RAILGUN MK-II", type: "semi", damage: 25.0, fireRate: 1200, ammo: 3, reloadTime: 2500, speed: 5000, spread: 0.0, recoil: 0.03, color: 0x001133, builder: "railgun", sight: "scope_digital", camOffset: { y: 5.5, z: -2.0 } }
];

let currentWeapon = WEAPON_DB[0];
let currentAmmo = currentWeapon.ammo;
let isReloading = false;
let lastShotTime = 0;
const raycaster = new THREE.Raycaster();

const MAT_BLACK_METAL = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7, metalness: 0.6 });
const MAT_DARK_GREY = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.3 });
const MAT_SHINY_METAL = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.9 });
const MAT_PLASTIC = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9, metalness: 0.1 });

// --- LÓGICA DE CONTROLE ---

export function initWeaponSystem() {
    switchWeapon(0);
}

export function switchWeapon(index) {
    if (index < 0 || index >= WEAPON_DB.length) return;
    
    // Correção do Stacking: Remove a arma antiga se ela existir
    if (gameState.gunMesh && gameState.aimPivot) {
        gameState.aimPivot.remove(gameState.gunMesh);
        gameState.gunMesh = null; // Limpa a referência
    }
    
    gameState.currentWeaponIdx = index;
    currentWeapon = WEAPON_DB[index];
    currentAmmo = currentWeapon.ammo;
    isReloading = false;
    
    UI.updateWeaponInfo(currentWeapon.name, currentAmmo, currentWeapon.ammo);
    
    if (gameState.aimPivot) {
        createWeapon(gameState.aimPivot);
    }
}

export function createWeapon(parentGroup) {
    const gunMesh = new THREE.Group();
    gunMesh.position.set(8, 14, -8); 
    parentGroup.add(gunMesh);
    gameState.gunMesh = gunMesh;

    const builderFn = BUILDERS[currentWeapon.builder] || BUILDERS["ar15"];
    const components = builderFn(gunMesh, currentWeapon);

    gameState.gunBarrelTip = components.tip;
    buildSight(gunMesh, currentWeapon.sight, components.topRailY || 4.0);

    const cameraFPSPoint = new THREE.Object3D();
    cameraFPSPoint.position.set(0, currentWeapon.camOffset.y, currentWeapon.camOffset.z); 
    gunMesh.add(cameraFPSPoint);
    gameState.cameraFPSPoint = cameraFPSPoint;
}

// --- FÁBRICA DE ARMAS (BUILDERS) ---
const BUILDERS = {
    "ar15": (group, config) => {
        const primary = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.5 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.5, 9), primary); body.position.z = -2; group.add(body);
        const upper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.5, 9), MAT_DARK_GREY); upper.position.set(0, 3.0, -2); group.add(upper);
        const mag = new THREE.Mesh(new THREE.BoxGeometry(2.1, 7, 4.5), MAT_BLACK_METAL); mag.position.set(0, -6, -5); mag.rotation.x = 0.15; group.add(mag);
        const grip = new THREE.Mesh(new THREE.BoxGeometry(1.8, 5, 2.5), MAT_PLASTIC); grip.position.set(0, -3.5, 0.5); grip.rotation.x = 0.3; group.add(grip);
        const hg = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.5, 10), primary); hg.position.z = -12; group.add(hg);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 12), MAT_BLACK_METAL); barrel.rotateX(Math.PI/2); barrel.position.z = -18; group.add(barrel);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(2.5, 6, 2), MAT_PLASTIC); stock.position.set(0, -1.5, 8); group.add(stock);
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.8,0.8,8,8), MAT_BLACK_METAL); tube.rotateX(Math.PI/2); tube.position.z = 4; group.add(tube);
        const tip = new THREE.Object3D(); tip.position.set(0, 0, -22); group.add(tip);
        return { tip: tip, topRailY: 4.2 };
    },
    "ak47": (group, config) => {
        const metal = MAT_BLACK_METAL;
        const wood = new THREE.MeshStandardMaterial({ color: config.woodColor, roughness: 0.6 });
        const rec = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4, 12), metal); rec.position.z = -3; group.add(rec);
        const cover = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 12, 12, 1, false, 0, Math.PI), metal); cover.rotateY(Math.PI/2); cover.rotateZ(Math.PI/2); cover.position.set(0, 2.0, -3); group.add(cover);
        const hg = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.5, 6), wood); hg.position.set(0, -0.5, -12); group.add(hg);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 14, 8), metal); barrel.rotateX(Math.PI/2); barrel.position.z = -14; group.add(barrel);
        const mag = new THREE.Mesh(new THREE.BoxGeometry(2.4, 10, 4.5), MAT_PLASTIC); mag.position.set(0, -6, -6); mag.rotation.x = 0.4; group.add(mag);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(2.2, 5, 8), wood); stock.position.set(0, -1, 6); stock.rotateX(-0.1); group.add(stock);
        const tip = new THREE.Object3D(); tip.position.set(0, 0, -21); group.add(tip);
        return { tip: tip, topRailY: 2.5 };
    },
    "mp5": (group, config) => {
        const upper = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 10, 12), MAT_DARK_GREY); upper.rotateX(Math.PI/2); upper.position.set(0, 2, -2); group.add(upper);
        const mag = new THREE.Mesh(new THREE.BoxGeometry(1.8, 8, 2.5), MAT_BLACK_METAL); mag.position.set(0, -4, -3); mag.rotateX(0.1); group.add(mag);
        const hg = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 6, 8), MAT_PLASTIC); hg.rotateX(Math.PI/2); hg.position.set(0, 1.5, -9); group.add(hg);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4, 1), MAT_PLASTIC); stock.position.set(0, 0, 9); group.add(stock);
        const tip = new THREE.Object3D(); tip.position.set(0, 1.5, -14); group.add(tip);
        return { tip: tip, topRailY: 3.2 };
    },
    "scar": (group, config) => {
        const body = new THREE.MeshStandardMaterial({color: config.color});
        const upper = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4, 18), body); upper.position.set(0, 2, -6); group.add(upper);
        const lower = new THREE.Mesh(new THREE.BoxGeometry(2.3, 3, 8), body); lower.position.set(0, -1.5, -2); group.add(lower);
        const mag = new THREE.Mesh(new THREE.BoxGeometry(2.4, 6, 4), MAT_BLACK_METAL); mag.position.set(0, -5, -4); group.add(mag);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(2.6, 7, 6), body); stock.position.set(0, 0, 6); group.add(stock);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 6, 12), MAT_BLACK_METAL); barrel.rotateX(Math.PI/2); barrel.position.z = -18; group.add(barrel);
        const tip = new THREE.Object3D(); tip.position.set(0, 0, -21); group.add(tip);
        return { tip: tip, topRailY: 4.0 };
    },
    "awp": (group, config) => {
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 4, 18), new THREE.MeshStandardMaterial({color: config.color})); body.position.z = -4; group.add(body);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 20, 8), MAT_BLACK_METAL); barrel.rotateX(Math.PI/2); barrel.position.z = -20; group.add(barrel);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(2.5, 6, 4), new THREE.MeshStandardMaterial({color: config.color})); stock.position.z = 8; group.add(stock);
        const tip = new THREE.Object3D(); tip.position.set(0, 0, -32); group.add(tip);
        return { tip: tip, topRailY: 3.5 };
    },
    "shotgun": (group, config) => {
        const metal = MAT_DARK_GREY;
        const rec = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.5, 8), metal); rec.position.z = -2; group.add(rec);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 18, 12), metal); barrel.rotateX(Math.PI/2); barrel.position.set(0,1,-12); group.add(barrel);
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 16, 12), metal); tube.rotateX(Math.PI/2); tube.position.set(0,-0.6,-11); group.add(tube);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(2.5, 5, 8), MAT_PLASTIC); stock.position.set(0,-1,5); group.add(stock);
        const tip = new THREE.Object3D(); tip.position.set(0, 1, -21); group.add(tip);
        return { tip: tip, topRailY: 1.8 };
    },
    "pistol": (group, config) => {
        const slide = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 7), new THREE.MeshStandardMaterial({color: config.color})); slide.position.set(0,2,-2); group.add(slide);
        const grip = new THREE.Mesh(new THREE.BoxGeometry(1.8, 4, 2.5), MAT_PLASTIC); grip.position.set(0,-1.5,0); grip.rotateX(0.1); group.add(grip);
        const tip = new THREE.Object3D(); tip.position.set(0, 2, -6); group.add(tip);
        return { tip: tip, topRailY: 3.0 };
    },
    "railgun": (group, config) => {
        const mat = new THREE.MeshStandardMaterial({color: config.color});
        const railL = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 20), mat); railL.position.set(-1.5, 0, -10); group.add(railL);
        const railR = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 20), mat); railR.position.set(1.5, 0, -10); group.add(railR);
        const tip = new THREE.Object3D(); tip.position.set(0, 0, -22); group.add(tip);
        return { tip: tip, topRailY: 3.5 };
    },
    "lmg": (group, config) => BUILDERS["ar15"](group, config),
    "vector": (group, config) => BUILDERS["mp5"](group, config)
};

// --- MIRA ---
function buildSight(parent, type, yPos) {
    const s = new THREE.Group(); s.position.set(0, yPos, 0); parent.add(s);
    const metal = MAT_BLACK_METAL;

    if(type === "holo") {
        s.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.4, 5), metal));
        const hood = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.5, 4), metal); hood.position.set(0, 1.5, 0); 
        // Furar o hood visualmente usando materiais transparentes não funciona bem com simple geo, então usamos box vazio
        // Simplificado: Lente no meio
        const lens = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), createLensMaterial("circle")); lens.position.set(0, 1.5, -0.5); s.add(lens);
        // Paredes laterais
        const wl = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 4), metal); wl.position.set(-1.2, 1.5, 0); s.add(wl);
        const wr = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 4), metal); wr.position.set(1.2, 1.5, 0); s.add(wr);
        const wt = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 3), metal); wt.position.set(0, 2.8, 0.5); s.add(wt);
    } else if(type.includes("scope")) {
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 12, 16), metal); tube.rotateX(Math.PI/2); tube.position.y=2; s.add(tube);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(1.5, 16), createLensMaterial("mil-dot")); lens.position.set(0, 2, -5.9); s.add(lens);
    } else if(type === "red_dot" || type === "acog") {
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 4, 16), metal); tube.rotateX(Math.PI/2); tube.position.y=1.4; s.add(tube);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(1.0, 16), createLensMaterial(type === "acog" ? "chevron" : "dot")); lens.position.set(0, 1.4, -1.9); s.add(lens);
    } else { // Iron
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.5, 0.3), metal); post.position.set(0, 0.8, -10); s.add(post);
    }
}

function createLensMaterial(style) {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d'); const cx = 64, cy = 64;
    ctx.strokeStyle = '#ff0000'; ctx.fillStyle = '#ff0000'; ctx.lineWidth = 3; ctx.shadowBlur = 5; ctx.shadowColor = "#ff0000";
    
    if(style === "circle") {
        ctx.beginPath(); ctx.arc(cx, cy, 35, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx, cy-35); ctx.lineTo(cx, cy-45); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy+35); ctx.lineTo(cx, cy+45); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx-35, cy); ctx.lineTo(cx-45, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+35, cy); ctx.lineTo(cx+45, cy); ctx.stroke();
    } else if(style === "dot") {
        ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2); ctx.fill();
    } else if(style === "mil-dot") {
        ctx.strokeStyle = '#000000'; ctx.fillStyle = '#000000'; ctx.lineWidth = 2; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, 128); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(128, cy); ctx.stroke();
    } else if(style === "chevron") {
        ctx.beginPath(); ctx.moveTo(cx, cy-5); ctx.lineTo(cx-10, cy+10); ctx.lineTo(cx+10, cy+10); ctx.closePath(); ctx.stroke();
    }
    return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, side: THREE.DoubleSide });
}

// --- SHOOTING ---
export function reload() {
    if (isReloading || currentAmmo === currentWeapon.ammo) return;
    isReloading = true; UI.showReloadMsg(true);
    gameState.gunMesh.rotation.x += 0.8; 
    setTimeout(() => {
        currentAmmo = currentWeapon.ammo; UI.updateAmmoUI(currentAmmo, currentWeapon.ammo);
        isReloading = false; UI.showReloadMsg(false); gameState.gunMesh.rotation.x -= 0.8;
    }, currentWeapon.reloadTime);
}

export function tryShoot(time) {
    if (inputs.isLeftMouseDown && time - lastShotTime > currentWeapon.fireRate) {
        if(currentWeapon.type === "semi" && !inputs.isNewClick) return; // Precisa resetar click
        shoot(time);
        inputs.isNewClick = false; 
    }
}

function shoot(time) {
    if (currentAmmo <= 0) { UI.showNoAmmoMsg(); return; }
    if (isReloading) return;
    lastShotTime = time; currentAmmo--; UI.updateAmmoUI(currentAmmo, currentWeapon.ammo);

    const flash = new THREE.PointLight(0xffffaa, 4, 25);
    gameState.gunBarrelTip.getWorldPosition(flash.position);
    gameState.scene.add(flash);
    setTimeout(() => gameState.scene.remove(flash), 50);
    
    // Smoke Particle
    createSmoke(flash.position);

    const pc = currentWeapon.type === "shotgun" ? 8 : 1;
    for(let i=0; i<pc; i++) createBullet();

    if(inputs.aimMode !== 2) gameState.camera.rotation.x += currentWeapon.recoil;
    gameState.gunMesh.position.z += 0.5;
    setTimeout(() => gameState.gunMesh.position.z -= 0.5, 50);
}

function createSmoke(pos) {
    // Fumaça simples
    const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const mat = new THREE.MeshBasicMaterial({color: 0xaaaaaa, transparent: true, opacity: 0.6});
    for(let i=0; i<3; i++) {
        const p = new THREE.Mesh(geo, mat);
        p.position.copy(pos);
        p.userData = { vel: new THREE.Vector3((Math.random()-0.5)*5, Math.random()*5, (Math.random()-0.5)*5), life: 30 };
        gameState.particles.push(p);
        gameState.scene.add(p);
    }
}

function createBullet() {
    const bullet = new THREE.Mesh(new THREE.SphereGeometry(0.15,4,4), new THREE.MeshBasicMaterial({color:0xffffaa}));
    const startPos = new THREE.Vector3(); gameState.gunBarrelTip.getWorldPosition(startPos); bullet.position.copy(startPos);
    
    raycaster.setFromCamera(new THREE.Vector2(0,0), gameState.camera);
    const intersects = raycaster.intersectObjects(gameState.scene.children, true);
    let target = new THREE.Vector3(); let found = false;
    for(let hit of intersects) {
        let obj = hit.object; let isPlayer = false;
        while(obj) { if(obj === gameState.playerGroup) { isPlayer = true; break; } obj = obj.parent; }
        if(!isPlayer) { target.copy(hit.point); found = true; break; }
    }
    if(!found) raycaster.ray.at(1000, target);

    let dir = new THREE.Vector3().subVectors(target, startPos).normalize();
    let spread = currentWeapon.spread; if(inputs.aimMode !== 0) spread *= 0.2;
    if(currentWeapon.type === "shotgun") spread = currentWeapon.spread;
    dir.x += (Math.random()-0.5)*spread; dir.y += (Math.random()-0.5)*spread; dir.z += (Math.random()-0.5)*spread; dir.normalize();

    bullet.userData = { velocity: dir.multiplyScalar(currentWeapon.speed), life: 100, damage: currentWeapon.damage };
    gameState.bullets.push(bullet); gameState.scene.add(bullet);
}

export function updateBullets(delta) {
    // Atualizar balas e particulas
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.position.add(p.userData.vel.clone().multiplyScalar(delta));
        p.material.opacity -= delta * 2;
        if(p.material.opacity <= 0) { gameState.scene.remove(p); gameState.particles.splice(i,1); }
    }

    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const b = gameState.bullets[i];
        b.position.add(b.userData.velocity.clone().multiplyScalar(delta));
        let hit = false;
        for(let j = gameState.enemies.length - 1; j >= 0; j--) {
            if(b.position.distanceTo(gameState.enemies[j].position) < 14) {
                const e = gameState.enemies[j];
                e.userData.health -= b.userData.damage;
                e.position.add(b.userData.velocity.clone().normalize().multiplyScalar(2));
                if(e.userData.health <= 0) { gameState.scene.remove(e); gameState.enemies.splice(j, 1); gameState.score += 50; UI.updateScoreUI(); }
                hit = true; break;
            }
        }
        if(!hit && b.position.y < 0) hit = true;
        if(!hit) {
            for(let obs of gameState.obstacles) {
                 if(b.position.x > obs.position.x-10 && b.position.x < obs.position.x+10 && b.position.z > obs.position.z-10 && b.position.z < obs.position.z+10 && b.position.y < 30) { hit = true; break; }
            }
        }
        if(hit || b.userData.life-- <= 0) { gameState.scene.remove(b); gameState.bullets.splice(i,1); }
    }
}
