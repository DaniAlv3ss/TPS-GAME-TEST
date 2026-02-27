import * as THREE from 'three';

export const inputs = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    canJump: false,
    isLeftMouseDown: false,
    isRightMouseDown: false,
    isNewClick: false,
    isBPressed: false,
    jumpPressed: false,
    isSprinting: false,
    aimMode: 0 // 0: Normal, 1: TPS, 2: FPS
};

export const gameState = {
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    
    // Dual Render Scope (Battlefield Style)
    scopeCamera: null,
    scopeRenderTarget: null,
    
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
    particles: [],
    decals: [],
    explosions: [],
    healthPacks: [],
    
    // Estado do Jogo
    score: 0,
    health: 100,
    wave: 1,
    isGameOver: false,
    controlsEnabled: false,

    // Visual State
    hitFlash: 0,
    ambientPulse: 0,
    rainSystem: null,
    rainVelocities: null,
    weatherLevel: 0,
    lightningFlash: 0,
    lastBossWave: 0,
    currentBoss: null,
    stormEvent: {
        active: false,
        intensity: 0,
        timer: 0,
        duration: 20
    },
    cinematic: {
        active: false,
        timer: 0,
        duration: 2.2,
        freezeDuration: 0.16,
        shakeIntensity: 0,
        shakeTimer: 0
    },

    // Audio State
    audioCtx: null,
    audioMaster: null,
    audioReady: false,
    musicNodes: null,
    musicIntensity: 0
};

export const CONSTANTS = {
    GRAVITY: 800.0,
    JUMP_HEIGHT: 250.0,
    RUN_SPEED: 400.0,
    SPRINT_SPEED: 700.0,
    AIM_SPEED: 150.0,
    MAX_AMMO: 30, 
    FIRE_RATE: 100,
    BULLET_SPEED: 1500.0
};
