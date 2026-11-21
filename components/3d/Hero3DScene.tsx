"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Sparkles, Code2, Palette, Repeat, ArrowRight, ArrowLeft } from "lucide-react";

export function Hero3DScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);
  const [activeSkill, setActiveSkill] = useState<string>("all");
  const [hoveredNode, setHoveredNode] = useState<"maya" | "liam" | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement("canvas");
      const gl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
      if (!gl) {
        setWebGLSupported(false);
        return;
      }
    } catch {
      setWebGLSupported(false);
      return;
    }

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Dynamic Theme Detection
    const isDark = () => document.documentElement.classList.contains("dark");

    // Lighting
    const ambientLight = new THREE.AmbientLight(
      isDark() ? 0x6366f1 : 0x818cf8,
      isDark() ? 1.4 : 1.8
    );
    scene.add(ambientLight);

    const pointLightIndigo = new THREE.PointLight(0x6366f1, 3.5, 30);
    pointLightIndigo.position.set(-5, 4, 6);
    scene.add(pointLightIndigo);

    const pointLightAmber = new THREE.PointLight(0xf59e0b, 3.0, 30);
    pointLightAmber.position.set(5, -4, 6);
    scene.add(pointLightAmber);

    const pointLightViolet = new THREE.PointLight(0xa855f7, 2.8, 30);
    pointLightViolet.position.set(0, 0, 4);
    scene.add(pointLightViolet);

    // ==========================================
    // 1. LEARNER NODES (Maya & Liam)
    // ==========================================
    const createLearnerNode = (colorHex: number, position: THREE.Vector3) => {
      const group = new THREE.Group();
      group.position.copy(position);

      // Core faceted icosahedron
      const coreGeo = new THREE.IcosahedronGeometry(0.85, 1);
      const coreMat = new THREE.MeshPhysicalMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.35,
        roughness: 0.15,
        metalness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transparent: true,
        opacity: 0.88,
        wireframe: false,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      group.add(coreMesh);

      // Outer delicate wireframe cage
      const wireGeo = new THREE.IcosahedronGeometry(1.15, 1);
      const wireMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        wireframe: true,
        transparent: true,
        opacity: 0.4,
      });
      const wireMesh = new THREE.Mesh(wireGeo, wireMat);
      group.add(wireMesh);

      // Orbital halo ring
      const ringGeo = new THREE.TorusGeometry(1.4, 0.025, 16, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.6,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 3;
      group.add(ringMesh);

      scene.add(group);
      return { group, coreMesh, wireMesh, ringMesh };
    };

    const nodeMaya = createLearnerNode(0x4f46e5, new THREE.Vector3(-3.4, 0.4, 0.6));
    const nodeLiam = createLearnerNode(0x8b5cf6, new THREE.Vector3(3.4, -0.4, -0.6));

    // ==========================================
    // 2. CENTRAL EXCHANGE NUCLEUS
    // ==========================================
    const centralGroup = new THREE.Group();
    centralGroup.position.set(0, 0, 0);

    const centralGeo = new THREE.OctahedronGeometry(0.65, 2);
    const centralMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.8,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.9,
    });
    const centralMesh = new THREE.Mesh(centralGeo, centralMat);
    centralGroup.add(centralMesh);

    // Double intersecting torus rings around central nexus
    const torusGeo1 = new THREE.TorusGeometry(1.05, 0.02, 16, 64);
    const torusMat1 = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.7,
    });
    const torusMesh1 = new THREE.Mesh(torusGeo1, torusMat1);
    centralGroup.add(torusMesh1);

    const torusGeo2 = new THREE.TorusGeometry(1.2, 0.02, 16, 64);
    const torusMat2 = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.6,
    });
    const torusMesh2 = new THREE.Mesh(torusGeo2, torusMat2);
    torusMesh2.rotation.y = Math.PI / 2;
    centralGroup.add(torusMesh2);

    scene.add(centralGroup);

    // ==========================================
    // 3. CURVED 3D ENERGY TRANSFER PATHS
    // ==========================================
    // Path A: Maya -> Liam (Arches upwards & forward)
    const curvePointsA = [
      new THREE.Vector3(-3.4, 0.4, 0.6),
      new THREE.Vector3(-1.7, 1.8, 1.2),
      new THREE.Vector3(0, 0.6, 0.8),
      new THREE.Vector3(1.7, -0.2, 0.3),
      new THREE.Vector3(3.4, -0.4, -0.6),
    ];
    const curveA = new THREE.CatmullRomCurve3(curvePointsA);

    // Path B: Liam -> Maya (Arches downwards & backward)
    const curvePointsB = [
      new THREE.Vector3(3.4, -0.4, -0.6),
      new THREE.Vector3(1.7, -1.8, -1.0),
      new THREE.Vector3(0, -0.6, -0.5),
      new THREE.Vector3(-1.7, 0.2, -0.1),
      new THREE.Vector3(-3.4, 0.4, 0.6),
    ];
    const curveB = new THREE.CatmullRomCurve3(curvePointsB);

    // Render path glow ribbons
    const tubeGeoA = new THREE.TubeGeometry(curveA, 80, 0.035, 8, false);
    const tubeMatA = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.45,
    });
    const tubeMeshA = new THREE.Mesh(tubeGeoA, tubeMatA);
    scene.add(tubeMeshA);

    const tubeGeoB = new THREE.TubeGeometry(curveB, 80, 0.035, 8, false);
    const tubeMatB = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.45,
    });
    const tubeMeshB = new THREE.Mesh(tubeGeoB, tubeMatB);
    scene.add(tubeMeshB);

    // ==========================================
    // 4. TRAVELING SKILL TOKENS (ORBS ALONG PATHS)
    // ==========================================
    interface SkillPacket {
      mesh: THREE.Mesh;
      light: THREE.PointLight;
      curve: THREE.CatmullRomCurve3;
      speed: number;
      offset: number;
    }

    const packets: SkillPacket[] = [];
    const packetGeo = new THREE.SphereGeometry(0.16, 16, 16);

    const createSkillPacket = (
      curve: THREE.CatmullRomCurve3,
      colorHex: number,
      offset: number,
      speed: number
    ) => {
      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 1.5,
        roughness: 0.1,
      });
      const mesh = new THREE.Mesh(packetGeo, mat);
      const light = new THREE.PointLight(colorHex, 1.2, 3);
      mesh.add(light);
      scene.add(mesh);
      packets.push({ mesh, light, curve, speed, offset });
    };

    // Flowing from Maya (Python / ML / Tech) -> Liam
    createSkillPacket(curveA, 0x10b981, 0.0, 0.0035);
    createSkillPacket(curveA, 0x38bdf8, 0.33, 0.0032);
    createSkillPacket(curveA, 0x4f46e5, 0.66, 0.0038);

    // Flowing from Liam (UI/UX / Design / Systems) -> Maya
    createSkillPacket(curveB, 0xf59e0b, 0.0, 0.0034);
    createSkillPacket(curveB, 0xf43f5e, 0.33, 0.0036);
    createSkillPacket(curveB, 0xa855f7, 0.66, 0.0031);

    // ==========================================
    // 5. AMBIENT 3D PARTICLES / STARS
    // ==========================================
    const particleCount = 220;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colorPalette = [
      new THREE.Color(0x6366f1),
      new THREE.Color(0xa855f7),
      new THREE.Color(0xf59e0b),
      new THREE.Color(0x38bdf8),
    ];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 18;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;

      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      particleColors[i * 3] = col.r;
      particleColors[i * 3 + 1] = col.g;
      particleColors[i * 3 + 2] = col.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // ==========================================
    // 6. MOUSE PARALLAX TRACKING
    // ==========================================
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouse.targetX = x * 1.5;
      mouse.targetY = -y * 1.5;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // ==========================================
    // 7. ANIMATION LOOP
    // ==========================================
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth mouse parallax lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      camera.position.x = mouse.x * 2.2;
      camera.position.y = mouse.y * 1.8;
      camera.lookAt(0, 0, 0);

      // Rotate Learner nodes
      nodeMaya.coreMesh.rotation.x += 0.008;
      nodeMaya.coreMesh.rotation.y += 0.012;
      nodeMaya.wireMesh.rotation.y -= 0.006;
      nodeMaya.ringMesh.rotation.z += 0.015;

      nodeLiam.coreMesh.rotation.x -= 0.009;
      nodeLiam.coreMesh.rotation.y -= 0.014;
      nodeLiam.wireMesh.rotation.y += 0.007;
      nodeLiam.ringMesh.rotation.z -= 0.015;

      // Floating gentle bobbing
      nodeMaya.group.position.y = 0.4 + Math.sin(time * 1.4) * 0.15;
      nodeLiam.group.position.y = -0.4 + Math.cos(time * 1.4) * 0.15;

      // Central Nexus rotation and pulse
      centralGroup.rotation.y += 0.018;
      centralGroup.rotation.x += 0.012;
      torusMesh1.rotation.z += 0.02;
      torusMesh2.rotation.x += 0.02;
      const pulseScale = 1.0 + Math.sin(time * 3.5) * 0.08;
      centralGroup.scale.set(pulseScale, pulseScale, pulseScale);

      // Travel skill packets along the 3D curves
      packets.forEach((p) => {
        p.offset = (p.offset + p.speed) % 1;
        const pos = p.curve.getPointAt(p.offset);
        p.mesh.position.copy(pos);
      });

      // Gently rotate ambient particle stars
      particleSystem.rotation.y = time * 0.02;
      particleSystem.rotation.x = time * 0.01;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    // Teardown
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      renderer.dispose();
      coreGeoDispose([
        nodeMaya.coreMesh.geometry,
        nodeMaya.wireMesh.geometry,
        nodeMaya.ringMesh.geometry,
        nodeLiam.coreMesh.geometry,
        nodeLiam.wireMesh.geometry,
        nodeLiam.ringMesh.geometry,
        centralGeo,
        torusGeo1,
        torusGeo2,
        tubeGeoA,
        tubeGeoB,
        packetGeo,
        particleGeo,
      ]);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  function coreGeoDispose(geometries: THREE.BufferGeometry[]) {
    geometries.forEach((g) => g.dispose());
  }

  return (
    <div className="relative w-full h-[580px] sm:h-[640px] lg:h-[700px] flex items-center justify-center overflow-hidden select-none">
      {/* Real 3D WebGL Canvas Viewport */}
      {webGLSupported ? (
        <div
          ref={containerRef}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }}
        />
      ) : (
        /* Graceful CSS 3D fallback for devices without WebGL */
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 rounded-full border-4 border-dashed border-brand-500 animate-spin-slow opacity-40" />
        </div>
      )}

      {/* ======================================================== */}
      {/* HTML / 3D INTERACTIVE UI OVERLAYS                        */}
      {/* ======================================================== */}

      {/* Floating 3D Card Left: Maya */}
      <div
        onMouseEnter={() => setHoveredNode("maya")}
        onMouseLeave={() => setHoveredNode(null)}
        className="absolute left-3 sm:left-8 top-12 sm:top-20 z-20 max-w-[270px] sm:max-w-xs transition-transform duration-300 hover:scale-105"
      >
        <div className="rounded-2xl border border-brand-500/30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 sm:p-5 shadow-2xl shadow-brand-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
              MC
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Maya Chen</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Machine Learning Fellow</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">
                TEACHING (OUTGOING)
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                Python, PyTorch &amp; ML
              </span>
            </div>

            <div className="p-2 rounded-xl bg-brand-50/80 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/60">
              <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300 uppercase block">
                SEEKING (INCOMING)
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                UI/UX Design Systems
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating 3D Card Right: Liam */}
      <div
        onMouseEnter={() => setHoveredNode("liam")}
        onMouseLeave={() => setHoveredNode(null)}
        className="absolute right-3 sm:right-8 bottom-12 sm:bottom-20 z-20 max-w-[270px] sm:max-w-xs transition-transform duration-300 hover:scale-105"
      >
        <div className="rounded-2xl border border-purple-500/30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 sm:p-5 shadow-2xl shadow-purple-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              LP
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Liam Patel</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Design Systems Lead</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2 rounded-xl bg-brand-50/80 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/60">
              <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300 uppercase block">
                TEACHING (OUTGOING)
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                UI/UX, Figma &amp; Prototypes
              </span>
            </div>

            <div className="p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">
                SEEKING (INCOMING)
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                Python &amp; Data Analysis
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Center Nexus Pill */}
      <div className="absolute top-6 sm:top-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-md shadow-xl text-slate-800 dark:text-slate-200">
          <Sparkles className="w-4 h-4 text-accent-amber animate-spin-slow" />
          <span>Real-time Reciprocal 3D Knowledge Stream</span>
        </div>
      </div>

      {/* Bottom Floating Skill Tokens (Interactive Category Filters) */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl px-4">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
          {[
            { id: "all", label: "All Skills" },
            { id: "python", label: "Python & AI" },
            { id: "uiux", label: "UI/UX & Figma" },
            { id: "languages", label: "Languages" },
            { id: "guitar", label: "Music & Audio" },
          ].map((token) => (
            <button
              key={token.id}
              onClick={() => setActiveSkill(token.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold backdrop-blur-md transition-all border ${
                activeSkill === token.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-lg scale-105"
                  : "bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800"
              }`}
            >
              {token.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

