import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const canvas = document.getElementById('fondo');
const scene = new THREE.Scene();

// CÁMARA 
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 5;

// RENDERIZADOR
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0); // Fondo transparente (para ver la imagen del CSS)
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// FONDO DE PARTÍCULAS SUAVES
const geometry = new THREE.BufferGeometry();
const count = 1500;
const positions = new Float32Array(count * 3);
for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 20;
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
  color: 0x7d5dfc,
  size: 0.04,
  transparent: true,
  opacity: 0.7,
  blending: THREE.AdditiveBlending
});
const particles = new THREE.Points(geometry, material);
scene.add(particles);

// AURORA TRAIL (colita de luz del mouse)
const vertexShader = `
  attribute float alpha;
  varying float vAlpha;
  void main() {
    vAlpha = alpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 1.5 * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying float vAlpha;
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    float fade = smoothstep(0.6, 0.0, dist);
    vec3 color = mix(vec3(0.2, 0.7, 1.0), vec3(0.6, 0.3, 1.0), dist);
    gl_FragColor = vec4(color, fade * vAlpha);
  }
`;

const auroraMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const auroraGeometry = new THREE.BufferGeometry();
let auroraPoints = [];
let alphas = [];
const auroraMesh = new THREE.Points(auroraGeometry, auroraMaterial);
scene.add(auroraMesh);

// CONFIGURACIÓN DE LAS PARTÍCULAS 
const trailLifetime = 500; // milisegundos
const maxTrail = 150; // cantidad máxima

// SEGUIMIENTO DEL MOUSE 
window.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth) * 2 - 1;
  const y = -(e.clientY / window.innerHeight) * 2 + 1;

  const vector = new THREE.Vector3(x, y, 0);
  vector.unproject(camera);
  const dir = vector.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  const pos = camera.position.clone().add(dir.multiplyScalar(distance));

  auroraPoints.push({ position: pos, created: performance.now(), alpha: 1.0 });
  if (auroraPoints.length > maxTrail) auroraPoints.shift();
});

// ACTUALIZAR ESTELA 
function updateAurora() {
  const now = performance.now();

  auroraPoints = auroraPoints.filter(p => {
    const age = now - p.created;
    p.alpha = 1.0 - (age / trailLifetime);
    return p.alpha > 0;
  });

  const positions = new Float32Array(auroraPoints.length * 3);
  alphas = new Float32Array(auroraPoints.length);

  auroraPoints.forEach((p, i) => {
    positions[i * 3] = p.position.x;
    positions[i * 3 + 1] = p.position.y;
    positions[i * 3 + 2] = p.position.z;
    alphas[i] = p.alpha;
  });

  auroraGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  auroraGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
}

// EFECTO DE DESTELLOS AL HACER CLIC 
function createSparkBurst(x, y) {
  const geometry = new THREE.BufferGeometry();
  const numParticles = 40;
  const positions = new Float32Array(numParticles * 3);
  const velocities = [];

  for (let i = 0; i < numParticles; i++) {
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = 0;
    velocities.push(
      new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      )
    );
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x51D1F6,
    size: 0.06,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending
  });

  const spark = new THREE.Points(geometry, material);
  scene.add(spark);

  let life = 0;
  const maxLife = 60; // duración en frames 

  function updateSpark() {
    life++;
    const positions = spark.geometry.attributes.position.array;

    for (let i = 0; i < numParticles; i++) {
      positions[i * 3] += velocities[i].x;
      positions[i * 3 + 1] += velocities[i].y;
      positions[i * 3 + 2] += velocities[i].z;
    }

    spark.geometry.attributes.position.needsUpdate = true;
    material.opacity = 1 - life / maxLife;

    if (life < maxLife) {
      requestAnimationFrame(updateSpark);
    } else {
      scene.remove(spark);
    }
  }

  updateSpark();
}

// EVENTO DE CLIC (para crear los destellos) 
window.addEventListener('click', (e) => {
  const x = (e.clientX / window.innerWidth) * 2 - 1;
  const y = -(e.clientY / window.innerHeight) * 2 + 1;

  const vector = new THREE.Vector3(x, y, 0);
  vector.unproject(camera);
  const dir = vector.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  const pos = camera.position.clone().add(dir.multiplyScalar(distance));

  createSparkBurst(pos.x, pos.y);
});

// ANIMACIÓN PRINCIPAL 
function animate() {
  requestAnimationFrame(animate);
  particles.rotation.y += 0.0006;
  particles.rotation.x += 0.0002;

  updateAurora();
  renderer.render(scene, camera);
}
animate();

// AJUSTE RESPONSIVO 
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// BOTÓN DE ENTRADA 
const entrarBtn = document.getElementById('entrarBtn');
entrarBtn.addEventListener('click', () => {
  document.body.style.transition = 'opacity 0.8s ease';
  document.body.style.opacity = '0';

  setTimeout(() => {
    window.location.href = 'index.html';
  }, 800);
});

// AVATAR Y CUADRO DE BIENVENIDA 
const avatarInicio = document.getElementById('avatarInicio');
const welcomeBox = document.getElementById('welcomeBox');
const welcomeOverlay = document.getElementById('welcomeOverlay');

avatarInicio.addEventListener('click', (e) => {
  e.stopPropagation(); 
  welcomeBox.style.display = 'block';
  welcomeOverlay.style.display = 'block';
});

// Cerrar al hacer clic en overlay o fuera del cuadro
welcomeOverlay.addEventListener('click', () => {
  welcomeBox.style.display = 'none';
  welcomeOverlay.style.display = 'none';
});

welcomeBox.addEventListener('click', (e) => {
  e.stopPropagation();
});
