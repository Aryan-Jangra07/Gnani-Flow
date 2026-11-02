import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// A sphere of dots that ripples like it is speaking. Kept small on purpose.

const vertexShader = `
  uniform float uTime;
  uniform float uAmp;
  uniform float uSize;
  attribute float aSeed;
  varying float vLift;

  void main() {
    vec3 p = position;
    float t = uTime;
    float wave = sin(p.x * 3.1 + t * 1.2) * sin(p.y * 3.7 + t * 0.9) * sin(p.z * 2.9 + t * 1.5);
    float lift = wave * uAmp;
    vLift = lift;

    vec4 mv = modelViewMatrix * vec4(p * (1.0 + 0.16 * lift), 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.6 + aSeed * 0.8) / -mv.z;
  }
`;

const fragmentShader = `
  uniform vec3 uBase;
  uniform vec3 uHot;
  varying float vLift;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float heat = smoothstep(0.15, 0.7, vLift);
    vec3 color = mix(uBase, uHot, heat);
    float alpha = (1.0 - d * 2.0) * (0.35 + heat * 0.65);
    gl_FragColor = vec4(color, alpha);
  }
`;

function fibonacciSphere(count) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    positions.set([Math.cos(theta) * r, y, Math.sin(theta) * r], i * 3);
    seeds[i] = Math.random();
  }
  return { positions, seeds };
}

export default function VoiceOrb() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // no WebGL, the page still works without the orb
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20);
    camera.position.z = 4.2;

    const { positions, seeds } = fibonacciSphere(2600);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const uniforms = {
      uTime: { value: 0 },
      uAmp: { value: 0.6 },
      uSize: { value: 22 * renderer.getPixelRatio() },
      uBase: { value: new THREE.Color('#edebe4') },
      uHot: { value: new THREE.Color('#ff5b35') },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    });

    const orb = new THREE.Points(geometry, material);
    orb.rotation.x = 0.3;
    scene.add(orb);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const pointer = { x: 0, y: 0 };
    const onMove = (e) => {
      pointer.x = (e.clientX / innerWidth) * 2 - 1;
      pointer.y = (e.clientY / innerHeight) * 2 - 1;
    };
    addEventListener('pointermove', onMove);

    const clock = new THREE.Clock();
    let frame;

    const render = () => {
      const t = clock.getElapsedTime();
      uniforms.uTime.value = t;
      // rough "speech" envelope so it looks like it is talking, then pausing
      uniforms.uAmp.value = 0.35 + 0.65 * Math.abs(Math.sin(t * 2.3)) * Math.max(0, Math.sin(t * 0.6));

      orb.rotation.y = t * 0.12 + pointer.x * 0.25;
      orb.rotation.x += (0.3 + pointer.y * 0.2 - orb.rotation.x) * 0.05;

      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };

    if (reduceMotion) renderer.render(scene, camera);
    else render();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      removeEventListener('pointermove', onMove);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="orb3d" ref={mountRef} aria-hidden="true" />;
}
