const ControlMc = (function() {
  let isMobile = false;
  let isInitialized = false;
  let controlCallback = null;
  let joystickElement = null;
  let joystickPosition = { x: 0, y: 0 };
  let keyState = {
    w: false,
    s: false,
    a: false,
    d: false
  };

  function detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 800 && window.innerHeight <= 600);
  }

  function createJoystick() {
    const joystickSize = 120;
    const joystickColor = 'rgba(50, 50, 50, 0.5)';
    const position = { x: 100, y: 100 };
    
    const joystickContainer = document.createElement('div');
    joystickContainer.style.position = 'fixed';
    joystickContainer.style.width = `${joystickSize}px`;
    joystickContainer.style.height = `${joystickSize}px`;
    joystickContainer.style.borderRadius = '50%';
    joystickContainer.style.backgroundColor = joystickColor;
    joystickContainer.style.left = `${position.x}px`;
    joystickContainer.style.bottom = `${position.y}px`;
    joystickContainer.style.zIndex = '1000';
    joystickContainer.style.touchAction = 'none';
    
    const joystickKnob = document.createElement('div');
    joystickKnob.style.position = 'absolute';
    joystickKnob.style.width = `${joystickSize/2}px`;
    joystickKnob.style.height = `${joystickSize/2}px`;
    joystickKnob.style.borderRadius = '50%';
    joystickKnob.style.backgroundColor = 'rgba(200, 200, 200, 0.8)';
    joystickKnob.style.top = '50%';
    joystickKnob.style.left = '50%';
    joystickKnob.style.transform = 'translate(-50%, -50%)';
    
    joystickContainer.appendChild(joystickKnob);
    document.body.appendChild(joystickContainer);
    
    joystickElement = {
      container: joystickContainer,
      knob: joystickKnob,
      radius: joystickSize/2,
      active: false
    };
    
    joystickContainer.addEventListener('touchstart', handleJoystickStart);
    document.addEventListener('touchmove', handleJoystickMove);
    document.addEventListener('touchend', handleJoystickEnd);
    
    joystickContainer.addEventListener('mousedown', handleJoystickStart);
    document.addEventListener('mousemove', handleJoystickMove);
    document.addEventListener('mouseup', handleJoystickEnd);
  }
  
  function handleJoystickStart(e) {
    e.preventDefault();
    joystickElement.active = true;
  }
  
  function handleJoystickMove(e) {
    if (!joystickElement || !joystickElement.active) return;
    e.preventDefault();
    
    const touch = e.type.startsWith('touch') ? e.touches[0] : e;
    const containerRect = joystickElement.container.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width/2;
    const centerY = containerRect.top + containerRect.height/2;
    
    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    const distance = Math.min(joystickElement.radius, Math.sqrt(deltaX * deltaX + deltaY * deltaY));
    
    const angle = Math.atan2(deltaY, deltaX);
    
    const x = distance * Math.cos(angle);
    const y = distance * Math.sin(angle);
    
    joystickElement.knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    
    joystickPosition = {
      x: x / joystickElement.radius,
      y: y / joystickElement.radius
    };
    
    if (controlCallback) {
      controlCallback(joystickPosition);
    }
  }
  
  function handleJoystickEnd(e) {
    if (!joystickElement || !joystickElement.active) return;
    e.preventDefault();
    
    joystickElement.knob.style.transform = 'translate(-50%, -50%)';
    joystickElement.active = false;
    
    joystickPosition = { x: 0, y: 0 };
    
    if (controlCallback) {
      controlCallback(joystickPosition);
    }
  }
  
  function updateControlFromKeyboard() {
    
    const x = (keyState.d ? 1 : 0) - (keyState.a ? 1 : 0);
    
    const y = (keyState.s ? 1 : 0) - (keyState.w ? 1 : 0);
    
    if (controlCallback) {
      controlCallback({ x, y });
    }
  }
  
  function setupKeyboardControls() {
    document.addEventListener('keydown', function(e) {
      let keyChanged = false;
      
      switch(e.key.toLowerCase()) {
        case 'w':
          if (!keyState.w) {
            keyState.w = true;
            keyChanged = true;
          }
          break;
        case 's':
          if (!keyState.s) {
            keyState.s = true;
            keyChanged = true;
          }
          break;
        case 'a':
          if (!keyState.a) {
            keyState.a = true;
            keyChanged = true;
          }
          break;
        case 'd':
          if (!keyState.d) {
            keyState.d = true;
            keyChanged = true;
          }
          break;
      }
      
      if (keyChanged) {
        updateControlFromKeyboard();
      }
    });
    
    document.addEventListener('keyup', function(e) {
      let keyChanged = false;
      
      switch(e.key.toLowerCase()) {
        case 'w':
          if (keyState.w) {
            keyState.w = false;
            keyChanged = true;
          }
          break;
        case 's':
          if (keyState.s) {
            keyState.s = false;
            keyChanged = true;
          }
          break;
        case 'a':
          if (keyState.a) {
            keyState.a = false;
            keyChanged = true;
          }
          break;
        case 'd':
          if (keyState.d) {
            keyState.d = false;
            keyChanged = true;
          }
          break;
      }
      
      if (keyChanged) {
        updateControlFromKeyboard();
      }
    });
  }

  return {
    int: function() {
      if (isInitialized) return this;
      
      isMobile = detectMobile();
      
      if (isMobile) {
        createJoystick();
      }
      
      setupKeyboardControls();
      
      isInitialized = true;
      return this;
    },
    
    con: function(callback) {
      if (!isInitialized) {
        this.int();
      }
      
      controlCallback = callback;
      return this;
    },
    
    isMobile: function() {
      return isMobile;
    }
  };
})();

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = ControlMc;
} else {
  window.ControlMc = ControlMc;
}
