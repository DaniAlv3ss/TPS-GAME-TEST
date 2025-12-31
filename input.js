import { gameState, inputs } from './globals.js'; 
import { reload, switchWeapon } from './weapon.js';

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
        // Troca de Armas (1-0)
        const num = parseInt(e.key);
        if (!isNaN(num) && num >= 0 && num <= 9) {
            // Tecla 1 = Index 0, Tecla 0 = Index 9
            const weaponIdx = num === 0 ? 9 : num - 1;
            switchWeapon(weaponIdx);
        }

        switch(e.code) {
            case 'KeyW': inputs.moveForward = true; break;
            case 'KeyA': inputs.moveLeft = true; break;
            case 'KeyS': inputs.moveBackward = true; break;
            case 'KeyD': inputs.moveRight = true; break;
            case 'Space': 
                if(inputs.canJump) {
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

        if(gameState.playerContainer) {
            gameState.playerContainer.rotation.y -= e.movementX * sensitivity;
        }
        
        if (gameState.aimPivot) {
            const currentRot = gameState.aimPivot.rotation.x;
            let nextRot = currentRot - (e.movementY * sensitivity);
            nextRot = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, nextRot));
            
            gameState.aimPivot.rotation.x = nextRot;
            
            if (inputs.aimMode !== 2) {
                 gameState.camera.rotation.x = nextRot;
            }
        }
    });
    
    document.addEventListener('contextmenu', e => e.preventDefault());
}
