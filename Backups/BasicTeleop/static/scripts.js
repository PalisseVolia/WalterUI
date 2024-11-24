const LINEAR_VEL_STEP_SIZE = 0.01;
const ANGULAR_VEL_STEP_SIZE = 0.1;
const MAX_LINEAR_VEL = 0.22;
const MAX_ANGULAR_VEL = 2.84;

let currentLinearVel = 0;
let currentAngularVel = 0;
let pressedKeys = new Set();
let touchStartTime = 0;
let longPressTimer = null;
let isLongPress = false;

function toggleMonitor() {
    const monitorPanel = document.querySelector('.monitor-panel');
    const button = document.querySelector('#toggle-monitor');
    if (monitorPanel.style.display === 'none' || !monitorPanel.style.display) {
        monitorPanel.style.display = 'block';
        button.textContent = 'Hide Monitor';
    } else {
        monitorPanel.style.display = 'none';
        button.textContent = 'Show Monitor';
    }
}

function toggleInstructions() {
    const monitorInstructions = document.querySelector('.instructions');
    const button = document.querySelector('#toggle-instructions');
    if (monitorInstructions.style.display === 'none' || !monitorInstructions.style.display) {
        monitorInstructions.style.display = 'block';
        button.textContent = 'Hide Instructions';
    } else {
        monitorInstructions.style.display = 'none';
        button.textContent = 'Show Instructions';
    }
}

function sendVelocity(linearX, angularZ) {
    fetch('/cmd_vel', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            linear_x: linearX,
            angular_z: angularZ
        })
    });
}

function updateVelocity(forward, left, right, backward) {
    let targetLinear = 0;
    let targetAngular = 0;

    if (forward && !backward) targetLinear = MAX_LINEAR_VEL;
    if (backward && !forward) targetLinear = -MAX_LINEAR_VEL;
    if (left && !right) targetAngular = MAX_ANGULAR_VEL;
    if (right && !left) targetAngular = -MAX_ANGULAR_VEL;

    // Smooth acceleration
    if (Math.abs(currentLinearVel - targetLinear) > LINEAR_VEL_STEP_SIZE) {
        currentLinearVel += Math.sign(targetLinear - currentLinearVel) * LINEAR_VEL_STEP_SIZE;
    } else {
        currentLinearVel = targetLinear;
    }

    if (Math.abs(currentAngularVel - targetAngular) > ANGULAR_VEL_STEP_SIZE) {
        currentAngularVel += Math.sign(targetAngular - currentAngularVel) * ANGULAR_VEL_STEP_SIZE;
    } else {
        currentAngularVel = targetAngular;
    }

    sendVelocity(currentLinearVel, currentAngularVel);
}

// Button controls with enhanced touch support
document.querySelectorAll('.control-btn').forEach(btn => {
    let isPressed = false;
    let pressInterval = null;

    function startContinuousPress() {
        if (!pressInterval) {
            handlePress();
            pressInterval = setInterval(() => {
                handlePress();
            }, 50); // Update at 20Hz to match the main update loop
        }
    }

    function stopContinuousPress() {
        if (pressInterval) {
            clearInterval(pressInterval);
            pressInterval = null;
        }
        handleRelease();
    }

    function handlePress() {
        if (!isPressed) {
            isPressed = true;
            btn.classList.add('pressed');
            switch(btn.id) {
                case 'forward': pressedKeys.add('ArrowUp'); break;
                case 'left': pressedKeys.add('ArrowLeft'); break;
                case 'right': pressedKeys.add('ArrowRight'); break;
                case 'backward': pressedKeys.add('ArrowDown'); break;
                case 'stop': 
                    pressedKeys.clear();
                    currentLinearVel = 0;
                    currentAngularVel = 0;
                    sendVelocity(0, 0);
                    break;
            }
        }
    }

    function handleRelease() {
        if (isPressed) {
            isPressed = false;
            btn.classList.remove('pressed');
            switch(btn.id) {
                case 'forward': pressedKeys.delete('ArrowUp'); break;
                case 'left': pressedKeys.delete('ArrowLeft'); break;
                case 'right': pressedKeys.delete('ArrowRight'); break;
                case 'backward': pressedKeys.delete('ArrowDown'); break;
            }
        }
    }

    // Mouse events
    btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startContinuousPress();
    });

    btn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        stopContinuousPress();
    });

    btn.addEventListener('mouseleave', (e) => {
        e.preventDefault();
        stopContinuousPress();
    });

    // Enhanced touch events
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchStartTime = Date.now();
        startContinuousPress();
    });

    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopContinuousPress();
    });

    btn.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        stopContinuousPress();
    });

    // Prevent touchmove from triggering multiple times
    btn.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (target !== btn) {
            stopContinuousPress();
        }
    });
});

// Keyboard controls remain the same
const keyMap = {
    'ArrowUp': 'forward',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'ArrowDown': 'backward',
    'w': 'forward',
    'a': 'left',
    'd': 'right',
    's': 'backward',
    ' ': 'stop'
};

document.addEventListener('keydown', (event) => {
    if (keyMap[event.key]) {
        event.preventDefault();
        pressedKeys.add(event.key);
        const btn = document.getElementById(keyMap[event.key]);
        if (btn) btn.classList.add('pressed');
    }
});

document.addEventListener('keyup', (event) => {
    if (keyMap[event.key]) {
        event.preventDefault();
        pressedKeys.delete(event.key);
        const btn = document.getElementById(keyMap[event.key]);
        if (btn) btn.classList.remove('pressed');
    }
});

// Update loop
setInterval(() => {
    const forward = pressedKeys.has('ArrowUp') || pressedKeys.has('w');
    const left = pressedKeys.has('ArrowLeft') || pressedKeys.has('a');
    const right = pressedKeys.has('ArrowRight') || pressedKeys.has('d');
    const backward = pressedKeys.has('ArrowDown') || pressedKeys.has('s');
    
    updateVelocity(forward, left, right, backward);
}, 50);  // 20Hz update rate

// Monitor current velocity
function updateTwist() {
    fetch('/twist')
        .then(response => response.json())
        .then(data => {
            // Update linear velocities
            document.getElementById('linear-x').textContent = data.linear.x.toFixed(3);
            document.getElementById('linear-y').textContent = data.linear.y.toFixed(3);
            document.getElementById('linear-z').textContent = data.linear.z.toFixed(3);
            
            // Update angular velocities
            document.getElementById('angular-x').textContent = data.angular.x.toFixed(3);
            document.getElementById('angular-y').textContent = data.angular.y.toFixed(3);
            document.getElementById('angular-z').textContent = data.angular.z.toFixed(3);
        });
}

// Update display 10 times per second
setInterval(updateTwist, 100);