import * as THREE from 'three';
import { gameState } from './globals.js';
import { setupInput } from './input.js';
import { createMap } from './map.js';
import { createPlayer, updatePlayer } from './player.js';
import { updateBullets, tryShoot } from './weapon.js';
import { updateEnemies } from './enemy.js';

let lastTime = performance.now();

function init() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c10);
    scene.fog = new THREE.Fog(0x0a0c10, 50, 800);
    gameState.scene = scene;

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 1000);
    gameState.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    document.getElementById('game-container').appendChild(renderer.domElement);
    gameState.renderer = renderer;

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x111111, 0.5);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(50, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    scene.add(dirLight);

    createMap();
    createPlayer();
    setupInput();

    window.addEventListener('resize', onWindowResize);
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    if (gameState.controlsEnabled && !gameState.isGameOver) {
        updatePlayer(delta, time);
        tryShoot(time);
        updateBullets(delta);
        updateEnemies(delta, time);
    }
    gameState.renderer.render(gameState.scene, gameState.camera);
}

function onWindowResize() {
    gameState.camera.aspect = window.innerWidth / window.innerHeight;
    gameState.camera.updateProjectionMatrix();
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
