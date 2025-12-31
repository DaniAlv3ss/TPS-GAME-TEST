import * as THREE from 'three';
import { gameState, inputs, CONSTANTS } from './globals.js';
import * as UI from './ui.js';

// =============================================================================
// BANCO DE DADOS DE ARMAS (STATS & CONFIGURAÇÃO VISUAL)
// =============================================================================
const WEAPON_DB = [
    {
        name: "MK-17 SCAR-H",
        type: "auto", damage: 1.2, fireRate: 110, ammo: 20, reloadTime: 1800, speed: 1600, spread: 0.02, recoil: 0.004,
        color: 0xc2b280, // Tan
        builder: "scar", sight: "holo", camOffset: { y: 5.2, z: -2.0 }
    },
    {
        name: "MP5 A3",
        type: "auto", damage: 0.7, fireRate: 65, ammo: 30, reloadTime: 1200, speed: 1100, spread: 0.05, recoil: 0.002,
        color: 0x1a1a1a, // Black
        builder: "mp5", sight: "red_dot", camOffset: { y: 4.8, z: -1.0 }
    },
    {
        name: "M4A1 SOPMOD",
        type: "auto", damage: 1.0, fireRate: 80, ammo: 30, reloadTime: 1500, speed: 1500, spread: 0.025, recoil: 0.003,
        color: 0x222222, // Black
        builder: "ar15", sight: "acog", camOffset: { y: 5.5, z: -3.0 }
    },
    {
        name: "AK-47 CLASSIC",
        type: "auto", damage: 1.6, fireRate: 120, ammo: 30, reloadTime: 2000, speed: 1400, spread: 0.06, recoil: 0.007,
        color: 0x222222, // Metal
        woodColor: 0x8b4513, // Madeira
        builder: "ak47", sight: "iron_ak", camOffset: { y: 3.2, z: 1.5 }
    },
    {
        name: "AWP MAGNUM",
        type: "semi", damage: 15.0, fireRate: 1500, ammo: 5, reloadTime: 3000, speed: 3000, spread: 0.0, recoil: 0.08,
        color: 0x3d4c3d, // Olive Green
        builder: "awp", sight: "scope_sniper", camOffset: { y: 6.0, z: -2.5 }
    },
    {
        name: "M870 BREACHER",
        type: "shotgun", damage: 1.2, fireRate: 900, ammo: 7, reloadTime: 3500, speed: 800, spread: 0.12, recoil: 0.05,
        color: 0x333333,
        builder: "shotgun", sight: "iron_shotgun", camOffset: { y: 3.5, z: 1.0 }
    },
    {
        name: "GLOCK 18C",
        type: "auto", damage: 0.5, fireRate: 50, ammo: 19, reloadTime: 900, speed: 1000, spread: 0.08, recoil: 0.005,
        color: 0x444444, // Slide cinza
        builder: "pistol", sight: "iron_pistol", camOffset: { y: 3.0, z: 2.0 }
    },
    {
        name: "M249 PARA",
        type: "auto", damage: 1.1, fireRate: 90, ammo: 100, reloadTime: 4500, speed: 1400, spread: 0.07, recoil: 0.005,
        color: 0x333333,
        builder: "lmg", sight: "holo", camOffset: { y: 5.5, z: -1.0 }
    },
    {
        name: "VECTOR .45",
        type: "auto", damage: 0.6, fireRate: 35, ammo: 30, reloadTime: 1000, speed: 1200, spread: 0.03, recoil: 0.001,
        color: 0xeeeeee, // White
        builder: "vector", sight: "red_dot", camOffset: { y: 5.0, z: -1.0 }
    },
    {
        name: "RAILGUN MK-II",
        type: "semi", damage: 25.0, fireRate: 1200, ammo: 3, reloadTime: 2500, speed: 5000, spread: 0.0, recoil: 0.03,
        color: 0x001133, // Dark Blue
        builder: "railgun", sight: "scope_digital", camOffset: { y: 5.5, z: -2.0 }
    }
];

// Estado Local
let currentWeapon = WEAPON_DB[0];
let currentAmmo = currentWeapon.ammo;
let isReloading = false;
let lastShotTime = 0;
const raycaster = new THREE.Raycaster();

// Materiais Compartilhados (Para performance)
const MAT_BLACK_METAL = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7, metalness: 0.6 });
const MAT_DARK_GREY = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.3 });
const MAT_SHINY_METAL = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.9 });
const MAT_PLASTIC = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9, metalness: 0.1 });

// =============================================================================
// SISTEMA DE CONTROLE
// =============================================================================

export function initWeaponSystem() {
    switchWeapon(0);
}

export function switchWeapon(index) {
    if (index < 0 || index >= WEAPON_DB.length) return;
    if (gameState.currentWeaponIdx === index && gameState.gunMesh) return;
    
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
    // Posição padrão na mão direita
    gunMesh.position.set(8, 14, -8); 
    parentGroup.add(gunMesh);
    gameState.gunMesh = gunMesh;

    // Construtor específico baseado no tipo
    const builderFn = BUILDERS[currentWeapon.builder] || BUILDERS["ar15"];
    const components = builderFn(gunMesh, currentWeapon);

    // Salvar referências importantes
    gameState.gunBarrelTip = components.tip;
    
    // Construir Mira
    buildSight(gunMesh, currentWeapon.sight, components.topRailY || 4.0);

    // Câmera FPS Point (Ajustado pela config da arma)
    const cameraFPSPoint = new THREE.Object3D();
    cameraFPSPoint.position.set(0, currentWeapon.camOffset.y, currentWeapon.camOffset.z); 
    gunMesh.add(cameraFPSPoint);
    gameState.cameraFPSPoint = cameraFPSPoint;
}

// =============================================================================
// FÁBRICA DE ARMAS (BUILDERS)
// =============================================================================

const BUILDERS = {
    // -------------------------------------------------------------------------
    // AR-15 / M4 PLATFORM
    // -------------------------------------------------------------------------
    "ar15": (group, config) => {
        const primaryColor = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.5, metalness: 0.3 });
        
        // Lower Receiver
        const lower = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.5, 9), primaryColor);
        lower.position.z = -2;
        group.add(lower);
        
        // Upper Receiver (Com trilho)
        const upper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.5, 9), MAT_DARK_GREY);
        upper.position.set(0, 3.0, -2);
        group.add(upper);
        
        // Magwell
        const magwell = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4, 3.5), primaryColor);
        magwell.position.set(0, -1, -5.5);
        magwell.rotation.x = 0.1;
        group.add(magwell);
        
        // Magazine (STANAG)
        const mag = new THREE.Mesh(new THREE.BoxGeometry(2.1, 7, 4.5), MAT_BLACK_METAL);
        mag.position.set(0, -6, -5);
        mag.rotation.x = 0.15;
        group.add(mag);
        
        // Grip
        const grip = new THREE.Mesh(new THREE.BoxGeometry(1.8, 5, 2.5), MAT_PLASTIC);
        grip.position.set(0, -3.5, 0.5);
        grip.rotation.x = 0.3;
        group.add(grip);
        
        // Handguard (Quad Rail)
        const handguard = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.5, 10), primaryColor);
        handguard.position.z = -12;
        group.add(handguard);
        
        // Barrel
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 12), MAT_BLACK_METAL);
        barrel.rotation.x = Math.PI/2;
        barrel.position.z = -18;
        group.add(barrel);
        
        // Flash Hider
        const flash = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2, 6), MAT_BLACK_METAL);
        flash.rotation.x = Math.PI/2;
        flash.position.z = -21;
        group.add(flash);
        
        // Stock (Coronha Tática)
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 8, 8), MAT_BLACK_METAL);
        tube.rotation.x = Math.PI/2;
        tube.position.z = 4;
        group.add(tube);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(2.5, 6, 2), MAT_PLASTIC);
        stock.position.set(0, -1.5, 8);
        group.add(stock);

        const tip = new THREE.Object3D();
        tip.position.set(0, 0, -22);
        group.add(tip);

        return { tip: tip, topRailY: 4.2 };
    },

    // -------------------------------------------------------------------------
    // AK PLATFORM
    // -------------------------------------------------------------------------
    "ak47": (group, config) => {
        const metal = MAT_BLACK_METAL;
        const wood = new THREE.MeshStandardMaterial({ color: config.woodColor || 0x8b4513, roughness: 0.6 });
        
        // Receiver
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4, 12), metal);
        receiver.position.z = -3;
        group.add(receiver);
        
        // Dust Cover (Curvo)
        const cover = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 12, 12, 1, false, 0, Math.PI), metal);
        cover.rotation.y = Math.PI/2;
        cover.rotation.z = Math.PI/2;
        cover.position.set(0, 2.0, -3);
        group.add(cover);
        
        // Handguard (Madeira)
        const hgLower = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.5, 6), wood);
        hgLower.position.set(0, -0.5, -12);
        group.add(hgLower);
        const hgUpper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 5), wood);
        hgUpper.position.set(0, 1.5, -11.5);
        group.add(hgUpper);
        
        // Barrel
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 14, 8), metal);
        barrel.rotation.x = Math.PI/2;
        barrel.position.z = -14;
        group.add(barrel);
        
        // Gas Tube
        const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 6, 8), metal);
        gasTube.rotation.x = Math.PI/2;
        gasTube.position.set(0, 2.5, -10);
        group.add(gasTube);
        
        // Magazine (Banana)
        const mag = new THREE.Mesh(new THREE.BoxGeometry(2.4, 10, 4.5), MAT_PLASTIC); // Alumínio waffle ou metal
        mag.position.set(0, -6, -6);
        mag.rotation.x = 0.4; // Curva característica
        group.add(mag);
        
        // Grip
        const grip = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4.5, 2.5), wood);
        grip.position.set(0, -3.5, 0);
        grip.rotation.x = 0.2;
        group.add(grip);
        
        // Stock
        const stock = new THREE.Mesh(new THREE.BoxGeometry(2.2, 5, 8), wood);
        stock.position.set(0, -1, 6);
        stock.rotation.x = -0.1;
        group.add(stock);

        const tip = new THREE.Object3D();
        tip.position.set(0, 0, -21);
        group.add(tip);

        return { tip: tip, topRailY: 2.5 }; // AK rail é baixo ou lateral, mas aqui assumimos topo
    },

    // -------------------------------------------------------------------------
    // SCAR-H
    // -------------------------------------------------------------------------
    "scar": (group, config) => {
        const bodyMat = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.6 });
        const upperMat = new THREE.MeshStandardMaterial({ color: 0xa89f91, roughness: 0.4 }); // Upper levemente diferente
        
        // Upper Monolithic
        const upper = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4, 18), upperMat);
        upper.position.set(0, 2, -6);
        group.add(upper);
        
        // Lower Polymer
        const lower = new THREE.Mesh(new THREE.BoxGeometry(2.3, 3, 8), bodyMat);
        lower.position.set(0, -1.5, -2);
        group.add(lower);
        
        // Mag (7.62 Straight)
        const mag = new THREE.Mesh(new THREE.BoxGeometry(2.4, 6, 4), MAT_BLACK_METAL);
        mag.position.set(0, -5, -4);
        group.add(mag);
        
        // Boot Stock (Ugg Boot)
        const stock = new THREE.Mesh(new THREE.BoxGeometry(2.6, 7, 6), bodyMat);
        stock.position.set(0, 0, 6);
        group.add(stock);
        
        // Grip
        const grip = new THREE.Mesh(new THREE.BoxGeometry(1.8, 5, 2.5), bodyMat);
        grip.position.set(0, -3.5, 0);
        grip.rotation.x = 0.2;
        group.add(grip);

        // Barrel
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 6, 12), MAT_BLACK_METAL);
        barrel.rotation.x = Math.PI/2;
        barrel.position.z = -18;
        group.add(barrel);

        const tip = new THREE.Object3D();
        tip.position.set(0, 0, -21);
        group.add(tip);

        return { tip: tip, topRailY: 4.0 };
    },

    // -------------------------------------------------------------------------
    // SNIPER AWP
    // -------------------------------------------------------------------------
    "awp": (group, config) => {
        const bodyMat = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.7 });
        
        // Body (Chassis)
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 4, 18), bodyMat);
        body.position.z = -4;
        group.add(body);
        
        // Barrel (Fluted Heavy)
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 20, 8), MAT_BLACK_METAL);
        barrel.rotation.x = Math.PI/2;
        barrel.position.z = -20;
        group.add(barrel);
        
        // Muzzle Brake
        const brake = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 3), MAT_BLACK_METAL);
        brake.position.z = -30;
        group.add(brake);
        
        // Bolt Handle
        const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.8), MAT_SHINY_METAL);
        bolt.position.set(1.5, 2, 0);
        group.add(bolt);
        
        // Thumbhole Stock
        const stockGroup = new THREE.Group();
        stockGroup.position.z = 8;
        group.add(stockGroup);
        const butt = new THREE.Mesh(new THREE.BoxGeometry(2.5, 6, 4), bodyMat);
        stockGroup.add(butt);
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2, 6), bodyMat);
        bridge.position.set(0, 2, -4);
        stockGroup.add(bridge);
        
        // Grip integrado
        const grip = new THREE.Mesh(new THREE.BoxGeometry(2, 5, 3), bodyMat);
        grip.position.set(0, -2, -4);
        grip.rotation.x = 0.3;
        stockGroup.add(grip);

        const tip = new THREE.Object3D();
        tip.position.set(0, 0, -32);
        group.add(tip);

        return { tip: tip, topRailY: 3.5 };
    },

    // -------------------------------------------------------------------------
    // MP5
    // -------------------------------------------------------------------------
    "mp5": (group, config) => {
        const metal = MAT_DARK_GREY;
        const poly = MAT_PLASTIC;
        
        // Upper Receiver (Tube)
        const upper = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 10, 12), metal);
        upper.rotation.x = Math.PI/2;
        upper.position.set(0, 2, -2);
        group.add(upper);
        
        // Lower
        const lower = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 6), poly);
        lower.position.set(0, 0, -2);
        group.add(lower);
        
        // Mag (Thin curved)
        const mag = new THREE.Mesh(new THREE.BoxGeometry(1.8, 8, 2.5), metal);
        mag.position.set(0, -4, -3);
        mag.rotation.x = 0.1;
        group.add(mag);
        
        // Handguard (Tapered)
        const hg = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 6, 8), poly);
        hg.rotation.x = Math.PI/2;
        hg.position.set(0, 1.5, -9);
        group.add(hg);
        
        // Stock (Retractable)
        const stockArms = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 8), metal);
        stockArms.position.set(0, 1.5, 5);
        group.add(stockArms);
        const butt = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4, 1), poly);
        butt.position.set(0, 0, 9);
        group.add(butt);

        const tip = new THREE.Object3D();
        tip.position.set(0, 1.5, -14);
        group.add(tip);

        return { tip: tip, topRailY: 3.2 };
    },

    // -------------------------------------------------------------------------
    // SHOTGUN
    // -------------------------------------------------------------------------
    "shotgun": (group, config) => {
        const metal = MAT_DARK_GREY;
        const poly = new THREE.MeshStandardMaterial({color: 0x111111});
        
        // Receiver
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.5, 8), metal);
        receiver.position.z = -2;
        group.add(receiver);
        
        // Barrel
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 18, 12), metal);
        barrel.rotation.x = Math.PI/2;
        barrel.position.set(0, 1, -12);
        group.add(barrel);
        
        // Tube Mag (Under barrel)
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 16, 12), metal);
        tube.rotation.x = Math.PI/2;
        tube.position.set(0, -0.6, -11);
        group.add(tube);
        
        // Pump
        const pump = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 6, 8), poly);
        pump.rotation.x = Math.PI/2;
        pump.position.set(0, -0.6, -12);
        group.add(pump);
        
        // Stock
        const stock = new THREE.Mesh(new THREE.BoxGeometry(2.5, 5, 8), poly);
        stock.position.set(0, -1, 5);
        group.add(stock);

        const tip = new THREE.Object3D();
        tip.position.set(0, 1, -21);
        group.add(tip);

        return { tip: tip, topRailY: 1.8 };
    },

    // -------------------------------------------------------------------------
    // GENERIC PISTOL
    // -------------------------------------------------------------------------
    "pistol": (group, config) => {
        const slideColor = new THREE.MeshStandardMaterial({color: config.color, roughness: 0.3, metalness: 0.5});
        
        // Slide
        const slide = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 7), slideColor);
        slide.position.set(0, 2, -2);
        group.add(slide);
        
        // Frame
        const frame = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 6), MAT_PLASTIC);
        frame.position.set(0, 0.5, -2);
        group.add(frame);
        
        // Grip
        const grip = new THREE.Mesh(new THREE.BoxGeometry(1.8, 4, 2.5), MAT_PLASTIC);
        grip.position.set(0, -1.5, 0);
        grip.rotation.x = 0.1;
        group.add(grip);
        
        // Mag ext
        const mag = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1, 2.3), MAT_BLACK_METAL);
        mag.position.set(0, -3.5, 0.2);
        group.add(mag);

        const tip = new THREE.Object3D();
        tip.position.set(0, 2, -6);
        group.add(tip);

        return { tip: tip, topRailY: 3.0 };
    },
    
    // -------------------------------------------------------------------------
    // RAILGUN / SCI-FI
    // -------------------------------------------------------------------------
    "railgun": (group, config) => {
        const mat = new THREE.MeshStandardMaterial({color: config.color, metalness: 0.8, roughness: 0.2});
        
        // Rails
        const railL = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 20), mat);
        railL.position.set(-1.5, 0, -10);
        group.add(railL);
        const railR = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 20), mat);
        railR.position.set(1.5, 0, -10);
        group.add(railR);
        
        // Core (Glow)
        const coreGeo = new THREE.CylinderGeometry(0.5, 0.5, 18, 8);
        coreGeo.rotateX(Math.PI/2);
        const coreMat = new THREE.MeshBasicMaterial({color: 0x00ffff});
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.set(0, 0, -10);
        group.add(core);
        
        // Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 10), MAT_DARK_GREY);
        body.position.z = 2;
        group.add(body);
        
        const tip = new THREE.Object3D();
        tip.position.set(0, 0, -22);
        group.add(tip);
        
        return { tip: tip, topRailY: 3.5 };
    },
    
    // Fallback LMG e Vector usam AR15 modificado ou MP5 por enquanto
    "lmg": (group, config) => BUILDERS["ar15"](group, config), 
    "vector": (group, config) => BUILDERS["mp5"](group, config)
};

// =============================================================================
// SISTEMA DE MIRAS DETALHADAS
// =============================================================================

function buildSight(parent, type, yPos) {
    const sightGroup = new THREE.Group();
    sightGroup.position.set(0, yPos, 0); 
    parent.add(sightGroup);

    const metal = MAT_BLACK_METAL;

    if (type === "holo") {
        // EOTECH STYLE
        // Base
        sightGroup.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.4, 5), metal));
        // Hood (Proteção)
        const hoodGeo = new THREE.BoxGeometry(2.6, 3.0, 4);
        // Lateral E
        const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 4), metal); sideL.position.set(-1.2, 1.5, 0); sightGroup.add(sideL);
        // Lateral D
        const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 4), metal); sideR.position.set(1.2, 1.5, 0); sightGroup.add(sideR);
        // Teto
        const top = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 3), metal); top.position.set(0, 2.8, 0.5); sightGroup.add(top);
        
        // Vidro
        const lens = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), createLensMaterial("circle"));
        lens.position.set(0, 1.5, -0.5);
        sightGroup.add(lens);

    } else if (type === "red_dot") {
        // AIMPOINT STYLE
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 4, 16), metal);
        tube.rotation.x = Math.PI / 2;
        tube.position.y = 1.4;
        sightGroup.add(tube);
        
        const mount = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 2), metal);
        mount.position.y = 0.5;
        sightGroup.add(mount);
        
        const lens = new THREE.Mesh(new THREE.CircleGeometry(1.0, 16), createLensMaterial("dot"));
        lens.position.set(0, 1.4, -1.9);
        sightGroup.add(lens);

    } else if (type === "acog") {
        // ACOG STYLE
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 6, 8), metal);
        body.rotation.x = Math.PI / 2;
        body.position.y = 1.8;
        sightGroup.add(body);
        
        const lens = new THREE.Mesh(new THREE.CircleGeometry(1.2, 16), createLensMaterial("chevron"));
        lens.position.set(0, 1.8, -2.9);
        sightGroup.add(lens);

    } else if (type.includes("scope")) {
        // SNIPER SCOPE
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 12, 16), metal);
        tube.rotation.x = Math.PI / 2;
        tube.position.y = 2.0;
        sightGroup.add(tube);
        
        // Torres
        const turrets = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 2), metal);
        turrets.position.y = 2.0;
        sightGroup.add(turrets);
        
        const lens = new THREE.Mesh(new THREE.CircleGeometry(1.5, 16), createLensMaterial("mil-dot"));
        lens.position.set(0, 2.0, -5.9);
        sightGroup.add(lens);

    } else if (type.includes("iron")) {
        // IRON SIGHTS (AK/PISTOL)
        // Rear
        const rear = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 0.5), metal);
        rear.position.set(0, 0.8, 2);
        // Notch
        const notch = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.6), new THREE.MeshBasicMaterial({color:0x000000})); // fake hole
        notch.position.set(0, 1.2, 2);
        sightGroup.add(rear); 
        
        // Front
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.5, 0.3), metal);
        post.position.set(0, 0.8, -10);
        sightGroup.add(post);
    }
}

// Criador de Texturas de Retículo via Canvas
function createLensMaterial(style) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const cx = 64; const cy = 64;

    ctx.clearRect(0,0,128,128);
    
    // Cor
    ctx.strokeStyle = '#ff0000'; 
    ctx.fillStyle = '#ff0000';
    ctx.shadowBlur = 4; 
    ctx.shadowColor = "#ff0000";
    ctx.lineWidth = 2;

    if (style === "circle") {
        // Eotech Ring
        ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI*2); ctx.fill();
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, cy-40); ctx.lineTo(cx, cy-50); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy+40); ctx.lineTo(cx, cy+50); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx-40, cy); ctx.lineTo(cx-50, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+40, cy); ctx.lineTo(cx+50, cy); ctx.stroke();
    } 
    else if (style === "dot") {
        // Red Dot simples
        ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI*2); ctx.fill();
    }
    else if (style === "chevron") {
        // ACOG Triangle
        ctx.beginPath();
        ctx.moveTo(cx, cy-5);
        ctx.lineTo(cx-8, cy+10);
        ctx.lineTo(cx+8, cy+10);
        ctx.closePath();
        ctx.stroke();
    }
    else if (style === "mil-dot") {
        // Sniper Crosshair
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000'; // Preto para scope
        ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, 128); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(128, cy); ctx.stroke();
        // Dots
        ctx.fillStyle = '#000000';
        for(let i=10; i<120; i+=15) {
            if(i===64) continue;
            ctx.beginPath(); ctx.arc(cx, i, 1.5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(i, cy, 1.5, 0, Math.PI*2); ctx.fill();
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    return new THREE.MeshBasicMaterial({ 
        map: tex, 
        transparent: true, 
        side: THREE.DoubleSide,
        depthTest: false,
        opacity: 0.9
    });
}

// =============================================================================
// LÓGICA DE DISPARO (BALÍSTICA)
// =============================================================================

export function reload() {
    if (isReloading || currentAmmo === currentWeapon.ammo) return;
    isReloading = true;
    UI.showReloadMsg(true);
    
    // Animação: Rotaciona arma para baixo
    const originalRot = gameState.gunMesh.rotation.x;
    gameState.gunMesh.rotation.x += 0.8; 

    setTimeout(() => {
        currentAmmo = currentWeapon.ammo;
        UI.updateAmmoUI(currentAmmo, currentWeapon.ammo);
        isReloading = false;
        UI.showReloadMsg(false);
        gameState.gunMesh.rotation.x = originalRot;
    }, currentWeapon.reloadTime);
}

export function tryShoot(time) {
    if (inputs.isLeftMouseDown && time - lastShotTime > currentWeapon.fireRate) {
        if(currentWeapon.type === "semi" && !inputs.newClick) return; // Lógica simples para semi
        shoot(time);
        inputs.newClick = false; // Consome o clique
    }
}

function shoot(time) {
    if (currentAmmo <= 0) { UI.showNoAmmoMsg(); return; }
    if (isReloading) return;

    lastShotTime = time;
    currentAmmo--;
    UI.updateAmmoUI(currentAmmo, currentWeapon.ammo);

    // Muzzle Flash
    const flash = new THREE.PointLight(0xffffaa, 3, 20);
    gameState.gunBarrelTip.getWorldPosition(flash.position);
    gameState.scene.add(flash);
    setTimeout(() => gameState.scene.remove(flash), 50);

    // Disparar Projéteis
    const pelletCount = currentWeapon.type === "shotgun" ? 8 : 1;
    for (let i = 0; i < pelletCount; i++) createBullet();

    // Recuo
    if(inputs.aimMode !== 2) gameState.camera.rotation.x += currentWeapon.recoil;
    gameState.gunMesh.position.z += 0.4;
    setTimeout(() => gameState.gunMesh.position.z -= 0.4, 60);
}

function createBullet() {
    const bullet = new THREE.Mesh(new THREE.SphereGeometry(0.15,4,4), new THREE.MeshBasicMaterial({color:0xffffaa}));
    const startPos = new THREE.Vector3();
    gameState.gunBarrelTip.getWorldPosition(startPos);
    bullet.position.copy(startPos);

    // Raycast para convergir mira
    raycaster.setFromCamera(new THREE.Vector2(0,0), gameState.camera);
    const intersects = raycaster.intersectObjects(gameState.scene.children, true);
    let target = new THREE.Vector3();
    let found = false;
    for(let hit of intersects) {
        // Ignora player
        let obj = hit.object;
        let isPlayer = false;
        while(obj) { if(obj === gameState.playerGroup) { isPlayer = true; break; } obj = obj.parent; }
        if(!isPlayer) { target.copy(hit.point); found = true; break; }
    }
    if(!found) raycaster.ray.at(1000, target);

    let dir = new THREE.Vector3().subVectors(target, startPos).normalize();
    
    // Spread
    let spread = currentWeapon.spread;
    if(inputs.aimMode !== 0) spread *= 0.2;
    if(currentWeapon.type === "shotgun") spread = currentWeapon.spread; // Shotgun always spreads

    dir.x += (Math.random()-0.5)*spread;
    dir.y += (Math.random()-0.5)*spread;
    dir.z += (Math.random()-0.5)*spread;
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
        // Hitbox Inimigos
        for(let j = gameState.enemies.length - 1; j >= 0; j--) {
            const e = gameState.enemies[j];
            if(b.position.distanceTo(e.position) < 14) {
                e.userData.health -= b.userData.damage;
                e.position.add(b.userData.velocity.clone().normalize().multiplyScalar(1)); // Impacto físico
                if(e.userData.health <= 0) {
                    gameState.scene.remove(e);
                    gameState.enemies.splice(j, 1);
                    gameState.score += 50;
                    UI.updateScoreUI();
                }
                hit = true; break;
            }
        }
        // Chão/Parede
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
            gameState.bullets.splice(i,1);
        }
    }
}
