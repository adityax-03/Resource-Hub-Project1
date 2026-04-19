import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * GPU-accelerated 3D particle background with mouse parallax.
 * Replaces all per-page <canvas> 2D backgrounds.
 */
export default function ThreeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    /* ── Scene ── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    /* ── Particles ── */
    const count = 600;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count * 3);

    const palette = [
      new THREE.Color("#6c3fff"),
      new THREE.Color("#ff4d1c"),
      new THREE.Color("#00d4c8"),
      new THREE.Color("#c8b8ff"),
      new THREE.Color("#ff1f5a"),
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 3 + 1;

      speeds[i * 3] = (Math.random() - 0.5) * 0.003;
      speeds[i * 3 + 1] = (Math.random() - 0.5) * 0.003;
      speeds[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    /* ── Custom shader for glow particles ── */
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          vec3 pos = position;
          pos.y += sin(uTime * 0.5 + position.x * 0.5) * 0.15;
          pos.x += cos(uTime * 0.3 + position.z * 0.4) * 0.1;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * uPixelRatio * (3.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;

          float dist = length(mvPosition.xyz);
          vAlpha = smoothstep(12.0, 2.0, dist) * 0.6;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float glow = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vColor, vAlpha * glow);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    /* ── Floating orb meshes for depth ── */
    const orbGeo = new THREE.SphereGeometry(1, 32, 32);

    const createOrb = (color, pos, scale) => {
      const orbMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.04,
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(...pos);
      orb.scale.setScalar(scale);
      scene.add(orb);
      return orb;
    };

    const orb1 = createOrb("#6c3fff", [-4, 2, -4], 3);
    const orb2 = createOrb("#ff4d1c", [3, -2, -3], 2.5);
    const orb3 = createOrb("#00d4c8", [0, 0, -5], 2);

    /* ── Mouse parallax ── */
    const mouse = { x: 0, y: 0 };
    const targetRotation = { x: 0, y: 0 };

    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    /* ── Resize ── */
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      mat.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    };
    window.addEventListener("resize", onResize);

    /* ── Animate ── */
    const clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      mat.uniforms.uTime.value = elapsed;

      // Move particles gently
      const posArr = geo.attributes.position.array;
      for (let i = 0; i < count; i++) {
        posArr[i * 3] += speeds[i * 3];
        posArr[i * 3 + 1] += speeds[i * 3 + 1];
        posArr[i * 3 + 2] += speeds[i * 3 + 2];

        // Wrap around
        if (posArr[i * 3] > 7) posArr[i * 3] = -7;
        if (posArr[i * 3] < -7) posArr[i * 3] = 7;
        if (posArr[i * 3 + 1] > 5) posArr[i * 3 + 1] = -5;
        if (posArr[i * 3 + 1] < -5) posArr[i * 3 + 1] = 5;
      }
      geo.attributes.position.needsUpdate = true;

      // Smooth parallax
      targetRotation.x += (mouse.y * 0.15 - targetRotation.x) * 0.04;
      targetRotation.y += (mouse.x * 0.15 - targetRotation.y) * 0.04;
      scene.rotation.x = targetRotation.x;
      scene.rotation.y = targetRotation.y;

      // Orb float
      orb1.position.y = 2 + Math.sin(elapsed * 0.4) * 0.6;
      orb2.position.y = -2 + Math.cos(elapsed * 0.35) * 0.5;
      orb3.position.x = Math.sin(elapsed * 0.25) * 1.5;

      renderer.render(scene, camera);
    };
    animate();

    /* ── Cleanup ── */
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
