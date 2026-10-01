const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
const quoteForm = document.querySelector('#quote-form');
const quoteService = document.querySelector('#quote-service');
const quoteStatus = document.querySelector('#quote-status');

if (menuToggle && navigation) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    navigation.classList.toggle('is-open', !isOpen);
  });

  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      navigation.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
    }
  });
}

document.querySelectorAll('[data-service-request]').forEach((link) => {
  link.addEventListener('click', () => {
    if (quoteService) quoteService.value = link.dataset.serviceRequest;
  });
});

if (quoteForm) {
  quoteForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = new FormData(quoteForm);
    const details = [
      'Hello Majestic, I would like a quote.',
      `Name: ${values.get('name')}`,
      `Phone: ${values.get('phone')}`,
      `Service: ${values.get('service')}`,
      `Pickup and delivery: ${values.get('route')}`,
      `Cargo and timing: ${values.get('details') || 'Not provided'}`,
    ].join('\n');
    const whatsappUrl = `https://wa.me/27694989914?text=${encodeURIComponent(details)}`;
    const whatsappWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    if (whatsappWindow) {
      quoteStatus.textContent = 'Your quote request is ready in WhatsApp. Review it and press Send.';
    } else {
      quoteStatus.innerHTML = `Pop-up blocked. <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">Open your prepared WhatsApp message</a>.`;
    }
  });
}

const stage = document.querySelector('[data-three-scene]');

async function startThreeScene() {
  if (!stage) return;

  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');
    const canvas = stage.querySelector('.scene-canvas');
    const fallback = stage.querySelector('.scene-fallback');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    const group = new THREE.Group();
    const targetRotation = new THREE.Vector2();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frame = new THREE.Mesh(
      new THREE.PlaneGeometry(1.025, 1.035),
      new THREE.MeshBasicMaterial({ color: 0x05090d }),
    );
    let imagePlane;
    let texture;

    camera.position.z = 6;
    frame.position.z = -0.045;
    group.add(frame);
    scene.add(group);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    function resizeScene() {
      const width = stage.clientWidth;
      const height = stage.clientHeight;

      if (!width || !height) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);

      if (!imagePlane || !texture) return;

      const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      const visibleWidth = visibleHeight * camera.aspect;
      const viewportAspect = width / height;
      const imageAspect = texture.image.width / texture.image.height;
      const planeWidth = visibleWidth * 1.12;
      const planeHeight = visibleHeight * 1.12;

      imagePlane.scale.set(planeWidth, planeHeight, 1);
      frame.scale.set(planeWidth * 1.018, planeHeight * 1.025, 1);

      texture.repeat.set(1, 1);
      if (viewportAspect > imageAspect) {
        texture.repeat.y = imageAspect / viewportAspect;
      } else {
        texture.repeat.x = viewportAspect / imageAspect;
      }
      texture.offset.set((1 - texture.repeat.x) / 2, (1 - texture.repeat.y) / 2);
      texture.needsUpdate = true;
    }

    new THREE.TextureLoader().load(
      'majestic-truck.png',
      (loadedTexture) => {
        texture = loadedTexture;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        imagePlane = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 1, 32, 20),
          new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
        );
        imagePlane.position.z = 0.01;
        group.add(imagePlane);
        fallback.hidden = true;
        canvas.classList.add('is-ready');
        resizeScene();
      },
      undefined,
      () => stage.classList.add('scene-failed'),
    );

    stage.addEventListener('pointermove', (event) => {
      const bounds = stage.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      const y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      targetRotation.set(y * 0.018, x * 0.026);
    });
    stage.addEventListener('pointerleave', () => targetRotation.set(0, 0));
    new ResizeObserver(resizeScene).observe(stage);

    function render(time) {
      group.rotation.x += (targetRotation.x - group.rotation.x) * 0.045;
      group.rotation.y += (targetRotation.y - group.rotation.y) * 0.045;
      group.position.y = reducedMotion ? 0 : Math.sin(time * 0.00035) * 0.012;
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  } catch {
    stage.classList.add('scene-failed');
  }
}

startThreeScene();
