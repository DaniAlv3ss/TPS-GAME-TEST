import * as THREE from 'three';
import { gameState, inputs } from './globals.js';
import * as UI from './ui.js';

// --- DEFINIÇÃO DAS 10 ARMAS ---
const WEAPON_DB = [
    {
        name: "MK-17 TACTICAL",
        type: "auto",
        damage: 1,
        fireRate: 100,
        ammo: 30,
        reloadTime: 1500,
        speed: 1500,
        spread: 0.03,
        recoil: 0.003,
        color: 0x3d352b, // Tan
        sight: "holo",
        model: { barrelLen: 14, bodyLen: 12, magType: "box" },
        camOffset: { y: 5.0, z: -1.0 }
    },
    {
        name: "MP5 SUBMACHINE",
        type: "auto",
        damage: 0.6,
        fireRate: 60, // Muito rápida
        ammo: 45,
        reloadTime: 1000,
        speed: 1200,
        spread: 0.06,
        recoil: 0.002,
        color: 0x1a1a1a, // Black
        sight: "red_dot",
        model: { barrelLen: 6, bodyLen: 8, magType: "thin" },
        camOffset: { y: 4.5, z: -0.5 }
    },
    {
        name: "M4A1 CARBINE",
        type: "auto",
        damage: 1,
        fireRate: 90,
        ammo: 30,
        reloadTime: 1300,
        speed: 1600,
        spread: 0.025,
        recoil: 0.0025,
        color: 0x222222,
        sight: "holo",
        model: { barrelLen: 12, bodyLen: 10, magType: "box" },
        camOffset: { y: 5.0, z: -1.0 }
    },
    {
        name: "AK-47 VETERAN",
        type: "auto",
        damage: 1.5, // Dano alto
        fireRate: 120, // Mais lenta
        ammo: 30,
        reloadTime: 1800,
        speed: 1400,
        spread: 0.05, // Menos precisa
        recoil: 0.006, // Recuo alto
        color: 0x5c4033, // Madeira/Marrom
        sight: "iron",
        model: { barrelLen: 14, bodyLen: 12, magType: "curve" },
        camOffset: { y: 3.8, z: 0.0 }
    },
    {
        name: "AWP SNIPER",
        type: "semi",
        damage: 10, // Hit Kill
        fireRate: 1500, // Muito lenta
        ammo: 5,
        reloadTime: 2500,
        speed: 3000, // Instantâneo quase
        spread: 0.001, // Precisão laser
        recoil: 0.05, // Kick massivo
        color: 0x2f4f2f, // Verde Oliva
        sight: "scope",
        model: { barrelLen: 22, bodyLen: 14, magType: "box" },
        camOffset: { y: 5.5, z: -2.0 } // Zoom na luneta
    },
    {
        name: "M870 SHOTGUN",
        type: "shotgun", // Especial
        damage: 1, // Por pelim
        fireRate: 800,
        ammo: 8,
        reloadTime: 3000,
        speed: 900,
        spread: 0.15, // Espalha muito
        recoil: 0.04,
        color: 0x333333,
        sight: "iron",
        model: { barrelLen: 16, bodyLen: 10, magType: "none" },
        camOffset: { y: 3.5, z: 0.0 }
    },
    {
        name: "GLOCK 18C",
        type: "auto", // Machine pistol
        damage: 0.4,
        fireRate: 50, // Insana
        ammo: 20,
        reloadTime: 800,
        speed: 1000,
        spread: 0.08,
        recoil: 0.004,
        color: 0x555555, // Prata/Cinza
        sight: "iron_pistol",
        model: { barrelLen: 4, bodyLen: 5, magType: "pistol" },
        camOffset: { y: 3.0, z: 1.0 }
    },
    {
        name: "M249 SAW (LMG)",
        type: "auto",
        damage: 1.2,
        fireRate: 85,
        ammo: 100, // Pente gigante
        reloadTime: 4000, // Demora muito
        speed: 1400,
        spread: 0.06,
        recoil: 0.004,
        color: 0x3d352b,
        sight: "red_dot",
        model: { barrelLen: 18, bodyLen: 14, magType: "box_big" },
        camOffset: { y: 5.0, z: -0.5 }
    },
    {
        name: "VECTOR .45",
        type: "auto",
        damage: 0.5,
        fireRate: 40, // Super rápida
        ammo: 35,
        reloadTime: 900,
        speed: 1100,
        spread: 0.04,
        recoil: 0.001, // Quase zero
        color: 0xeeeeee, // Branca Sci-Fi
        sight: "holo",
        model: { barrelLen: 8, bodyLen: 8, magType: "thin" },
        camOffset: { y: 5.0, z: -1.0 }
    },
    {
        name: "RAILGUN PROTOTYPE",
        type: "semi",
        damage: 20,
        fireRate: 1000,
        ammo: 3,
        reloadTime: 2000,
        speed: 5000,
        spread: 0.0,
        recoil: 0.02,
        color: 0x00aaff, // Azul Neon
        sight: "scope_digital",
        model: { barrelLen: 20, bodyLen: 16, magType: "energy" },
        camOffset: { y: 5.5, z: -1.5 }
    }
];

// Estado Local da Arma
let currentWeapon = WEAPON_DB[0];
let currentAmmo = currentWeapon.ammo;
let isReloading = false;
let lastShotTime = 0;
let raycaster = new THREE.Raycaster();

// --- FUNÇÃO DE TROCA DE ARMA ---
export function switchWeapon(index) {
    if (index < 0 || index >= WEAPON_DB.length) return;
    if (gameState.currentWeaponIdx === index) return;
    
    gameState.currentWeaponIdx = index;
    currentWeapon = WEAPON_DB[index];
    currentAmmo = currentWeapon.ammo;
    isReloading = false;
    
    // Atualizar UI
    UI.updateAmmoUI(currentAmmo, currentWeapon.ammo);
    
    // Reconstruir Modelo 3D
    if (gameState.aimPivot) {
        // Remove arma antiga
        if (gameState.gunMesh) {
            gameState.aimPivot.remove(gameState.gunMesh);
        }
        createWeapon(gameState.aimPivot);
    }
    
    // Atualizar nome na UI
    const weaponNameEl = document.querySelector('#weapon-stats div:nth-child(2)');
    if(weaponNameEl) weaponNameEl.innerText = currentWeapon.name;
}

export function createWeapon(parentGroup) {
    const gunMesh = new THREE.Group();
    // Posição base na mão
    gunMesh.position.set(8, 14, -8); 
    parentGroup.add(gunMesh);
    gameState.gunMesh = gunMesh;

    // MATERIAIS
    const gunMat = new THREE.MeshStandardMaterial({ 
        color: currentWeapon.color, 
        roughness: 0.3, 
        metalness: 0.4 
    });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7, metalness: 0.2 });
    
    const m = currentWeapon.model;

    // --- CORPO DA ARMA (Procedural) ---
    const body = new THREE.Mesh(new THREE.BoxGeometry(3, 5, m.bodyLen), gunMat);
    body.position.z = 0;
    gunMesh.add(body);

    // --- MAGAZINE ---
    if (m.magType !== "none") {
        let magGeo;
        if (m.magType === "box") magGeo = new THREE.BoxGeometry(2.5, 8, 4);
        else if (m.magType === "thin") magGeo = new THREE.BoxGeometry(2, 8, 2.5);
        else if (m.magType === "curve") magGeo = new THREE.BoxGeometry(2.5, 9, 4); // Curva visual simulada na rotação
        else if (m.magType === "box_big") magGeo = new THREE.BoxGeometry(4, 6, 5);
        else if (m.magType === "pistol") magGeo = new THREE.BoxGeometry(2, 6, 2);
        else magGeo = new THREE.BoxGeometry(2.5, 8, 4);

        const mag = new THREE.Mesh(magGeo, darkMetal);
        mag.position.set(0, -4, 0);
        if (m.magType === "curve") mag.rotation.x = 0.3;
        gunMesh.add(mag);
    }

    // --- CANO ---
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, m.barrelLen, 12), darkMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = - (m.bodyLen/2 + m.barrelLen/2);
    gunMesh.add(barrel);

    // --- CORONHA ---
    if (m.magType !== "pistol") {
        const stock = new THREE.Mesh(new THREE.BoxGeometry(2.8, 6, 6), gunMat);
        stock.position.set(0, -1, (m.bodyLen/2 + 3));
        gunMesh.add(stock);
    }

    // --- PONTA DO CANO (Tip) ---
    const gunBarrelTip = new THREE.Object3D();
    gunBarrelTip.position.set(0, 0, - (m.bodyLen/2 + m.barrelLen));
    gunMesh.add(gunBarrelTip);
    gameState.gunBarrelTip = gunBarrelTip;

    // --- MIRA (SIGHT) ---
    buildSight(gunMesh, currentWeapon.sight, gunMat, darkMetal);

    // --- CÂMERA FPS POINT ---
    // Ajustado dinamicamente pela config da arma
    const cameraFPSPoint = new THREE.Object3D();
    cameraFPSPoint.position.set(0, currentWeapon.camOffset.y, currentWeapon.camOffset.z); 
    gunMesh.add(cameraFPSPoint);
    gameState.cameraFPSPoint = cameraFPSPoint;
}

// Construtor de Miras
function buildSight(parent, type, matBody, matDetail) {
    const sightGroup = new THREE.Group();
    sightGroup.position.set(0, 2.6, 0); // Em cima do corpo
    parent.add(sightGroup);

    if (type === "holo") {
        // Base
        sightGroup.add(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 5), matDetail));
        // Lente Frame
        const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.5, 0.5), matDetail);
        frame.position.set(0, 1.5, 2); // Tras
        sightGroup.add(frame);
        const frameF = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.5, 0.5), matDetail);
        frameF.position.set(0, 1.5, -2); // Frente
        sightGroup.add(frameF);
        
        // Retículo
        const reticle = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), createReticleTexture("circle"));
        reticle.position.set(0, 1.5, -1.9);
        sightGroup.add(reticle);

    } else if (type === "red_dot") {
        // Tubo
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 3, 16), matDetail);
        tube.rotation.x = Math.PI / 2;
        tube.position.y = 1.0;
        sightGroup.add(tube);
        
        // Ponto
        const dot = new THREE.Mesh(new THREE.CircleGeometry(0.1, 8), new THREE.MeshBasicMaterial({color: 0xff0000}));
        dot.position.set(0, 1.0, -1.4);
        sightGroup.add(dot);

    } else if (type === "scope" || type === "scope_digital") {
        // Luneta Longa
        const scopeBody = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 10, 16), matDetail);
        scopeBody.rotation.x = Math.PI / 2;
        scopeBody.position.y = 1.5;
        sightGroup.add(scopeBody);
        
        // Lente Cruz
        const reticle = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), createReticleTexture("cross"));
        reticle.position.set(0, 1.5, -4.9);
        sightGroup.add(reticle);

    } else if (type === "iron" || type === "iron_pistol") {
        // Mira de Ferro Simples
        const rear = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 0.5), matDetail);
        rear.position.set(0, 0.5, 4);
        sightGroup.add(rear);
        
        const front = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.5), matDetail);
        front.position.set(0, 0.5, -4);
        sightGroup.add(front);
    }
}

function createReticleTexture(style) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const cx = 64; const cy = 64;

    ctx.clearRect(0,0,128,128);
    ctx.strokeStyle = '#ff0000'; 
    ctx.fillStyle = '#ff0000';
    ctx.shadowBlur = 5; 
    ctx.shadowColor = "#ff0000";
    ctx.lineWidth = 3;

    if (style === "circle") {
        ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx, cy-40); ctx.lineTo(cx, cy-50); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy+40); ctx.lineTo(cx, cy+50); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx-40, cy); ctx.lineTo(cx-50, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+40, cy); ctx.lineTo(cx+50, cy); ctx.stroke();
    } else if (style === "cross") {
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, 128); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(128, cy); ctx.stroke();
        // Mil-dots
        for(let i=20; i<128; i+=20) {
            ctx.beginPath(); ctx.arc(cx, i, 2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(i, cy, 2, 0, Math.PI*2); ctx.fill();
        }
    }

    return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, side: THREE.DoubleSide, depthTest: false });
}

// --- LÓGICA DE TIRO ---

export function reload() {
    if (isReloading || currentAmmo === currentWeapon.ammo) return;
    isReloading = true;
    UI.showReloadMsg(true);
    
    // Animação de Recarga
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
    // Verifica cadência de tiro
    if (inputs.isLeftMouseDown && time - lastShotTime > currentWeapon.fireRate) {
        
        // Verifica tipo de gatilho
        if (currentWeapon.type === "semi" || currentWeapon.type === "shotgun") {
            // Semi-auto exige clique novo (implementação simples: delay maior ou controle de clique)
            // Aqui permitimos segurar, mas com fireRate bem lento para semi
        }
        
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
    UI.updateAmmoUI(currentAmmo, currentWeapon.ammo);

    // Muzzle Flash
    const flash = new THREE.PointLight(0xffffaa, 4, 25);
    gameState.gunBarrelTip.getWorldPosition(flash.position);
    gameState.scene.add(flash);
    setTimeout(() => gameState.scene.remove(flash), 40);

    // Número de projéteis (Shotgun = 8, outros = 1)
    const pelletCount = currentWeapon.type === "shotgun" ? 8 : 1;

    for (let p = 0; p < pelletCount; p++) {
        createBullet();
    }

    // Recuo (Visual + Câmera)
    // Se não estiver em FPS, aplica recuo na câmera
    if (inputs.aimMode !== 2) {
        gameState.camera.rotation.x += currentWeapon.recoil;
    }
    // Recuo da malha
    gameState.gunMesh.position.z += 0.5;
    setTimeout(() => gameState.gunMesh.position.z -= 0.5, 50);
}

function createBullet() {
    const bullet = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 4, 4), 
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
    
    // Spread Dinâmico
    let baseSpread = currentWeapon.spread;
    if (inputs.aimMode !== 0) baseSpread *= 0.2; // Melhora muito mirando
    if (currentWeapon.type === "shotgun") baseSpread = currentWeapon.spread; // Shotgun espalha sempre

    dir.x += (Math.random() - 0.5) * baseSpread;
    dir.y += (Math.random() - 0.5) * baseSpread;
    dir.z += (Math.random() - 0.5) * baseSpread;
    dir.normalize();

    bullet.userData = { 
        velocity: dir.multiplyScalar(currentWeapon.speed), 
        life: 100,
        damage: currentWeapon.damage 
    };
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
                enemy.userData.health -= b.userData.damage; // Dano variável
                
                // Impacto visual simples
                enemy.position.add(b.userData.velocity.clone().normalize().multiplyScalar(2));
                
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
