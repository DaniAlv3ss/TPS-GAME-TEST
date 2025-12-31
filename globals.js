import * as THREE from 'three';

export const inputs = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    canJump: false,
    isLeftMouseDown: false,
    isRightMouseDown: false,
    isBPressed: false,
    jumpPressed: false,
    isSprinting: false, // Novo input
    aimMode: 0 
};

export const gameState = {
    scene: null,
    camera: null,
    renderer: null,
    
    // Player Refs
    playerContainer: null,
    playerGroup: null,
    aimPivot: null,
    
    // Arma Atual
    currentWeaponIdx: 0,
    gunMesh: null,
    gunBarrelTip: null,
    cameraFPSPoint: null,
    
    // Body Parts
    torsoMesh: null,
    headMesh: null,
    
    // Arrays de Objetos
    bullets: [],
    enemies: [],
    obstacles: [],
    particles: [], // Fumaça e efeitos
    healthPacks: [], // Itens de cura
    
    // Estado do Jogo
    score: 0,
    health: 100,
    wave: 1,
    isGameOver: false,
    controlsEnabled: false
};

export const CONSTANTS = {
    GRAVITY: 800.0,
    JUMP_HEIGHT: 250.0,
    RUN_SPEED: 400.0,
    SPRINT_SPEED: 700.0, // Velocidade de corrida
    AIM_SPEED: 150.0,
    MAX_AMMO: 30, 
    FIRE_RATE: 100,
    BULLET_SPEED: 1500.0
};
