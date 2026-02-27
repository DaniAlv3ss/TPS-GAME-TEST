import * as THREE from 'three';
import { gameState, inputs } from './globals.js';
import * as UI from './ui.js';
import { playEnemyDownSound, playHitSound, playReloadSound, playShotSound } from './audio.js';
import { createExplosion } from './effects.js';
import { onEnemyKilled } from './enemy.js';

// Configurações Simplificadas (O offset Y é calculado automaticamente agora)
const WEAPON_DB = [
    { name: "MK-17 SCAR-H", type: "auto", damage: 1.2, fireRate: 110, ammo: 20, reloadTime: 1800, speed: 1600, spread: 0.02, recoil: 0.004, color: 0xc2b280, builder: "scar", sight: "holo", camZ: -1.0, attachments: { sight: 'HOLO', muzzle: 'COMPENSADOR', underbarrel: 'GRIP ANGULAR', mag: '20RD PMAG', stock: 'SCAR UGG' } },
    { name: "M4A1 SOPMOD", type: "auto", damage: 1.0, fireRate: 78, ammo: 30, reloadTime: 1500, speed: 1500, spread: 0.024, recoil: 0.003, color: 0x222222, builder: "ar15", sight: "acog", camZ: -1.5, attachments: { sight: 'ACOG 4X', muzzle: 'FREIO', underbarrel: 'BIPOD', mag: '30RD STANAG', stock: 'CTR' } },
    { name: "HK416 D10RS", type: "auto", damage: 1.05, fireRate: 76, ammo: 30, reloadTime: 1500, speed: 1520, spread: 0.023, recoil: 0.0033, color: 0x30353b, builder: "ar15", sight: "holo", camZ: -1.25, attachments: { sight: 'EOTECH', muzzle: 'SUPRESSOR', underbarrel: 'GRIP VERTICAL', mag: '30RD PMAG', stock: 'B5 SOPMOD' } },
    { name: "AK-47 CLASSIC", type: "auto", damage: 1.55, fireRate: 118, ammo: 30, reloadTime: 2000, speed: 1400, spread: 0.058, recoil: 0.007, color: 0x222222, woodColor: 0x8b4513, builder: "ak47", sight: "iron_ak", camZ: 1.5, attachments: { sight: 'IRON', muzzle: 'SEM', underbarrel: 'GRIP LEVE', mag: '30RD STEEL', stock: 'MADEIRA' } },
    { name: "AK-12 MODERN", type: "auto", damage: 1.35, fireRate: 98, ammo: 30, reloadTime: 1850, speed: 1450, spread: 0.042, recoil: 0.0058, color: 0x2a2e34, builder: "ak47", sight: "red_dot", camZ: 0.6, attachments: { sight: 'KOBRA', muzzle: 'COMPENSADOR', underbarrel: 'GRIP ANGULAR', mag: '30RD POLYMER', stock: 'TELESCÓPICA' } },
    { name: "G36C KSK", type: "auto", damage: 1.1, fireRate: 84, ammo: 30, reloadTime: 1550, speed: 1480, spread: 0.028, recoil: 0.0038, color: 0x242628, builder: "ar15", sight: "red_dot", camZ: -1.0, attachments: { sight: 'RED DOT', muzzle: 'FLASH HIDER', underbarrel: 'GRIP CURTO', mag: '30RD TRANSLUCENT', stock: 'FOLDING' } },
    { name: "FN FAL 50.00", type: "semi", damage: 2.4, fireRate: 280, ammo: 20, reloadTime: 2100, speed: 1760, spread: 0.016, recoil: 0.009, color: 0x2d2f31, builder: "scar", sight: "acog", camZ: -1.3, attachments: { sight: 'SUSAT 4X', muzzle: 'FREIO', underbarrel: 'BIPOD', mag: '20RD 7.62', stock: 'FIXA' } },
    { name: "M14 EBR", type: "semi", damage: 2.7, fireRate: 320, ammo: 20, reloadTime: 2200, speed: 1850, spread: 0.014, recoil: 0.0105, color: 0x3b3f42, builder: "scar", sight: "scope_sniper", camZ: -1.7, attachments: { sight: '6X DMR', muzzle: 'SUPRESSOR LONGO', underbarrel: 'BIPOD', mag: '20RD SR-25', stock: 'CHASSIS EBR' } },
    { name: "MP5 A3", type: "auto", damage: 0.72, fireRate: 65, ammo: 30, reloadTime: 1200, speed: 1100, spread: 0.05, recoil: 0.002, color: 0x1a1a1a, builder: "mp5", sight: "red_dot", camZ: -0.5, attachments: { sight: 'RED DOT', muzzle: 'SUPRESSOR', underbarrel: 'LASER', mag: '30RD CURVO', stock: 'A3 RETRÁTIL' } },
    { name: "MP7A2", type: "auto", damage: 0.68, fireRate: 42, ammo: 40, reloadTime: 1120, speed: 1320, spread: 0.032, recoil: 0.0018, color: 0x272d34, builder: "mp5", sight: "holo", camZ: -0.9, attachments: { sight: 'HOLO MINI', muzzle: 'SUPRESSOR', underbarrel: 'GRIP', mag: '40RD', stock: 'COLAPSÁVEL' } },
    { name: "UMP45", type: "auto", damage: 0.95, fireRate: 82, ammo: 25, reloadTime: 1450, speed: 1180, spread: 0.041, recoil: 0.0031, color: 0x2b2f33, builder: "mp5", sight: "red_dot", camZ: -0.8, attachments: { sight: 'RED DOT', muzzle: 'COMP', underbarrel: 'GRIP CURTO', mag: '25RD .45', stock: 'FIXA' } },
    { name: "VECTOR .45", type: "auto", damage: 0.62, fireRate: 35, ammo: 30, reloadTime: 1000, speed: 1200, spread: 0.03, recoil: 0.001, color: 0xeeeeee, builder: "vector", sight: "red_dot", camZ: -1.0, attachments: { sight: 'RED DOT', muzzle: 'COMP', underbarrel: 'GRIP CURTO', mag: '30RD EXT', stock: 'FOLDING' } },
    { name: "P90 TR", type: "auto", damage: 0.58, fireRate: 38, ammo: 50, reloadTime: 1700, speed: 1260, spread: 0.034, recoil: 0.0014, color: 0x303338, builder: "mp5", sight: "red_dot", camZ: -0.7, attachments: { sight: 'REFLEX', muzzle: 'SUPRESSOR', underbarrel: 'SEM', mag: '50RD TOP', stock: 'INTEGRADA' } },
    { name: "M249 PARA", type: "auto", damage: 1.1, fireRate: 90, ammo: 100, reloadTime: 4500, speed: 1400, spread: 0.07, recoil: 0.005, color: 0x333333, builder: "lmg", sight: "holo", camZ: -1.0, attachments: { sight: 'HOLO', muzzle: 'FREIO PESADO', underbarrel: 'BIPOD', mag: 'CAIXA 100RD', stock: 'PARA' } },
    { name: "PKP PECHENEG", type: "auto", damage: 1.45, fireRate: 98, ammo: 100, reloadTime: 4800, speed: 1500, spread: 0.074, recoil: 0.0062, color: 0x2b2b2b, builder: "lmg", sight: "acog", camZ: -1.2, attachments: { sight: 'PSO 4X', muzzle: 'FREIO LONGO', underbarrel: 'BIPOD', mag: 'CAIXA 100RD', stock: 'FIXA' } },
    { name: "M870 BREACHER", type: "shotgun", damage: 1.25, fireRate: 900, ammo: 7, reloadTime: 3500, speed: 800, spread: 0.12, recoil: 0.05, color: 0x333333, builder: "shotgun", sight: "iron_shotgun", camZ: 1.0, attachments: { sight: 'IRON', muzzle: 'CHOKE', underbarrel: 'SEM', mag: 'TUBULAR 7', stock: 'POLÍMERO' } },
    { name: "SPAS-12", type: "shotgun", damage: 1.42, fireRate: 820, ammo: 8, reloadTime: 3600, speed: 850, spread: 0.108, recoil: 0.058, color: 0x2d3134, builder: "shotgun", sight: "iron_shotgun", camZ: 0.9, attachments: { sight: 'RIB', muzzle: 'CHOKE TÁTICO', underbarrel: 'SEM', mag: 'TUBULAR 8', stock: 'FOLDING' } },
    { name: "GLOCK 18C", type: "auto", damage: 0.5, fireRate: 50, ammo: 19, reloadTime: 900, speed: 1000, spread: 0.08, recoil: 0.005, color: 0x444444, builder: "pistol", sight: "iron_pistol", camZ: 2.0, attachments: { sight: 'IRON', muzzle: 'COMPENSADOR MINI', underbarrel: 'LANTERNA', mag: '19RD', stock: 'N/A' } },
    { name: "SIG P320", type: "semi", damage: 0.86, fireRate: 190, ammo: 17, reloadTime: 940, speed: 1080, spread: 0.044, recoil: 0.0048, color: 0x3a3d41, builder: "pistol", sight: "red_dot", camZ: 1.8, attachments: { sight: 'RMR', muzzle: 'THREADED', underbarrel: 'LANTERNA', mag: '17RD', stock: 'N/A' } },
    { name: "AWP MAGNUM", type: "semi", damage: 15.0, fireRate: 1500, ammo: 5, reloadTime: 3000, speed: 3000, spread: 0.0, recoil: 0.08, color: 0x3d4c3d, builder: "awp", sight: "scope_sniper", camZ: -1.8, attachments: { sight: '8X SNIPER', muzzle: 'SUPRESSOR LONGO', underbarrel: 'BIPOD', mag: '5RD', stock: 'PRECISION' } },
    { name: "RAILGUN MK-II", type: "semi", damage: 25.0, fireRate: 1200, ammo: 3, reloadTime: 2500, speed: 5000, spread: 0.0, recoil: 0.03, color: 0x001133, builder: "railgun", sight: "scope_digital", camZ: -1.8, attachments: { sight: 'DIGITAL', muzzle: 'PLASMA', underbarrel: 'ESTABILIZADOR', mag: '3 CÉLULAS', stock: 'ELETROMAGNÉTICA' } }
];

let currentWeapon = WEAPON_DB[0];
let activeStats = WEAPON_DB[0];
let currentAmmo = currentWeapon.ammo;
let isReloading = false;
let lastShotTime = 0;
const raycaster = new THREE.Raycaster();

const MAT_BLACK_METAL = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7, metalness: 0.6 });
const MAT_DARK_GREY = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.3 });
const MAT_PLASTIC = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9, metalness: 0.1 });

// Helper para saber se usa Dual Render
export function isScopeWeapon() {
    return currentWeapon.sight.includes("scope");
}

export function initWeaponSystem() {
    switchWeapon(0);
}

export function getWeaponCount() {
    return WEAPON_DB.length;
}

export function cycleWeapon(direction = 1) {
    const next = (gameState.currentWeaponIdx + direction + WEAPON_DB.length) % WEAPON_DB.length;
    switchWeapon(next);
}

export function switchWeapon(index) {
    if (index < 0 || index >= WEAPON_DB.length) return;
    
    if (gameState.gunMesh && gameState.aimPivot) {
        gameState.aimPivot.remove(gameState.gunMesh);
        gameState.gunMesh = null;
    }
    
    gameState.currentWeaponIdx = index;
    currentWeapon = WEAPON_DB[index];
    activeStats = applyAttachmentModifiers(currentWeapon);
    currentAmmo = currentWeapon.ammo;
    isReloading = false;
    
    UI.updateWeaponInfo(currentWeapon.name, currentAmmo, currentWeapon.ammo);
    UI.updateAttachmentsUI(formatAttachmentText(currentWeapon.attachments));
    
    if (gameState.aimPivot) {
        createWeapon(gameState.aimPivot);
    }
}

export function createWeapon(parentGroup) {
    const gunMesh = new THREE.Group();
    gunMesh.position.set(7.2, 13.6, -7.4);
    gunMesh.userData.baseRotX = gunMesh.rotation.x;
    gunMesh.userData.baseRotY = gunMesh.rotation.y;
    parentGroup.add(gunMesh);
    gameState.gunMesh = gunMesh;

    // 1. Construir Corpo
    const builderFn = BUILDERS[currentWeapon.builder] || BUILDERS["ar15"];
    const components = builderFn(gunMesh, currentWeapon);
    gameState.gunBarrelTip = components.tip;

    // 2. Construir Mira e Obter Altura do Centro Óptico
    // railY é a altura onde a mira senta.
    const railY = components.topRailY || 4.0;
    const sightInfo = buildSight(gunMesh, currentWeapon.sight, railY);

    // 3. Posicionar CameraFPS Point EXATAMENTE atrás do centro óptico
    // A altura final é railY + sightCenterY
    const totalSightHeight = railY + sightInfo.centerY;
    
    const cameraFPSPoint = new THREE.Object3D();
    // Z ajustável para conforto visual (distância do olho à lente)
    cameraFPSPoint.position.set(0, totalSightHeight, currentWeapon.camZ); 
    gunMesh.add(cameraFPSPoint);
    gameState.cameraFPSPoint = cameraFPSPoint;
}

// --- FÁBRICA DE ARMAS ---
const BUILDERS = {
    "ar15": (group, config) => {
        const primary = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.46, metalness: 0.22 });
        const lower = new THREE.Mesh(new THREE.BoxGeometry(2.3, 3.1, 9.5), primary); lower.position.set(0, 1.1, -2.3); group.add(lower);
        const upper = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.9, 11), MAT_DARK_GREY); upper.position.set(0, 3.4, -2.6); group.add(upper);
        const handguard = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.6, 9), MAT_BLACK_METAL); handguard.position.set(0, 2.5, -11.5); group.add(handguard);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 12, 12), MAT_BLACK_METAL); barrel.rotateX(Math.PI/2); barrel.position.set(0, 2.4, -19.5); group.add(barrel);
        const flashHider = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.6, 12), MAT_BLACK_METAL); flashHider.rotateX(Math.PI/2); flashHider.position.set(0, 2.4, -26); group.add(flashHider);
        const stockTube = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 5.4), MAT_BLACK_METAL); stockTube.position.set(0, 2.6, 6.2); group.add(stockTube);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(2.6, 4.2, 3.4), MAT_PLASTIC); stock.position.set(0, 1.8, 9.6); group.add(stock);
        const grip = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5.2, 2), MAT_PLASTIC); grip.position.set(0, -1.4, -2.7); grip.rotation.x = 0.2; group.add(grip);
        const mag = new THREE.Mesh(new THREE.BoxGeometry(1.95, 6.8, 2.7), MAT_BLACK_METAL); mag.position.set(0, -2.5, -5.8); mag.rotation.x = 0.1; group.add(mag);
        const tip = new THREE.Object3D(); tip.position.set(0, 0, -22); group.add(tip);
        tip.position.set(0, 2.35, -26.8);
        return { tip: tip, topRailY: 4.5 };
    },
    "ak47": (group, config) => {
        const wood = new THREE.MeshStandardMaterial({ color: config.woodColor || 0x6a4429, roughness: 0.64 });
        const rec = new THREE.Mesh(new THREE.BoxGeometry(2.3, 3.5, 10), MAT_BLACK_METAL); rec.position.set(0, 2.3, -3.2); group.add(rec);
        const dustCover = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.5, 9.2), MAT_DARK_GREY); dustCover.position.set(0, 4.4, -3.2); group.add(dustCover);
        const handguard = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.3, 8), wood); handguard.position.set(0, 2.3, -11); group.add(handguard);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.45, 12, 10), MAT_BLACK_METAL); barrel.rotateX(Math.PI/2); barrel.position.set(0, 2.3, -18.8); group.add(barrel);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.8, 7.4), wood); stock.position.set(0, 1.4, 6.4); stock.rotateX(-0.1); group.add(stock);
        const grip = new THREE.Mesh(new THREE.BoxGeometry(1.7, 5.5, 2.1), wood); grip.position.set(0, -1.3, -1.8); grip.rotation.x = 0.22; group.add(grip);
        const mag = new THREE.Mesh(new THREE.BoxGeometry(2.1, 8.1, 3.2), MAT_BLACK_METAL); mag.position.set(0, -2.8, -6.2); mag.rotation.x = 0.45; group.add(mag);
        const tip = new THREE.Object3D(); tip.position.set(0, 2.3, -24.8); group.add(tip);
        return { tip: tip, topRailY: 4.7 };
    },
    "awp": (group, config) => {
        const bodyMat = new THREE.MeshStandardMaterial({color: config.color, roughness: 0.55, metalness: 0.15});
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(2.3, 3.4, 12), bodyMat); receiver.position.set(0, 2.7, -3.5); group.add(receiver);
        const forearm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 11), MAT_PLASTIC); forearm.position.set(0, 2.2, -12.2); group.add(forearm);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 20, 12), MAT_BLACK_METAL); barrel.rotateX(Math.PI/2); barrel.position.set(0, 2.4, -23); group.add(barrel);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(2.6, 5.2, 8), bodyMat); stock.position.set(0, 1.6, 7); group.add(stock);
        const cheek = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.2, 4), MAT_BLACK_METAL); cheek.position.set(0, 4.5, 5.5); group.add(cheek);
        const tip = new THREE.Object3D(); tip.position.set(0, 2.4, -33.2); group.add(tip);
        return { tip: tip, topRailY: 5.3 };
    },
    "mp5": (group, config) => {
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.1, 9), MAT_DARK_GREY); body.position.set(0, 2.1, -2.5); group.add(body);
        const handguard = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.4, 6), MAT_PLASTIC); handguard.position.set(0, 1.9, -8.8); group.add(handguard);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 8, 12), MAT_BLACK_METAL); barrel.rotateX(Math.PI/2); barrel.position.set(0, 1.8, -13); group.add(barrel);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(2.3, 3.6, 2.8), MAT_PLASTIC); stock.position.set(0, 1.5, 5.5); group.add(stock);
        const mag = new THREE.Mesh(new THREE.BoxGeometry(1.7, 5.3, 2), MAT_BLACK_METAL); mag.position.set(0, -1.6, -4.4); group.add(mag);
        const grip = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4.6, 2), MAT_PLASTIC); grip.position.set(0, -1.1, -1.4); grip.rotation.x = 0.18; group.add(grip);
        const tip = new THREE.Object3D(); tip.position.set(0, 1.8, -17.2); group.add(tip);
        return {tip, topRailY: 4.1};
    },
    "shotgun": (group, config) => {
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.2, 8), MAT_DARK_GREY); receiver.position.set(0, 2, -2); group.add(receiver);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 13, 12), MAT_BLACK_METAL); barrel.rotateX(Math.PI/2); barrel.position.set(0, 2.5, -12.6); group.add(barrel);
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 11.5, 10), MAT_BLACK_METAL); tube.rotateX(Math.PI/2); tube.position.set(0, 1.2, -11.9); group.add(tube);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(2.5, 4.1, 6.5), MAT_PLASTIC); stock.position.set(0, 1.3, 5.3); stock.rotation.x = -0.05; group.add(stock);
        const pump = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.3, 4.5), MAT_PLASTIC); pump.position.set(0, 1.4, -8.8); group.add(pump);
        const tip = new THREE.Object3D(); tip.position.set(0, 2.5, -19.5); group.add(tip);
        return {tip, topRailY: 3.6};
    },
    "pistol": (group, config) => {
        const slide = new THREE.Mesh(new THREE.BoxGeometry(2, 1.6, 7), new THREE.MeshStandardMaterial({color:config.color, roughness: 0.46, metalness: 0.26})); slide.position.set(0,3.1,-2); group.add(slide);
        const frame = new THREE.Mesh(new THREE.BoxGeometry(2, 2.2, 4.5), MAT_PLASTIC); frame.position.set(0,1.6,-2.3); group.add(frame);
        const grip = new THREE.Mesh(new THREE.BoxGeometry(1.8, 4.5, 2.3), MAT_PLASTIC); grip.position.set(0,-0.8,0.2); grip.rotation.x = 0.18; group.add(grip);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.8, 8), MAT_BLACK_METAL); barrel.rotateX(Math.PI/2); barrel.position.set(0, 3, -5.2); group.add(barrel);
        const tip = new THREE.Object3D(); tip.position.set(0,3,-6.5); group.add(tip); return {tip, topRailY: 4.0};
    },
    "scar": (group, config) => {
        BUILDERS.ar15(group, config);
        const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 8), MAT_BLACK_METAL);
        sideRail.position.set(1.5, 3.1, -11);
        group.add(sideRail);
        const tip = new THREE.Object3D(); tip.position.set(0, 2.35, -27.2); group.add(tip);
        return {tip, topRailY: 4.7};
    },
    "lmg": (g,c) => BUILDERS["ar15"](g,c), "vector": (g,c) => BUILDERS["mp5"](g,c), "railgun": (g,c) => BUILDERS["awp"](g,c)
};

// --- CONSTROI A MIRA ---
function buildSight(parent, type, yPos) {
    const s = new THREE.Group(); s.position.set(0, yPos, 0); parent.add(s);
    const metal = MAT_BLACK_METAL;
    let centerY = 0; // Altura do centro óptico relativa à base da mira

    if(type === "holo") {
        centerY = 1.5;
        s.add(new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.38, 2.6), metal));
        const frame = new THREE.Mesh(new THREE.BoxGeometry(2.25, 2.1, 2.1), metal); frame.position.y = 1.45; s.add(frame);
        const lens = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.6), createLensMaterial("circle"));
        lens.position.set(0, 1.45, 0.95); s.add(lens);
        const hoodL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.2, 2.1), metal); hoodL.position.set(-1.02,1.45,0); s.add(hoodL);
        const hoodR = hoodL.clone(); hoodR.position.x = 1.02; s.add(hoodR);
        const hoodT = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.2, 2.1), metal); hoodT.position.set(0,2.45,0); s.add(hoodT);

    } else if(type.includes("scope")) {
        centerY = 2.0;
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 9.5, 16), metal);
        tube.rotateX(Math.PI/2); tube.position.y = centerY; s.add(tube);

        let lensMat;
        if (gameState.scopeRenderTarget && gameState.scopeRenderTarget.texture) {
            lensMat = new THREE.MeshBasicMaterial({ map: gameState.scopeRenderTarget.texture });
        } else {
            lensMat = createLensMaterial("mil-dot");
        }

        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.88, 16), lensMat);
        lens.position.set(0, centerY, 4.45);
        s.add(lens);

        const crosshair = new THREE.Mesh(new THREE.CircleGeometry(0.88, 16), createLensMaterial("mil-dot"));
        crosshair.position.set(0, centerY, 4.5);
        s.add(crosshair);

        const eyeRelief = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 1.8, 12), metal);
        eyeRelief.rotateX(Math.PI/2);
        eyeRelief.position.set(0, centerY, 3.6);
        s.add(eyeRelief);

    } else if(type === "red_dot" || type === "acog") {
        centerY = 1.4;
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 3.6, 16), metal); tube.rotateX(Math.PI/2); tube.position.y=centerY; s.add(tube);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.6, 16), createLensMaterial(type === "acog" ? "chevron" : "dot"));
        lens.position.set(0, centerY, 1.55);
        s.add(lens);
    } else { // Iron
        centerY = 1.0;
        const frontPost = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.0, 0.24), metal); frontPost.position.set(0, 1.0, -6.5); s.add(frontPost);
        const rearBase = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.7), metal); rearBase.position.set(0, 0.95, 1.4); s.add(rearBase);
        const rearNotchL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.8, 0.55), metal); rearNotchL.position.set(-0.55, 1.25, 1.4); s.add(rearNotchL);
        const rearNotchR = rearNotchL.clone(); rearNotchR.position.x = 0.55; s.add(rearNotchR);
    }
    
    return { centerY: centerY };
}

function createLensMaterial(style) {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d'); const cx = 64, cy = 64;
    ctx.clearRect(0,0,128,128);
    
    if(style === "mil-dot") {
        // Crosshair preto fino para scope
        ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx,0); ctx.lineTo(cx,128); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,cy); ctx.lineTo(128,cy); ctx.stroke();
        return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true });
    }
    
    // Holograficos (Brilho)
    ctx.strokeStyle = '#ff0000'; ctx.fillStyle = '#ff0000'; ctx.shadowBlur = 5; ctx.shadowColor = "#ff0000"; ctx.lineWidth = 3;
    if(style === "circle") {
        ctx.beginPath(); ctx.arc(cx, cy, 35, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI*2); ctx.fill();
    } else if(style === "dot") {
        ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2); ctx.fill();
    } else if(style === "chevron") {
        ctx.beginPath(); ctx.moveTo(cx, cy-5); ctx.lineTo(cx-10, cy+10); ctx.lineTo(cx+10, cy+10); ctx.closePath(); ctx.stroke();
    }
    return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, side: THREE.DoubleSide });
}

// --- SHOOTING LOGIC (Mantida igual, apenas imports) ---
export function reload() {
    if (isReloading || currentAmmo === currentWeapon.ammo) return;
    isReloading = true; UI.showReloadMsg(true);
    playReloadSound();
    gameState.gunMesh.rotation.x += 0.8; 
    setTimeout(() => {
        currentAmmo = currentWeapon.ammo; UI.updateAmmoUI(currentAmmo, currentWeapon.ammo);
        isReloading = false; UI.showReloadMsg(false); gameState.gunMesh.rotation.x -= 0.8;
    }, currentWeapon.reloadTime);
}

export function tryShoot(time) {
    if (inputs.isLeftMouseDown && time - lastShotTime > currentWeapon.fireRate) {
        if(currentWeapon.type === "semi" && !inputs.isNewClick) return; 
        shoot(time); inputs.isNewClick = false; 
    }
}

function shoot(time) {
    if (currentAmmo <= 0) { UI.showNoAmmoMsg(); return; }
    if (isReloading) return;
    lastShotTime = time; currentAmmo--; UI.updateAmmoUI(currentAmmo, currentWeapon.ammo);
    playShotSound(activeStats);
    UI.pulseCrosshair();

    const flash = new THREE.PointLight(0xffffaa, 3, 20);
    gameState.gunBarrelTip.getWorldPosition(flash.position);
    gameState.scene.add(flash);
    setTimeout(() => gameState.scene.remove(flash), 50);
    createSmoke(flash.position);

    const pc = currentWeapon.type === "shotgun" ? 8 : 1;
    for(let i=0; i<pc; i++) createBullet();

    if(inputs.aimMode !== 2) gameState.camera.rotation.x += activeStats.recoil;
    gameState.gunMesh.position.z += 0.5;
    setTimeout(() => gameState.gunMesh.position.z -= 0.5, 50);
}

function createSmoke(pos) {
    const geo = new THREE.BoxGeometry(0.3,0.3,0.3);
    const mat = new THREE.MeshBasicMaterial({color:0xdddddd, transparent:true, opacity:0.45});
    for(let i=0; i<1; i++) {
        const p = new THREE.Mesh(geo, mat); p.position.copy(pos);
        p.userData = {vel: new THREE.Vector3((Math.random()-.5)*1.4, Math.random()*1.6, (Math.random()-.5)*1.4), life: 12};
        gameState.particles.push(p); gameState.scene.add(p);
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
    let spread = activeStats.spread; if(inputs.aimMode !== 0) spread *= 0.2;
    if(currentWeapon.type === "shotgun") spread = activeStats.spread;
    dir.x += (Math.random()-0.5)*spread; dir.y += (Math.random()-0.5)*spread; dir.z += (Math.random()-0.5)*spread; dir.normalize();

    bullet.userData = { velocity: dir.multiplyScalar(activeStats.speed), life: 100, damage: activeStats.damage };
    gameState.bullets.push(bullet); gameState.scene.add(bullet);
}

export function updateBullets(delta) {
    for(let i=gameState.particles.length-1; i>=0; i--) {
        const p = gameState.particles[i]; p.position.add(p.userData.vel.clone().multiplyScalar(delta));
        p.material.opacity -= delta*3; if(p.material.opacity<=0) { gameState.scene.remove(p); gameState.particles.splice(i,1); }
    }

    for (let i = gameState.decals.length - 1; i >= 0; i--) {
        const decal = gameState.decals[i];
        decal.userData.life -= delta;
        decal.material.opacity = Math.max(0, decal.userData.life / decal.userData.maxLife);
        if (decal.userData.life <= 0) {
            gameState.scene.remove(decal);
            gameState.decals.splice(i, 1);
        }
    }

    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const b = gameState.bullets[i];
        b.position.add(b.userData.velocity.clone().multiplyScalar(delta));
        let hit = false;
        for(let j = gameState.enemies.length - 1; j >= 0; j--) {
            if(b.position.distanceTo(gameState.enemies[j].position) < (gameState.enemies[j].userData?.isBoss ? 18 : 14)) {
                const e = gameState.enemies[j];
                const finalDamage = calculateDamageAgainstEnemy(e, b.position, b.userData.damage);
                e.userData.health -= finalDamage;
                e.position.add(b.userData.velocity.clone().normalize().multiplyScalar(2));
                if (!e.userData?.isBoss) {
                    e.userData.hitReact = 0.18;
                    e.userData.hitReactKick = b.userData.velocity.clone().normalize().multiplyScalar(0.35);
                }
                playHitSound();
                UI.flashHitMarker();
                createImpactSparks(b.position, 0xff6644, 4);
                if (e.userData?.isBoss) {
                    UI.updateBossHud({
                        name: e.userData.name,
                        health: e.userData.health,
                        maxHealth: e.userData.maxHealth,
                        phase: e.userData.phase || 1,
                        weakspot: e.userData.weakspotHint,
                        lastHit: e.userData.lastWeakspotHit
                    });
                }
                if(e.userData.health <= 0) {
                    gameState.scene.remove(e);
                    gameState.enemies.splice(j, 1);
                    if (!e.userData?.isBoss) gameState.score += 50;
                    onEnemyKilled(e);
                    playEnemyDownSound();
                    UI.updateScoreUI();
                }
                hit = true; break;
            }
        }
        if(!hit && b.position.y < 0) {
            hit = true;
            const point = new THREE.Vector3(b.position.x, 0.05, b.position.z);
            createSurfaceImpact(point, new THREE.Vector3(0, 1, 0), 0x1c2128);
            if (currentWeapon.builder === 'railgun') {
                createExplosion(point.clone(), { radius: 54, life: 0.55, damage: 2.5, color: 0x66ccff });
            }
        }
        if(!hit) {
            for(let obs of gameState.obstacles) {
                 if(b.position.x > obs.position.x-10 && b.position.x < obs.position.x+10 && b.position.z > obs.position.z-10 && b.position.z < obs.position.z+10 && b.position.y < 30) {
                    hit = true;
                    const normal = new THREE.Vector3().subVectors(b.position, obs.position).normalize();
                    createSurfaceImpact(b.position.clone(), normal, 0x2c3138);
                    if (currentWeapon.builder === 'railgun') {
                        createExplosion(b.position.clone(), { radius: 52, life: 0.5, damage: 2.2, color: 0x66ccff });
                    }
                    break;
                }
            }
        }
        if(hit || b.userData.life-- <= 0) { gameState.scene.remove(b); gameState.bullets.splice(i,1); }
    }
}

function createSurfaceImpact(position, normal, color) {
    createImpactSparks(position, 0xffd8aa, 3);

    const decal = new THREE.Mesh(
        new THREE.CircleGeometry(1 + Math.random() * 1.6, 12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    decal.position.copy(position);
    decal.position.add(normal.clone().multiplyScalar(0.06));
    decal.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().normalize());
    decal.rotation.z = Math.random() * Math.PI * 2;
    decal.userData = { life: 9 + Math.random() * 5, maxLife: 14 };
    gameState.decals.push(decal);
    gameState.scene.add(decal);

    if (gameState.decals.length > 120) {
        const old = gameState.decals.shift();
        gameState.scene.remove(old);
    }
}

function createImpactSparks(position, color, count) {
    for (let i = 0; i < count; i++) {
        const spark = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.15, 0.15),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
        );
        spark.position.copy(position);
        spark.userData = {
            vel: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 5, (Math.random() - 0.5) * 8),
            life: 12
        };
        gameState.particles.push(spark);
        gameState.scene.add(spark);

        if (gameState.particles.length > 180) {
            const old = gameState.particles.shift();
            gameState.scene.remove(old);
        }
    }
}

function applyAttachmentModifiers(weapon) {
    const modified = { ...weapon };
    if (!weapon.attachments) return modified;
    const sight = (weapon.attachments.sight || '').toLowerCase();
    const muzzle = (weapon.attachments.muzzle || '').toLowerCase();
    const underbarrel = (weapon.attachments.underbarrel || '').toLowerCase();
    const mag = (weapon.attachments.mag || '').toLowerCase();
    const stock = (weapon.attachments.stock || '').toLowerCase();

    if (muzzle.includes('comp') || muzzle.includes('freio')) {
        modified.recoil *= 0.88;
    }
    if (muzzle.includes('supp')) {
        modified.speed *= 0.95;
        modified.spread *= 0.9;
    }
    if (underbarrel.includes('grip')) {
        modified.spread *= 0.85;
        modified.recoil *= 0.9;
    }
    if (underbarrel.includes('bipod')) {
        modified.spread *= 0.8;
    }
    if (sight.includes('4x') || sight.includes('6x') || sight.includes('8x') || sight.includes('sniper')) {
        modified.spread *= 0.78;
    }
    if (mag.includes('ext') || mag.includes('100rd') || mag.includes('caixa')) {
        modified.reloadTime *= 1.08;
    }
    if (stock.includes('precision') || stock.includes('sopmod') || stock.includes('ctr')) {
        modified.recoil *= 0.92;
    }
    return modified;
}

function formatAttachmentText(attachments = {}) {
    return `MIRA: ${attachments.sight || 'PADRÃO'} • BOCA: ${attachments.muzzle || 'PADRÃO'} • ACESSÓRIO: ${attachments.underbarrel || 'PADRÃO'} • MAG: ${attachments.mag || 'PADRÃO'} • CORONHA: ${attachments.stock || 'PADRÃO'}`;
}

function calculateDamageAgainstEnemy(enemy, impactPos, baseDamage) {
    if (!enemy.userData?.isBoss || !enemy.userData?.weakSpots?.length) return baseDamage;

    const phase = enemy.userData.phase || 1;
    const weakHit = getWeakspotHit(enemy, impactPos, phase);

    if (weakHit) {
        createImpactSparks(impactPos, 0x66d4ff, 8);
        enemy.userData.lastWeakspotHit = weakHit.name;
        return baseDamage * weakHit.multiplier;
    }

    const armorFactor = phase === 1 ? 0.5 : (phase === 2 ? 0.62 : 0.72);
    enemy.userData.lastWeakspotHit = 'BLINDADO';
    return baseDamage * armorFactor;
}

function getWeakspotHit(enemy, impactPos, phase) {
    let bestHit = null;
    let bestDistance = Infinity;

    for (const weakSpot of enemy.userData.weakSpots) {
        if (phase < (weakSpot.phaseMin || 1)) continue;
        const worldPos = new THREE.Vector3();
        weakSpot.node.getWorldPosition(worldPos);
        const dist = impactPos.distanceTo(worldPos);
        if (dist <= weakSpot.radius && dist < bestDistance) {
            bestDistance = dist;
            bestHit = weakSpot;
        }
    }
    return bestHit;
}
