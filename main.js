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
    scene.background = new THREE.Color(0x789dca);
    scene.fog = new THREE.Fog(0x789dca, 160, 1400);
    gameState.scene = scene;

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 1000);
    gameState.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    document.getElementById('game-container').appendChild(renderer.domElement);
    gameState.renderer = renderer;

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.55, 0.5, 0.82);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    gameState.composer = composer;

    const hemiLight = new THREE.HemisphereLight(0xddefff, 0x1a2230, 0.72);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xfff4d0, 1.2);
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

    const dayLerp = (Math.sin(time * 0.00008) + 1) * 0.5;
    const stormDark = gameState.stormEvent?.intensity || 0;
    gameState.scene.fog.color.setRGB(
        0.35 + dayLerp * 0.2 - stormDark * 0.18,
        0.45 + dayLerp * 0.2 - stormDark * 0.2,
        0.6 + dayLerp * 0.25 - stormDark * 0.28
    );
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
    const stormShake = (gameState.stormEvent?.intensity || 0) * 0.003;

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
