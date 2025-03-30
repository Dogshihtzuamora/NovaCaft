const noise = new Noise(Math.random());

const lib3d = {
  Scene: function(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const chunks = new Map();
    const chunkSize = 16;
    const gravity = 0.002;
    const world = {
      floorLevel: -0.5,
      gravity: gravity,
      playerHeight: 1.6,
      playerRadius: 0.3,
      blockTypes: {
        grass: { color: 0x4CAF50 },
        dirt: { color: 0x795548 },
        stone: { color: 0x9E9E9E },
        water: { color: 0x2196F3, transparent: true, opacity: 0.7 }
      }
    };

    let camera;

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }

    function checkCollisions(position) {
      const playerBox = new THREE.Box3(
        new THREE.Vector3(position.x - world.playerRadius, position.y - world.playerHeight / 2, position.z - world.playerRadius),
        new THREE.Vector3(position.x + world.playerRadius, position.y + world.playerHeight / 2, position.z + world.playerRadius)
      );

      const chunkX = Math.floor(position.x / chunkSize);
      const chunkZ = Math.floor(position.z / chunkSize);
      
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const chunk = chunks.get(`${chunkX + dx}_${chunkZ + dz}`);
          if (chunk) {
            const blockBox = new THREE.Box3().setFromObject(chunk);
            if (playerBox.intersectsBox(blockBox)) return true;
          }
        }
      }
      return false;
    }

    function createWorld(options = {}) {
      const { width = 32, depth = 32, heightScale = 8, waterLevel = 3, seed = Math.random() } = options;
      noise.seed(seed);

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const materials = {};
      Object.keys(world.blockTypes).forEach(type => {
        const props = world.blockTypes[type];
        materials[type] = new THREE.MeshBasicMaterial(props.transparent ? 
          { color: props.color, transparent: true, opacity: props.opacity } : 
          { color: props.color });
      });

      for (let x = 0; x < width; x += chunkSize) {
        for (let z = 0; z < depth; z += chunkSize) {
          const chunk = new THREE.Group();
          for (let cx = x; cx < Math.min(x + chunkSize, width); cx++) {
            for (let cz = z; cz < Math.min(z + chunkSize, depth); cz++) {
              const nx = cx / width - 0.5;
              const nz = cz / depth - 0.5;
              let elevation = noise.simplex2(nx * 3, nz * 3);
              elevation = (elevation + 1) * 0.5 * heightScale;
              const y = Math.floor(elevation);

              for (let currentY = 0; currentY <= y; currentY++) {
                const blockType = currentY === y ? 'grass' : 
                                currentY > y - 3 ? 'dirt' : 'stone';
                const block = new THREE.Mesh(geometry, materials[blockType]);
                block.position.set(cx - width/2, currentY, cz - depth/2);
                chunk.add(block);
              }

              if (y < waterLevel) {
                for (let currentY = y + 1; currentY <= waterLevel; currentY++) {
                  const block = new THREE.Mesh(geometry, materials.water);
                  block.position.set(cx - width/2, currentY, cz - depth/2);
                  chunk.add(block);
                }
              }
            }
          }
          scene.add(chunk);
          chunks.set(`${Math.floor(x/chunkSize)}_${Math.floor(z/chunkSize)}`, chunk);
        }
      }
    }

    return {
      createBlock: function(config) {
        const material = world.blockTypes[config.name]?.transparent ?
          new THREE.MeshBasicMaterial({ color: config.color, transparent: true, opacity: world.blockTypes[config.name].opacity }) :
          new THREE.MeshBasicMaterial({ color: config.color });
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const block = new THREE.Mesh(geometry, material);
        block.position.set(config.x, config.y, config.z);
        block.userData = { id: config.id, name: config.name };
        scene.add(block);
      },
      setCamera: function(cam) {
        camera = cam;
        animate();
      },
      getWorld: function() { return world; },
      getChunks: function() { return chunks; },
      checkCollisions: checkCollisions,
      getScene: function() { return scene; },
      createWorld: createWorld
    };
  },

  player: function(scene, config = {}) {
    const finalConfig = { 
      x: 0, y: 1.6, z: 0, speed: 0.1, 
      lookAt: { x: 0, y: 1.6, z: -1 }, 
      ...config 
    };

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(finalConfig.x, finalConfig.y, finalConfig.z);
    camera.lookAt(new THREE.Vector3(finalConfig.lookAt.x, finalConfig.lookAt.y, finalConfig.lookAt.z));

    const player = {
      speed: finalConfig.speed,
      position: camera.position,
      rotation: camera.rotation,
      jumpForce: 0.15,
      isJumping: false
    };

    ControlMc.int();
    ControlMc.con(function(position) {
      player.position.x += position.x * player.speed;
      player.position.z += position.y * player.speed;
    });

    scene.setCamera(camera);
    return player;
  }
};

