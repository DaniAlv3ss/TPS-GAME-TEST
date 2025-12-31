import { gameState } from './globals.js';
import { reload } from './weapon.js';

export const inputs = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    canJump: false,
    isLeftMouseDown: false,
    isRightMouseDown: false,
    isBPressed: false,
    
    // 0: Normal, 1: TPS Aim, 2: FPS Aim
    aimMode: 0
};

let lastRightClickTime = 0;
const blocker = document.getElementById('blocker');

export function setupInput() {
    blocker.addEventListener('click', () => {
        if(gameState.isGameOver) location.reload();
        document.body.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
        gameState.controlsEnabled = (document.pointerLockElement === document.body);
        blocker.style.display = gameState.controlsEnabled ? 'none' : 'flex';
        if(!gameState.controlsEnabled) {
            inputs.aimMode = 0;
            inputs.isLeftMouseDown = false;
        }
    });

    document.addEventListener('keydown', (e) => {
        switch(e.code) {
            case 'KeyW': inputs.moveForward = true; break;
            case 'KeyA': inputs.moveLeft = true; break;
            case 'KeyS': inputs.moveBackward = true; break;
            case 'KeyD': inputs.moveRight = true; break;
            case 'Space': 
                if(inputs.canJump) {
                    // Nota: A lógica de pular manipula a velocidade no player.js
                    // Aqui só setamos a flag que foi pressionado
                    inputs.jumpPressed = true; 
                }
                break;
            case 'KeyR': reload(); break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch(e.code) {
            case 'KeyW': inputs.moveForward = false; break;
            case 'KeyA': inputs.moveLeft = false; break;
            case 'KeyS': inputs.moveBackward = false; break;
            case 'KeyD': inputs.moveRight = false; break;
        }
    });

    document.addEventListener('mousedown', (e) => {
        if(!gameState.controlsEnabled) return;
        
        if(e.button === 0) {
            inputs.isLeftMouseDown = true;
        } else if(e.button === 2) {
            inputs.isRightMouseDown = true;
            
            // Lógica Toggle / Double Click
            const now = performance.now();
            const deltaClick = now - lastRightClickTime;
            lastRightClickTime = now;

            if(deltaClick < 250) {
                inputs.aimMode = 2; // FPS
            } else {
                if(inputs.aimMode !== 0) {
                    inputs.aimMode = 0; // Reset
                } else {
                    inputs.aimMode = 1; // Ombro
                }
            }
        }
    });

    document.addEventListener('mouseup', (e) => {
        if(e.button === 0) inputs.isLeftMouseDown = false;
        if(e.button === 2) inputs.isRightMouseDown = false;
    });

    document.addEventListener('mousemove', (e) => {
        if(!gameState.controlsEnabled) return;
        
        let sensitivity = 0.002;
        if(inputs.aimMode === 1) sensitivity = 0.001;
        if(inputs.aimMode === 2) sensitivity = 0.0005;

        // Rotação Y (Corpo)
        if(gameState.playerContainer) {
            gameState.playerContainer.rotation.y -= e.movementX * sensitivity;
        }
        
        // Rotação X (Pivot da Arma/Câmera)
        if (gameState.aimPivot) {
            const currentRot = gameState.aimPivot.rotation.x;
            let nextRot = currentRot - (e.movementY * sensitivity);
            nextRot = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, nextRot));
            
            gameState.aimPivot.rotation.x = nextRot;
            
            // Se não estiver em FPS, a câmera segue a rotação do pivot manualmente aqui.
            // Em FPS, ela segue via lerp no update do player.
            if (inputs.aimMode !== 2) {
                 gameState.camera.rotation.x = nextRot;
            }
        }
    });
    
    document.addEventListener('contextmenu', e => e.preventDefault());
}