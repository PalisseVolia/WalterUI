class ControlPanel {
  constructor(container) {
    this.container = container;
    this.keyDownHandler = null;
    this.keyUpHandler = null;
    this.updateInterval = null;
    this.pressedKeys = new Set();
    this.buttonCleanupFunctions = [];
    this.updateScaling();
    this.init();
  }

  updateScaling() {
    const count = document.querySelectorAll(".content-area").length;
    switch (count) {
      case 1:
        var scaleFactor = 1;
        break;
      case 2:
        var scaleFactor = 1.5;
        break;
      case 3:
        var scaleFactor = 1.9;
        break;
      case 4:
        var scaleFactor = 2.3;
      default:
        break;
    }

    // Update CSS variables
    document.documentElement.style.setProperty(
      "--control-size",
      `min(${15 / scaleFactor}vh, ${15 / scaleFactor}vw)`
    );
    document.documentElement.style.setProperty(
      "--control-gap",
      `${1 / scaleFactor}vh`
    );
    document.documentElement.style.setProperty(
      "--control-margin",
      `min(${3 / scaleFactor}vh, ${3 / scaleFactor}vw)`
    );
    document.documentElement.style.setProperty(
      "--control-font-size",
      `min(${5 / scaleFactor}vh, ${5 / scaleFactor}vw)`
    );
  }

  cleanup() {
    // Remove keyboard event listeners
    if (this.keyDownHandler) {
      document.removeEventListener("keydown", this.keyDownHandler);
    }
    if (this.keyUpHandler) {
      document.removeEventListener("keyup", this.keyUpHandler);
    }

    // Clear update interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Clean up button event listeners
    this.buttonCleanupFunctions.forEach((cleanup) => cleanup());
    this.buttonCleanupFunctions = [];

    // Clear any remaining state
    this.pressedKeys.clear();
    this.container.innerHTML = "";
  }

  destroy() {
    this.cleanup();
  }

  init() {
    // Constants
    const LINEAR_VEL_STEP_SIZE = 0.01;
    const ANGULAR_VEL_STEP_SIZE = 0.1;
    const MAX_LINEAR_VEL = 0.22;
    const MAX_ANGULAR_VEL = 2.84;

    // Create control panel HTML
    this.container.innerHTML = `
            <div class="controls">
                <div class="empty"></div>
                <button class="control-btn" id="forward" title="Forward">↑</button>
                <div class="empty"></div>
                <button class="control-btn" id="left" title="Rotate Left">←</button>
                <button class="control-btn" id="stop" title="Stop">⬤</button>
                <button class="control-btn" id="right" title="Rotate Right">→</button>
                <div class="empty"></div>
                <button class="control-btn" id="backward" title="Backward">↓</button>
                <div class="empty"></div>
            </div>
        `;

    let currentLinearVel = 0;
    let currentAngularVel = 0;
    let pressedKeys = new Set();
    let touchStartTime = 0;

    function sendVelocity(linearX, angularZ) {
      fetch("/cmd_vel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linear_x: linearX,
          angular_z: angularZ,
        }),
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
        currentLinearVel +=
          Math.sign(targetLinear - currentLinearVel) * LINEAR_VEL_STEP_SIZE;
      } else {
        currentLinearVel = targetLinear;
      }

      if (Math.abs(currentAngularVel - targetAngular) > ANGULAR_VEL_STEP_SIZE) {
        currentAngularVel +=
          Math.sign(targetAngular - currentAngularVel) * ANGULAR_VEL_STEP_SIZE;
      } else {
        currentAngularVel = targetAngular;
      }

      sendVelocity(currentLinearVel, currentAngularVel);
    }

    // Button controls with enhanced touch support
    document.querySelectorAll(".control-btn").forEach((btn) => {
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
          btn.classList.add("pressed");
          switch (btn.id) {
            case "forward":
              pressedKeys.add("ArrowUp");
              break;
            case "left":
              pressedKeys.add("ArrowLeft");
              break;
            case "right":
              pressedKeys.add("ArrowRight");
              break;
            case "backward":
              pressedKeys.add("ArrowDown");
              break;
            case "stop":
              pressedKeys.clear();
              currentLinearVel = 0;
              currentAngularVel = 0;
              sendVelocity(10, 10);
              break;
          }
        }
      }

      function handleRelease() {
        if (isPressed) {
          isPressed = false;
          btn.classList.remove("pressed");
          switch (btn.id) {
            case "forward":
              pressedKeys.delete("ArrowUp");
              break;
            case "left":
              pressedKeys.delete("ArrowLeft");
              break;
            case "right":
              pressedKeys.delete("ArrowRight");
              break;
            case "backward":
              pressedKeys.delete("ArrowDown");
              break;
          }
        }
      }

      // Mouse events
      const mousedown = (e) => {
        e.preventDefault();
        startContinuousPress();
      };
      const mouseup = (e) => {
        e.preventDefault();
        stopContinuousPress();
      };
      const mouseleave = (e) => {
        e.preventDefault();
        stopContinuousPress();
      };
      const touchstart = (e) => {
        e.preventDefault();
        touchStartTime = Date.now();
        startContinuousPress();
      };
      const touchend = (e) => {
        e.preventDefault();
        stopContinuousPress();
      };
      const touchcancel = (e) => {
        e.preventDefault();
        stopContinuousPress();
      };
      const touchmove = (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target !== btn) stopContinuousPress();
      };

      btn.addEventListener("mousedown", mousedown);
      btn.addEventListener("mouseup", mouseup);
      btn.addEventListener("mouseleave", mouseleave);
      btn.addEventListener("touchstart", touchstart);
      btn.addEventListener("touchend", touchend);
      btn.addEventListener("touchcancel", touchcancel);
      btn.addEventListener("touchmove", touchmove);

      this.buttonCleanupFunctions.push(() => {
        btn.removeEventListener("mousedown", mousedown);
        btn.removeEventListener("mouseup", mouseup);
        btn.removeEventListener("mouseleave", mouseleave);
        btn.removeEventListener("touchstart", touchstart);
        btn.removeEventListener("touchend", touchend);
        btn.removeEventListener("touchcancel", touchcancel);
        btn.removeEventListener("touchmove", touchmove);
        if (pressInterval) clearInterval(pressInterval);
      });
    });

    // Keyboard controls remain the same
    const keyMap = {
      ArrowUp: "forward",
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowDown: "backward",
      z: "forward",
      q: "left",
      d: "right",
      s: "backward",
      " ": "stop",
    };

    // Store keyboard event handlers
    this.keyDownHandler = (event) => {
      if (keyMap[event.key]) {
        event.preventDefault();
        this.pressedKeys.add(event.key);
        const btn = document.getElementById(keyMap[event.key]);
        if (btn) btn.classList.add("pressed");
      }
    };

    this.keyUpHandler = (event) => {
      if (keyMap[event.key]) {
        event.preventDefault();
        this.pressedKeys.delete(event.key);
        const btn = document.getElementById(keyMap[event.key]);
        if (btn) btn.classList.remove("pressed");
      }
    };

    document.addEventListener("keydown", this.keyDownHandler);
    document.addEventListener("keyup", this.keyUpHandler);

    // Store update interval
    this.updateInterval = setInterval(() => {
      const forward =
        this.pressedKeys.has("ArrowUp") || this.pressedKeys.has("z");
      const left =
        this.pressedKeys.has("ArrowLeft") || this.pressedKeys.has("q");
      const right =
        this.pressedKeys.has("ArrowRight") || this.pressedKeys.has("d");
      const backward =
        this.pressedKeys.has("ArrowDown") || this.pressedKeys.has("s");

      updateVelocity(forward, left, right, backward);
    }, 50); // 20Hz update rate
  }
}
