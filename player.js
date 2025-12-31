import * as THREE from 'three';
import { gameState, CONSTANTS } from './globals.js';
import { inputs } from './input.js';
import * as UI from './ui.js';
import { createWeapon } from './weapon.js';

const limbs = { leftLeg: null, rightLeg: null, leftArm: null, rightArm: null };
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Camera Offsets
const normalOffset = new THREE.Vector3(20, 50, 75); 
const aimOffset = new THREE.Vector3(15, 35, 40); 
const currentCameraTarget = new THREE.Vector3();

export function createPlayer() {
    const playerContainer = new THREE.Group();
    gameState.scene.add(playerContainer);
    gameState.playerContainer = playerContainer;

    const playerGroup = new THREE.Group();
    playerContainer.add(playerGroup);
    gameState.playerGroup = playerGroup;

    const skinMat = new THREE.MeshLambertMaterial({ color: 0xccaa99 });
    const uniformMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });

    // Membros inferiores
    const legGeo = new THREE.BoxGeometry(4.5, 14, 5);
    legGeo.translate(0, -7, 0); 
    limbs.leftLeg = new THREE.Mesh(legGeo, uniformMat);
    limbs.leftLeg.position.set(-3, 11, 0);
    limbs.leftLeg.castShadow = true;
    playerGroup.add(limbs.leftLeg);

    limbs.rightLeg = new THREE.Mesh(legGeo, uniformMat);
    limbs.rightLeg.position.set(3, 11, 0);
    limbs.rightLeg.castShadow = true;
    playerGroup.add(limbs.rightLeg);

    // AimPivot
    const aimPivot = new THREE.Group();
    aimPivot.position.set(0, 16, 0); 
    playerGroup.add(aimPivot);
    gameState.aimPivot = aimPivot;

    // Torso e Cabeça
    const torsoGeo = new THREE.BoxGeometry(12, 16, 8);
    torsoGeo.translate(0, 8, 0); 
    const torsoMesh = new THREE.Mesh(torsoGeo, vestMat);
    torsoMesh.castShadow = true;
    aimPivot.add(torsoMesh);
    gameState.torsoMesh = torsoMesh;

    const headMesh = new THREE.Group();
    headMesh.position.set(0, 18, 0);
    headMesh.add(new THREE.Mesh(new THREE.BoxGeometry(7, 8, 7.5), skinMat));
    // Goggles
    const goggles = new THREE.Mesh(new THREE.BoxGeometry(7.2, 2.5, 2), new THREE.MeshStandardMaterial({color:0x222}));
    goggles.position.set(0, 1, -3.5);
    headMesh.add(goggles);
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(7.5, 4, 8), vestMat);
    helmet.position.set(0, 4, 0);
    headMesh.add(helmet);
    aimPivot.add(headMesh);
    gameState.headMesh = headMesh;

    // Braços
    const armGeo = new THREE.BoxGeometry(4, 13, 4);
    armGeo.translate(0, -5, 0);
    limbs.leftArm = new THREE.Mesh(armGeo, uniformMat);
    limbs.leftArm.position.set(-8, 14, 0); 
    limbs.leftArm.castShadow = true;
    aimPivot.add(limbs.leftArm);

    limbs.rightArm = new THREE.Mesh(armGeo, uniformMat);
    limbs.rightArm.position.set(8, 14, 0); 
    limbs.rightArm.rotation.x = Math.PI / 2; 
    limbs.rightArm.castShadow = true;
    aimPivot.add(limbs.rightArm);

    // Adiciona Arma
    createWeapon(aimPivot);

    // Inicializa Câmera
    playerContainer.add(gameState.camera);
    gameState.camera.position.copy(normalOffset);
}

export function updatePlayer(delta, time) {
    let currentSpeed = (inputs.aimMode !== 0) ? CONSTANTS.AIM_SPEED : CONSTANTS.RUN_SPEED;

    // Movimento / Física
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= CONSTANTS.GRAVITY * delta;

    direction.z = Number(inputs.moveForward) - Number(inputs.moveBackward);
    direction.x = Number(inputs.moveRight) - Number(inputs.moveLeft);
    direction.normalize();

    if (inputs.moveForward || inputs.moveBackward) velocity.z -= direction.z * currentSpeed * delta;
    if (inputs.moveLeft || inputs.moveRight) velocity.x -= direction.x * currentSpeed * delta;

    // Pulo
    if(inputs.jumpPressed && inputs.canJump) {
        velocity.y += CONSTANTS.JUMP_HEIGHT;
        inputs.canJump = false;
        inputs.jumpPressed = false;
    }

    gameState.playerContainer.translateX(-velocity.x * delta);
    gameState.playerContainer.translateZ(velocity.z * delta);
    gameState.playerContainer.position.y += velocity.y * delta;

    if (gameState.playerContainer.position.y < 0) {
        velocity.y = 0;
        gameState.playerContainer.position.y = 0;
        inputs.canJump = true;
    }

    // Animação Membros
    const isMoving = inputs.moveForward || inputs.moveBackward || inputs.moveLeft || inputs.moveRight;
    if(isMoving) {
        const t = time * 0.012;
        limbs.leftLeg.rotation.x = Math.sin(t) * 0.7;
        limbs.rightLeg.rotation.x = Math.sin(t + Math.PI) * 0.7;
    } else {
        limbs.leftLeg.rotation.x = 0;
        limbs.rightLeg.rotation.x = 0;
    }

    updateCamera();
}

function updateCamera() {
    UI.updateCrosshair(inputs.aimMode);

    if(inputs.aimMode === 2) {
        // FPS
        gameState.headMesh.visible = false;
        gameState.torsoMesh.visible = false;
        
        const eyePos = new THREE.Vector3();
        const eyeQuat = new THREE.Quaternion();
        gameState.cameraFPSPoint.getWorldPosition(eyePos);
        gameState.cameraFPSPoint.getWorldQuaternion(eyeQuat);
        
        // Conversão para Local Space do Container
        gameState.playerContainer.worldToLocal(eyePos);
        
        gameState.camera.position.lerp(eyePos, 0.3);
        
        // Em FPS, câmera copia a rotação do aimPivot (X) e zera as outras
        gameState.camera.rotation.x = gameState.aimPivot.rotation.x;
        gameState.camera.rotation.y = 0;
        gameState.camera.rotation.z = 0;
    } else {
        // TPS
        gameState.headMesh.visible = true;
        gameState.torsoMesh.visible = true;

        if(inputs.aimMode === 1) {
            currentCameraTarget.copy(aimOffset);
        } else {
            currentCameraTarget.copy(normalOffset);
        }
        gameState.camera.position.lerp(currentCameraTarget, 0.15);
        gameState.camera.rotation.x = gameState.aimPivot.rotation.x;
        gameState.camera.rotation.y = 0;
        gameState.camera.rotation.z = 0;
    }
}