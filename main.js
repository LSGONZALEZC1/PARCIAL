import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, controls;
let raycaster, mouse;
let particleSystem;
let fireworks = [];
let autoRotate = true;
let rotateTimeout;

// === INICIALIZACIÓN ===
init();
animate();

function init() {
  const container = document.getElementById('container');

  // === ESCENA ===
  scene = new THREE.Scene();

  // === FONDO ===
  const textureLoader = new THREE.TextureLoader();
  const backgroundTexture = textureLoader.load('img/fondoEstrellado.jpg');
  scene.background = backgroundTexture;

  // === CÁMARA ===
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(16, 12, 20);
  camera.lookAt(0, 1, 0);

  // === LUCES ===
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(10, 10, 10);
  scene.add(dirLight);

  // === RENDER ===
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // === CONTROLES ===
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 1, 0);

  // 👇 pausa la rotación cuando el usuario mueve la cámara
  controls.addEventListener('start', () => {
    autoRotate = false;
    clearTimeout(rotateTimeout);
    rotateTimeout = setTimeout(() => (autoRotate = true), 4000);
  });

  const loader = new GLTFLoader();

  // === PUNTOS GALÁCTICOS ===
  const particleCount = 1000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i++) positions[i] = (Math.random() - 0.5) * 250;
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const colors = [];
  for (let i = 0; i < particleCount; i++) {
    const color = new THREE.Color();
    color.setHSL(0.7 + Math.random() * 0.15, 1.0, 0.6 + Math.random() * 0.2);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1.0,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);

  // === OBJETOS GLB ===
  const glbs = [
    { path: 'glb/escenario.glb', pos: [0, 0, 0] },
    { path: 'glb/monitor.glb', pos: [-0.01, 0, -0.1] },
    { path: 'glb/mataua.glb', pos: [0, 0, 0] },
    { path: 'glb/ieee.glb', pos: [0, -0.000005, 0] },
    { path: 'glb/lienzo.glb', pos: [-0.4, -0.000005, -4], rotY: Math.PI / 6 },
    { path: 'glb/pastel.glb', pos: [0, -0.000005, 0] },
    { path: 'glb/cv.glb', pos: [-4, -0.000005, -3.8], rotY: Math.PI / 6 },
    { path: 'glb/libro.glb', pos: [4, -0.000005, -3], rotY: Math.PI / -8 }
  ];

  glbs.forEach(({ path, pos, rotY }) => {
    loader.load(path, (gltf) => {
      const obj = gltf.scene;
      obj.scale.set(1, 1, 1);
      obj.position.set(...pos);
      if (rotY) obj.rotation.y = rotY;
      scene.add(obj);
    });
  });

  // === ICONOS INFO ===
  const infos = [
    { name: "info_monitor", pos: [10.2, -6.1, -16] },
    { name: "info_mataua", pos: [-6, -5.8, -14.5], rotY: Math.PI / 8 },
    { name: "info_ieee", pos: [0, -9.92, -10] },
    { name: "info_lago", pos: [8.5, -9.92, -5.2], rotY: Math.PI / -5.5 },
    { name: "info_lienzo", pos: [-14, -9.92, -6.2], rotY: -Math.PI / -4 },
    { name: "info_pastel", pos: [15, -9.92, -6.2], rotY: Math.PI / -6 },
    { name: "info_cv", pos: [-6, -9.92, 1] },
    { name: "info_libro", pos: [10, -9.92, 2.5] }
  ];

  infos.forEach(({ name, pos, rotY }) => {
    loader.load('glb/info.glb', (gltf) => {
      const info = gltf.scene;
      info.scale.set(1, 1, 1);
      info.position.set(...pos);
      if (rotY) info.rotation.y = rotY;
      info.traverse((child) => {
        if (child.isMesh) child.name = name;
      });
      scene.add(info);
    });
  });

  // === INTERACCIÓN ===
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  window.addEventListener('click', onClick);
  window.addEventListener('resize', onWindowResize);
}

// === CLICK SOBRE ICONOS INFO ===
function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const obj = intersects[0].object;
    if (obj.name.startsWith("info_")) {
      const textos = {
        info_monitor: "Actualmente me encuentro estudiando Ing. Sistemas & Ing. Multimedia en la Universidad de San Buenaventura en Cali.",
        info_mataua: "MATAUA - Es un movimiento juvenil en donde se realizan campos de verano, y se busca acercar a jóvenes y adultos a Dios. He tenido la oportunidad de convertirme en líder y ser parte de varios campos de verano desde el 2024-2.",
        info_ieee: "Evento IEEE - En septiembre del 2024 participé del CONESCAPAN 2024 en Panamá, donde tuve la oportunidad de presentar un trabajo de ingeniería y tecnología.",
        info_lago: "Espacios naturales me llenan de tranquilidad y me inspiran a crear. Este lago representa mi conexión con la naturaleza y mi amor por la exploración al aire libre.",
        info_lienzo: "Amo la pintura y todo lo relacionado con el arte y manualidades. Este lienzo representa mi pasión por la creatividad y la expresión artística.",
        info_pastel: "Este pastel representa mi amor por la repostería y la cocina creativa. Disfruto experimentar con sabores y técnicas para crear deliciosas obras de arte comestibles.",
        info_cv: "Hoja de Vida, aquí podrás conocer un poco sobre mi trayectoria estudiantil y logros alcanzados.",
        info_libro: "Este libro representa un poco de mi vida. Podrás conocer mis aventuras, aprendizajes y momentos significativos que han moldeado quién soy hoy."
      };

      mostrarInfo(textos[obj.name], obj.name); // 👈 le paso también el nombre
      crearFuegoArtificial(intersects[0].point);
    }
  }
}

// === FUEGOS ARTIFICIALES ===
function crearFuegoArtificial(pos) {
  const count = 150;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = [];
  const colors = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.2 + Math.random() * 0.4;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const vz = (Math.random() - 0.5) * speed;
    velocities.push({ vx, vy, vz });
    positions[i * 3] = pos.x;
    positions[i * 3 + 1] = pos.y;
    positions[i * 3 + 2] = pos.z;

    const color = new THREE.Color();
    color.setHSL(Math.random(), 1.0, 0.6);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.8,
    vertexColors: true,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending
  });

  const firework = new THREE.Points(geometry, material);
  scene.add(firework);

  fireworks.push({ mesh: firework, velocities, life: 1.0 });
}

// === MOSTRAR INFO NORMAL (solo X o con botón extra en CV e IEEE) ===
function mostrarInfo(texto, nombre = "") {
  const infoBox = document.getElementById('infoBox');
  const infoText = document.getElementById('infoText');
  const avatar = document.getElementById('avatarImg');
  const blurOverlay = document.getElementById('blurOverlay');

  infoText.innerHTML = texto;
  infoBox.style.display = 'flex';
  avatar.style.display = 'block';
  blurOverlay.style.display = 'block';

  // 👇 elimina botón anterior (si quedó alguno)
  const oldBtn = infoBox.querySelectorAll('.cvBtn');
  oldBtn.forEach(btn => btn.remove());

  // 👇 Botón para "CV"
  if (nombre === "info_cv") {
    const cvBtn = document.createElement('button');
    cvBtn.textContent = "Ver hoja de vida";
    cvBtn.className = "cvBtn";
    cvBtn.style.marginTop = "12px";
    cvBtn.style.padding = "8px 14px";
    cvBtn.style.border = "none";
    cvBtn.style.borderRadius = "8px";
    cvBtn.style.background = "#2e8b57";
    cvBtn.style.color = "white";
    cvBtn.style.cursor = "pointer";
    cvBtn.style.alignSelf = "center";

    cvBtn.onclick = () => {
      window.open("Hoja de Vida.pdf", "_blank");
    };

    infoBox.appendChild(cvBtn);
  }

  // 👇 NUEVO: Botones para "IEEE"
  if (nombre === "info_ieee") {
    // --- Botón 1: Ver artículo ---
    const paperBtn = document.createElement('button');
    paperBtn.textContent = "Ver artículo";
    paperBtn.className = "cvBtn";
    paperBtn.style.marginTop = "12px";
    paperBtn.style.padding = "8px 14px";
    paperBtn.style.border = "none";
    paperBtn.style.borderRadius = "8px";
    paperBtn.style.background = "#2e8b57";
    paperBtn.style.color = "white";
    paperBtn.style.cursor = "pointer";
    paperBtn.style.alignSelf = "center";
    paperBtn.onclick = () => {
      window.open("https://ieeexplore.ieee.org/document/10891076/", "_blank");
    };

    // --- Botón 2: Ver foto ---
    const fotoBtn = document.createElement('button');
    fotoBtn.textContent = "Ver foto";
    fotoBtn.className = "cvBtn";
    fotoBtn.style.marginTop = "8px";
    fotoBtn.style.padding = "8px 14px";
    fotoBtn.style.border = "none";
    fotoBtn.style.borderRadius = "8px";
    fotoBtn.style.background = "#2e8b57";
    fotoBtn.style.color = "white";
    fotoBtn.style.cursor = "pointer";
    fotoBtn.style.alignSelf = "center";

    fotoBtn.onclick = () => {
      const overlay = document.createElement('div');
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.background = "rgba(0,0,0,0.8)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.zIndex = "999";

      const img = document.createElement('img');
      img.src = "img/fotosIEEE.png";
      img.style.maxWidth = "80%";
      img.style.maxHeight = "80%";
      img.style.borderRadius = "12px";
      img.style.boxShadow = "0 0 25px rgba(255,255,255,0.3)";
      overlay.appendChild(img);

      overlay.addEventListener("click", () => document.body.removeChild(overlay));
      document.body.appendChild(overlay);
    };

    infoBox.appendChild(paperBtn);
    infoBox.appendChild(fotoBtn);
  }

  // 👇 NUEVO: Botón para "Pastel"
  if (nombre === "info_pastel") {
    const fotoBtn = document.createElement('button');
    fotoBtn.textContent = "Ver foto";
    fotoBtn.className = "cvBtn";
    fotoBtn.style.marginTop = "12px";
    fotoBtn.style.padding = "8px 14px";
    fotoBtn.style.border = "none";
    fotoBtn.style.borderRadius = "8px";
    fotoBtn.style.background = "#2e8b57";
    fotoBtn.style.color = "white";
    fotoBtn.style.cursor = "pointer";
    fotoBtn.style.alignSelf = "center";

    fotoBtn.onclick = () => {
      const overlay = document.createElement('div');
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.background = "rgba(0,0,0,0.8)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.zIndex = "999";

      const img = document.createElement('img');
      img.src = "img/fotosCocina.png";
      img.style.maxWidth = "80%";
      img.style.maxHeight = "80%";
      img.style.borderRadius = "12px";
      img.style.boxShadow = "0 0 25px rgba(255,255,255,0.3)";
      overlay.appendChild(img);

      overlay.addEventListener("click", () => document.body.removeChild(overlay));
      document.body.appendChild(overlay);
    };

    infoBox.appendChild(fotoBtn);
  }

  // 👇 NUEVO: Botón para "Mataua"
  if (nombre === "info_mataua") {
    const fotoBtn = document.createElement('button');
    fotoBtn.textContent = "Ver foto";
    fotoBtn.className = "cvBtn";
    fotoBtn.style.marginTop = "12px";
    fotoBtn.style.padding = "8px 14px";
    fotoBtn.style.border = "none";
    fotoBtn.style.borderRadius = "8px";
    fotoBtn.style.background = "#2e8b57";
    fotoBtn.style.color = "white";
    fotoBtn.style.cursor = "pointer";
    fotoBtn.style.alignSelf = "center";

    fotoBtn.onclick = () => {
      const overlay = document.createElement('div');
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.background = "rgba(0,0,0,0.8)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.zIndex = "999";

      const img = document.createElement('img');
      img.src = "img/fotosMataua.png";
      img.style.maxWidth = "80%";
      img.style.maxHeight = "80%";
      img.style.borderRadius = "12px";
      img.style.boxShadow = "0 0 25px rgba(255,255,255,0.3)";
      overlay.appendChild(img);

      overlay.addEventListener("click", () => document.body.removeChild(overlay));
      document.body.appendChild(overlay);
    };

    infoBox.appendChild(fotoBtn);
  }

  // Botón para "Libro" - Galería
  if (nombre === "info_libro") {
    const galeriaBtn = document.createElement('button');
    galeriaBtn.textContent = "Ver fotos";
    galeriaBtn.className = "cvBtn";
    galeriaBtn.style.marginTop = "12px";
    galeriaBtn.style.padding = "8px 14px";
    galeriaBtn.style.border = "none";
    galeriaBtn.style.borderRadius = "8px";
    galeriaBtn.style.background = "#2e8b57";
    galeriaBtn.style.color = "white";
    galeriaBtn.style.cursor = "pointer";
    galeriaBtn.style.alignSelf = "center";

    galeriaBtn.onclick = () => abrirGaleriaLibro();
    infoBox.appendChild(galeriaBtn);
  }

  const closeBtn = infoBox.querySelector('.closeBtn');
  closeBtn.onclick = () => {
    infoBox.style.display = 'none';
    avatar.style.display = 'none';
    blurOverlay.style.display = 'none';
  };
}

function abrirGaleriaLibro() {
  const fotos = [
    { src: "img/fotosPeque.png", titulo: "Fotos pequeñas", descripcion: "Recuerdos de mi infancia y momentos divertidos." },
    { src: "img/fotosActual.png", titulo: "Fotos actuales", descripcion: "Cómo luzco actualmente y mis paseos recientes." },
    { src: "img/fotosAmigos.png", titulo: "Fotos con amigos", descripcion: "Momentos divertidos e inolvidables con mis amigos." },
    { src: "img/fotosFamilia.png", titulo: "Fotos con familia", descripcion: "Tiempo de calidad con mis seres queridos." }
  ];

  let index = 0;

  // Overlay
  const overlay = document.createElement('div');
  overlay.classList.add("galeria-overlay");

  // Título
  const titulo = document.createElement('h2');
  titulo.classList.add("galeria-titulo");
  titulo.textContent = fotos[index].titulo;
  overlay.appendChild(titulo);

  // Imagen
  const img = document.createElement('img');
  img.classList.add("galeria-img");
  img.src = fotos[index].src;
  overlay.appendChild(img);

  // Descripción
  const desc = document.createElement('p');
  desc.classList.add("galeria-descripcion");
  desc.textContent = fotos[index].descripcion;
  overlay.appendChild(desc);

  // Controles
  const controls = document.createElement('div');
  controls.classList.add("galeria-controls");

  const prev = document.createElement('button');
  prev.textContent = "◀";
  const next = document.createElement('button');
  next.textContent = "▶";

  prev.classList.add("galeria-btn");
  next.classList.add("galeria-btn");

  prev.onclick = () => {
    index = (index - 1 + fotos.length) % fotos.length;
    img.src = fotos[index].src;
    titulo.textContent = fotos[index].titulo;
    desc.textContent = fotos[index].descripcion;
  };

  next.onclick = () => {
    index = (index + 1) % fotos.length;
    img.src = fotos[index].src;
    titulo.textContent = fotos[index].titulo;
    desc.textContent = fotos[index].descripcion;
  };

  controls.appendChild(prev);
  controls.appendChild(next);
  overlay.appendChild(controls);

  // Botón cerrar
  const cerrar = document.createElement('button');
  cerrar.classList.add("galeria-cerrar");
  cerrar.textContent = "✖";
  cerrar.onclick = () => document.body.removeChild(overlay);
  overlay.appendChild(cerrar);

  document.body.appendChild(overlay);
}

// === REDIMENSIÓN ===
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// === ANIMACIÓN ===
function animate() {
  requestAnimationFrame(animate);

  if (autoRotate) {
    const speed = 0.0015;
    scene.rotation.y += speed;
  }

  if (particleSystem) {
    particleSystem.rotation.y += 0.0004;
    particleSystem.rotation.x += 0.00015;
  }

  fireworks.forEach((fw, i) => {
    const pos = fw.mesh.geometry.attributes.position;
    for (let j = 0; j < pos.count; j++) {
      const v = fw.velocities[j];
      pos.array[j * 3] += v.vx;
      pos.array[j * 3 + 1] += v.vy;
      pos.array[j * 3 + 2] += v.vz;
      v.vy -= 0.01;
    }
    pos.needsUpdate = true;
    fw.mesh.material.opacity -= 0.02;
    if (fw.mesh.material.opacity <= 0) {
      scene.remove(fw.mesh);
      fireworks.splice(i, 1);
    }
  });

  controls.update();
  renderer.render(scene, camera);
}

/* 🌟 === BIENVENIDA SOLO AL INICIO === */
window.addEventListener('load', () => {
  const dialogOverlay = document.getElementById('dialogOverlay');
  const dialogBox = document.getElementById('dialogBox');
  const startBtn = document.getElementById('startBtn');

  // Mostrar el cuadro de bienvenida con fondo borroso
  setTimeout(() => {
    dialogOverlay.style.display = 'block';
    dialogBox.style.display = 'block';
  }, 500);

  // cuando el usuario hace clic en "Comenzar recorrido"
  startBtn.addEventListener('click', () => {
    dialogOverlay.style.display = 'none';
    dialogBox.style.display = 'none';
  });
});

/* 🎵 === MINI PLAYLIST DE MÚSICA === */

// Obtener los elementos existentes del HTML
const audioPlayer = document.getElementById('audioPlayer');
const playlistItems = document.querySelectorAll('#playlist li');

// Reproducir canción seleccionada
playlistItems.forEach(item => {
  item.addEventListener('click', () => {
    playlistItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    audioPlayer.src = item.dataset.src;
    audioPlayer.play();
  });
});

// Autoplay siguiente canción al terminar
let currentIndex = 0;
audioPlayer.addEventListener('ended', () => {
  currentIndex = (currentIndex + 1) % playlistItems.length;
  const next = playlistItems[currentIndex];
  next.click();
});

/* 🎛️ === MOSTRAR / OCULTAR PLAYLIST === */
const toggleBtn = document.getElementById('togglePlaylist');
const musicPlayerBox = document.querySelector('.music-player');

toggleBtn.addEventListener('click', () => {
  musicPlayerBox.classList.toggle('collapsed');
});
