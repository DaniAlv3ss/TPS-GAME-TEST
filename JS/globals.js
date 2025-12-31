import * as THREE from 'three';

export const gameState = {
    scene: null,
    camera: null,
    renderer: null,
    
    // Player Refs
    playerContainer: null,
    playerGroup: null,
    aimPivot: null,
    gunMesh: null,
    gunBarrelTip: null,
    cameraFPSPoint: null,
    torsoMesh: null,
    headMesh: null,
    
    // Arrays de Objetos
    bullets: [],
    enemies: [],
    obstacles: [],
    particles: [], // Opcional se implementarmos particulas depois
    
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
    AIM_SPEED: 150.0,
    MAX_AMMO: 30,
    FIRE_RATE: 100,
    BULLET_SPEED: 1500.0
};