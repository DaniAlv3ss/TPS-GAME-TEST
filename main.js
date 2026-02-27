import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { gameState } from './globals.js';
import { setupInput } from './input.js';
import { createMap, updateMapObjects } from './map.js';
import { createPlayer, updatePlayer } from './player.js';
import { updateBullets, tryShoot } from './weapon.js';
import { updateEnemies } from './enemy.js';
import { updateAudio } from './audio.js';
import { initEffects, updateEffects } from './effects.js';

let lastTime = performance.now();

function init() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3a4a63);
    scene.fog = new THREE.Fog(0x3a4a63, 180, 1200);
    gameState.scene = scene;

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 1000);
    gameState.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    document.getElementById('game-container').appendChild(renderer.domElement);
    gameState.renderer = renderer;

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.24, 0.38, 0.9);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    gameState.composer = composer;

    const hemiLight = new THREE.HemisphereLight(0x8fa1c2, 0x0f1620, 0.55);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffc89a, 0.85);
    dirLight.position.set(100, 200, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    scene.add(dirLight);

    createMap();
    createPlayer();
    initEffects();
    setupInput();

    window.addEventListener('resize', onWindowResize);
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const deltaRaw = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    let delta = deltaRaw;
    if (gameState.cinematic.active) {
        gameState.cinematic.timer += deltaRaw;
        if (gameState.cinematic.timer < gameState.cinematic.freezeDuration) {
            delta = 0;
        }
        if (gameState.cinematic.timer >= gameState.cinematic.duration) {
            gameState.cinematic.active = false;
            gameState.cinematic.timer = 0;
        }
    }

    gameState.scene.fog.color.setRGB(0.22, 0.29, 0.4);
    gameState.scene.background.copy(gameState.scene.fog.color);

    if (gameState.controlsEnabled && !gameState.isGameOver) {
        updatePlayer(delta, time);
        tryShoot(time);
        updateBullets(delta);
        updateEnemies(delta, time);
        updateMapObjects(time / 1000);
        updateAudio(delta, time);
        updateEffects(delta, time);
    }

    applyCameraShake(deltaRaw);
    gameState.composer.render();
}

function applyCameraShake(delta) {
    if (!gameState.camera) return;

    const c = gameState.cinematic;
    const stormShake = 0;

    if (c.shakeTimer > 0) {
        c.shakeTimer = Math.max(0, c.shakeTimer - delta);
        const fade = c.shakeTimer / 0.9;
        const power = c.shakeIntensity * fade;
        gameState.camera.rotation.x += (Math.random() - 0.5) * power;
        gameState.camera.rotation.z += (Math.random() - 0.5) * power;
        gameState.camera.position.x += (Math.random() - 0.5) * power * 8;
        gameState.camera.position.y += (Math.random() - 0.5) * power * 6;
    }

    if (stormShake > 0.0001) {
        gameState.camera.rotation.z += (Math.random() - 0.5) * stormShake;
    }
}

function onWindowResize() {
    gameState.camera.aspect = window.innerWidth / window.innerHeight;
    gameState.camera.updateProjectionMatrix();
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    if (gameState.composer) gameState.composer.setSize(window.innerWidth, window.innerHeight);
}

init();
