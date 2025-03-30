const scene = lib3d.Scene("game-container");

scene.createWorld({ width: 32, depth: 32, heightScale: 8 });

const player = lib3d.player(scene, { x: 0, y: 10, z: 5 });
