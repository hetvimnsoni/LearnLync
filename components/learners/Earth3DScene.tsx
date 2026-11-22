"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { PeerProfile } from "@/types/learner";
import {
  getTopSkillIcons,
  separateClusteredMarkers,
  generateConnectionTrails,
} from "@/lib/geo";
import {
  Plus,
  Minus,
  RotateCcw,
  Play,
  Pause,
  MapPin,
  Move,
  Compass,
  Check,
} from "lucide-react";

interface Earth3DSceneProps {
  peers: PeerProfile[];
  onSelectPeer: (peer: PeerProfile) => void;
  selectedPeerId?: string | null;
  targetLocation?: { lat: number; lon: number } | null;
  connections?: Record<string, "none" | "connected" | "pending">;
  children?: React.ReactNode;
}

export function Earth3DScene({
  peers,
  onSelectPeer,
  selectedPeerId,
  targetLocation,
  connections = {},
  children,
}: Earth3DSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [isRotating, setIsRotating] = useState(true);
  const [hoveredPeerId, setHoveredPeerId] = useState<string | null>(null);

  // References for direct DOM marker positioning (zero React re-renders during 60fps Earth rotation)
  const markerElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // References for Three.js render loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);

  // Initial rotation showing recognizable landmasses (Europe, Africa, Asia, Americas) under sunlight
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0.35, y: -1.45 });
  const currentRotationRef = useRef<{ x: number; y: number }>({ x: 0.35, y: -1.45 });

  // Zoom parameters:
  // Default: 7.4 (Large, partially cropped Earth matching reference)
  // Min zoom (Close-up): 4.8
  // Max zoom (Complete globe): 18.0
  const DEFAULT_ZOOM = 7.4;
  const MIN_ZOOM = 4.8;
  const MAX_ZOOM = 18.0;

  const zoomDistanceRef = useRef<number>(DEFAULT_ZOOM);
  const targetZoomRef = useRef<number>(DEFAULT_ZOOM);
  const isDraggingRef = useRef<boolean>(false);
  const isAutoRotatingRef = useRef<boolean>(true);
  const previousPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Earth radius
  const GLOBE_RADIUS = 4.8;

  // Convert (lat, lon) to 3D Cartesian coordinates on the sphere
  const latLonToVector3 = useCallback((lat: number, lon: number, radius: number): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  }, []);

  // Separate markers sharing the same city so they never overlap
  const mappedPeers = useMemo(() => {
    const valid = peers.filter(
      (p) =>
        p.show_on_community_map !== false &&
        typeof p.latitude === "number" &&
        typeof p.longitude === "number"
    );
    return separateClusteredMarkers(valid);
  }, [peers]);

  // Compute 3D positions for all mapped peers
  const peerPositions = useMemo(() => {
    const map = new Map<string, THREE.Vector3>();
    mappedPeers.forEach((p) => {
      const v = latLonToVector3(p.displayLat, p.displayLon, GLOBE_RADIUS);
      map.set(p.id, v);
    });
    return map;
  }, [mappedPeers, latLonToVector3, GLOBE_RADIUS]);

  // Generate subtle connection trails between learners
  const connectionTrails = useMemo(() => {
    return generateConnectionTrails(peers);
  }, [peers]);

  // Smoothly rotate globe toward target coordinates
  const rotateToCoordinates = useCallback((lat: number, lon: number) => {
    const targetY = -((lon + 90) * (Math.PI / 180));
    const targetX = Math.max(-1.1, Math.min(1.1, (lat * (Math.PI / 180)) * 0.75));

    targetRotationRef.current = { x: targetX, y: targetY };
    // Zoom in comfortably to inspect the region
    targetZoomRef.current = Math.min(targetZoomRef.current, 6.4);
  }, []);

  // Watch for external target location requests (e.g. city search / peer select)
  useEffect(() => {
    if (targetLocation) {
      rotateToCoordinates(targetLocation.lat, targetLocation.lon);
    }
  }, [targetLocation, rotateToCoordinates]);

  // Three.js Mount & Animation Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. WebGL Compatibility Check
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

    // 2. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, zoomDistanceRef.current);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 3. Natural Lighting with Subtle Purple Atmospheric Glow
    const ambientLight = new THREE.AmbientLight(0x232442, 1.2);
    scene.add(ambientLight);

    // Warm sunlight from upper left
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.7);
    sunLight.position.set(-12, 8, 9);
    scene.add(sunLight);

    // Subtle purple / indigo atmospheric backlight from right/bottom
    const purpleAtmosphereLight = new THREE.DirectionalLight(0xa855f7, 1.8);
    purpleAtmosphereLight.position.set(12, -6, -4);
    scene.add(purpleAtmosphereLight);

    // Soft violet rim light
    const violetRimLight = new THREE.PointLight(0x818cf8, 1.5, 30);
    violetRimLight.position.set(0, -9, 5);
    scene.add(violetRimLight);

    // 4. Earth Master Group
    const earthGroup = new THREE.Group();
    earthGroup.position.set(0, 0, 0);
    scene.add(earthGroup);
    earthGroupRef.current = earthGroup;

    // 5. Authentic NASA Satellite Textures
    const textureLoader = new THREE.TextureLoader();
    const dayMap = textureLoader.load("/textures/earth_daymap.jpg");
    dayMap.colorSpace = THREE.SRGBColorSpace;

    const normalMap = textureLoader.load("/textures/earth_normal.jpg");
    const specularMap = textureLoader.load("/textures/earth_specular.jpg");
    const cloudsMap = textureLoader.load("/textures/earth_clouds.png");

    // Earth Sphere Geometry
    const earthGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      map: dayMap,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      specularMap: specularMap,
      specular: new THREE.Color(0x384b66),
      shininess: 25,
      bumpMap: normalMap,
      bumpScale: 0.04,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // 6. Atmospheric Rim Glow (Subtle Purple/Cyan Luminous Halo)
    const atmosphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.022, 64, 64);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6, // Purple-indigo atmospheric glow
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    earthGroup.add(atmosphereMesh);

    // Secondary cyan limb glow
    const limbGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.018, 64, 64);
    const limbMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const limbMesh = new THREE.Mesh(limbGeo, limbMat);
    earthGroup.add(limbMesh);

    // 7. Dynamic Cloud Layer
    const cloudsGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.014, 64, 64);
    const cloudsMat = new THREE.MeshPhongMaterial({
      map: cloudsMap,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    earthGroup.add(cloudsMesh);
    cloudsMeshRef.current = cloudsMesh;

    // 8. 3D Pins & Glowing Base Rings on Earth's crust (Emerald for connected, Amber for pending, Purple for unconnected)
    const pinsGroup = new THREE.Group();
    earthGroup.add(pinsGroup);

    const pinGeometry = new THREE.SphereGeometry(0.045, 16, 16);
    const pinRingGeometry = new THREE.RingGeometry(0.065, 0.12, 32);

    peerPositions.forEach((pos, peerId) => {
      const status = connections[peerId] || connections[peerId.toLowerCase()] || "none";
      const isConn = status === "connected";
      const isPend = status === "pending";

      const pinColor = isConn ? 0x10b981 : isPend ? 0xf59e0b : 0xc084fc;
      const ringColor = isConn ? 0x34d399 : isPend ? 0xfbbf24 : 0xa855f7;

      // Small core dot
      const pinMat = new THREE.MeshBasicMaterial({ color: pinColor });
      const pinMesh = new THREE.Mesh(pinGeometry, pinMat);
      pinMesh.position.copy(pos);
      pinsGroup.add(pinMesh);

      // Glowing pulse ring under marker
      const ringMat = new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: isConn ? 0.85 : 0.65,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(pinRingGeometry, ringMat);
      ringMesh.position.copy(pos.clone().multiplyScalar(1.002));
      ringMesh.lookAt(pos.clone().multiplyScalar(2));
      pinsGroup.add(ringMesh);
    });

    // 9. Curved 3D Learner Connection Trails (Elegant arcs between learners)
    const arcsGroup = new THREE.Group();
    earthGroup.add(arcsGroup);

    interface PulseAnimation {
      curve: THREE.QuadraticBezierCurve3;
      mesh: THREE.Mesh;
      speed: number;
      progress: number;
    }
    const pulseAnimations: PulseAnimation[] = [];
    const pulseGeometry = new THREE.SphereGeometry(0.038, 12, 12);
    const pulseMaterial = new THREE.MeshBasicMaterial({ color: 0xe879f9 });

    connectionTrails.forEach((trail) => {
      const v1 = latLonToVector3(trail.fromLat, trail.fromLon, GLOBE_RADIUS);
      const v2 = latLonToVector3(trail.toLat, trail.toLon, GLOBE_RADIUS);

      const distance = v1.distanceTo(v2);
      const mid = v1.clone().add(v2).multiplyScalar(0.5);
      const arcElevation = GLOBE_RADIUS + Math.min(1.8, Math.max(0.4, distance * 0.28));
      mid.normalize().multiplyScalar(arcElevation);

      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
      const points = curve.getPoints(45);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);

      const curveMat = new THREE.LineBasicMaterial({
        color: 0xc084fc,
        transparent: true,
        opacity: 0.45,
        linewidth: 1.5,
      });
      const arcLine = new THREE.Line(curveGeo, curveMat);
      arcsGroup.add(arcLine);

      // Glowing moving exchange photon along arc
      const pulseMesh = new THREE.Mesh(pulseGeometry, pulseMaterial);
      pulseMesh.position.copy(v1);
      arcsGroup.add(pulseMesh);

      pulseAnimations.push({
        curve,
        mesh: pulseMesh,
        speed: 0.005 + Math.random() * 0.004,
        progress: Math.random(),
      });
    });

    // ==========================================
    // INTERACTION HANDLERS (Drag, Zoom, Damping)
    // ==========================================
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      previousPointerPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousPointerPosRef.current.x;
      const deltaY = e.clientY - previousPointerPosRef.current.y;

      const sensitivity = 0.0045;
      targetRotationRef.current.y += deltaX * sensitivity;
      targetRotationRef.current.x += deltaY * sensitivity;

      // Clamp vertical tilt to prevent pole inversion
      targetRotationRef.current.x = Math.max(-1.15, Math.min(1.15, targetRotationRef.current.x));

      previousPointerPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    // Zoom on wheel / trackpad: full continuous range from close-up (4.8) to complete globe (18.0)
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.0055;
      targetZoomRef.current = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoomRef.current + zoomFactor));
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    domElement.addEventListener("wheel", onWheel, { passive: false });

    // Responsive Resize Handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // =========================================================================
    // HIGH-PERFORMANCE ANIMATION & MARKER PROJECTION LOOP
    // Reusable Three.js vectors prevent GC pressure and allocations per frame
    // Direct DOM element transforms prevent 40 React re-renders per second!
    // =========================================================================
    let animationFrameId: number;
    let isVisibleInViewport = true;

    // Pause rendering when scrolled out of view to save GPU/CPU
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisibleInViewport = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    const tempWorldPos = new THREE.Vector3();
    const tempSurfaceNormal = new THREE.Vector3();
    const tempToCamera = new THREE.Vector3();
    const tempProjected = new THREE.Vector3();
    const globeCenter = new THREE.Vector3(0, 0, 0);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisibleInViewport) return;

      // Auto-rotation when idle
      if (isAutoRotatingRef.current && !isDraggingRef.current) {
        targetRotationRef.current.y += 0.00075;
      }

      // Smooth inertia damping
      currentRotationRef.current.x +=
        (targetRotationRef.current.x - currentRotationRef.current.x) * 0.08;
      currentRotationRef.current.y +=
        (targetRotationRef.current.y - currentRotationRef.current.y) * 0.08;

      earthGroup.rotation.x = currentRotationRef.current.x;
      earthGroup.rotation.y = currentRotationRef.current.y;

      // Cloud swirl
      if (cloudsMeshRef.current) {
        cloudsMeshRef.current.rotation.y += 0.00025;
      }

      // Animate moving pulse photons along connection arcs
      pulseAnimations.forEach((item) => {
        item.progress += item.speed;
        if (item.progress > 1) item.progress = 0;
        const pt = item.curve.getPointAt(item.progress);
        item.mesh.position.copy(pt);
      });

      // Smooth zoom damping
      zoomDistanceRef.current += (targetZoomRef.current - zoomDistanceRef.current) * 0.085;
      camera.position.z = zoomDistanceRef.current;

      renderer.render(scene, camera);

      // Direct DOM updates: butter-smooth 60fps with ZERO React component re-renders!
      const w = container.clientWidth;
      const h = container.clientHeight;
      earthGroup.updateMatrixWorld();

      mappedPeers.forEach((peer) => {
        const el = markerElementsRef.current.get(peer.id);
        if (!el) return;

        const localPos = peerPositions.get(peer.id);
        if (!localPos) {
          el.style.display = "none";
          return;
        }

        tempWorldPos.copy(localPos).applyMatrix4(earthGroup.matrixWorld);

        // Front-side occlusion test: only visible when facing camera
        tempSurfaceNormal.copy(tempWorldPos).sub(globeCenter).normalize();
        tempToCamera.copy(camera.position).sub(tempWorldPos).normalize();
        const dot = tempSurfaceNormal.dot(tempToCamera);
        const isFacingCamera = dot > 0.08;

        if (isFacingCamera) {
          tempProjected.copy(tempWorldPos).project(camera);
          const screenX = (tempProjected.x * 0.5 + 0.5) * w;
          const screenY = (-(tempProjected.y * 0.5) + 0.5) * h;

          const scale = Math.max(0.55, Math.min(1.2, 7.5 / zoomDistanceRef.current));
          const opacity = Math.min(1, Math.max(0.2, dot * 2));

          el.style.display = "block";
          el.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -100%) scale(${scale})`;
          el.style.opacity = String(opacity);
        } else {
          el.style.display = "none";
        }
      });
    };

    animationFrameId = requestAnimationFrame(animate);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      intersectionObserver.disconnect();
      domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);

      if (container && renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }

      earthGeo.dispose();
      earthMat.dispose();
      atmosphereGeo.dispose();
      atmosphereMat.dispose();
      limbGeo.dispose();
      limbMat.dispose();
      cloudsGeo.dispose();
      cloudsMat.dispose();
      pinGeometry.dispose();
      pinRingGeometry.dispose();
      pulseGeometry.dispose();
      pulseMaterial.dispose();
      renderer.dispose();
    };
  }, [latLonToVector3, mappedPeers, peerPositions, connectionTrails, connections, GLOBE_RADIUS, DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM]);

  // Full continuous zoom controls
  const handleZoomIn = () => {
    targetZoomRef.current = Math.max(MIN_ZOOM, targetZoomRef.current - 1.6);
  };

  const handleZoomOut = () => {
    // Zoom out continuously so complete globe becomes visible
    targetZoomRef.current = Math.min(MAX_ZOOM, targetZoomRef.current + 1.8);
  };

  const handleResetView = () => {
    targetRotationRef.current = { x: 0.35, y: -1.45 };
    targetZoomRef.current = DEFAULT_ZOOM;
  };

  const toggleAutoRotate = () => {
    isAutoRotatingRef.current = !isAutoRotatingRef.current;
    setIsRotating(isAutoRotatingRef.current);
  };

  if (!webGLSupported) {
    return (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-8 bg-slate-900 rounded-3xl text-center text-white space-y-4">
        <Compass className="w-12 h-12 text-brand-400" />
        <h3 className="text-xl font-bold">3D WebGL Acceleration Unavailable</h3>
        <p className="text-sm text-slate-400 max-w-md">
          Your browser does not currently support WebGL hardware acceleration. You can still explore all learners in the directory view below.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[480px] sm:h-[620px] md:h-[720px] lg:h-[840px] rounded-3xl overflow-hidden bg-gradient-to-br from-[#080d24] via-[#0d1538] to-[#151035] dark:from-[#060814] dark:via-[#090d21] dark:to-[#0c091f] border border-indigo-200/50 dark:border-slate-800/80 shadow-2xl select-none">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Atmospheric Space Gradients & Subtle Purple Nebula */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:42px_42px] opacity-15" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Instruction Badge - Responsive to light/dark themes */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden md:block">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/90 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 backdrop-blur-md shadow-lg">
          <Move className="w-3.5 h-3.5 text-brand-600 dark:text-purple-400" />
          <span>Drag to rotate · Scroll to zoom (complete globe available)</span>
        </div>
      </div>

      {/* Floating Map Controls (Zoom In, Zoom Out, Reset, Pause/Resume) */}
      <div className="absolute top-4 right-4 sm:top-auto sm:bottom-6 sm:right-6 z-30 flex flex-col items-center gap-2 sm:gap-2.5">
        <div className="flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-1 shadow-xl">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 sm:p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Zoom In (+)"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <div className="h-[1px] bg-slate-200 dark:bg-slate-800 my-0.5" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 sm:p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Zoom Out to Full Globe (-)"
          >
            <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleResetView}
          className="p-2 sm:p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-xl"
          title="Reset to Reference View"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <button
          type="button"
          onClick={toggleAutoRotate}
          className="p-2 sm:p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-xl"
          title={isRotating ? "Pause Earth Rotation" : "Resume Earth Rotation"}
        >
          {isRotating ? (
            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : (
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* 2D LEARNER MARKER OVERLAY ON THE 3D EARTH SURFACE         */}
      {/* Positioned directly via GPU transforms on each frame      */}
      {/* ========================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {mappedPeers.map((peer) => {
          const isSelected = selectedPeerId === peer.id;
          const isHovered = hoveredPeerId === peer.id;
          const initial = (peer.full_name || peer.username || "L").charAt(0).toUpperCase();
          const topIcons = getTopSkillIcons(peer.skills_offered);

          return (
            <div
              key={peer.id}
              ref={(el) => {
                if (el) {
                  markerElementsRef.current.set(peer.id, el);
                } else {
                  markerElementsRef.current.delete(peer.id);
                }
              }}
              style={{
                display: "none", // Three.js render loop controls display, transform & opacity directly
                willChange: "transform, opacity",
                zIndex: isSelected || isHovered ? 40 : 20,
              }}
              className="absolute left-0 top-0 pointer-events-auto origin-bottom cursor-pointer group select-none"
              onClick={() => onSelectPeer(peer)}
              onMouseEnter={() => setHoveredPeerId(peer.id)}
              onMouseLeave={() => setHoveredPeerId(null)}
            >
              {/* Marker Anchor & Glow */}
              <div className="relative flex flex-col items-center">
                {(() => {
                  const status = connections[peer.id] || connections[peer.id.toLowerCase()] || "none";
                  const isConn = status === "connected";
                  const isPend = status === "pending";

                  return (
                    <>
                      {/* Profile Pill Card with Contextual Connection Glow */}
                      <div
                        className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl backdrop-blur-xl border transition-all ${
                          isSelected
                            ? isConn
                              ? "bg-emerald-600 text-white border-white/90 ring-4 ring-emerald-500/50 shadow-xl shadow-emerald-500/50 scale-105"
                              : isPend
                              ? "bg-amber-600 text-white border-white/90 ring-4 ring-amber-500/50 shadow-xl shadow-amber-500/50 scale-105"
                              : "bg-purple-600 text-white border-white/90 ring-4 ring-purple-500/40 shadow-xl shadow-purple-500/40 scale-105"
                            : isConn
                            ? "bg-slate-900/95 text-white border-emerald-400/80 ring-2 ring-emerald-500/30 hover:border-emerald-300 shadow-lg shadow-emerald-950/60 hover:shadow-emerald-500/40"
                            : isPend
                            ? "bg-slate-900/90 text-white border-amber-400/70 hover:border-amber-300 shadow-lg shadow-amber-950/40 hover:shadow-amber-500/30"
                            : "bg-slate-900/90 text-white border-slate-700/90 hover:border-purple-400 hover:bg-slate-850 shadow-lg shadow-purple-950/40 hover:shadow-purple-500/30"
                        }`}
                      >
                        {/* Circular Profile Avatar */}
                        <div className="relative shrink-0">
                          {peer.avatar_url ? (
                            <img
                              src={peer.avatar_url}
                              alt={peer.full_name || "Learner"}
                              className={`w-9 h-9 rounded-full object-cover border-2 shadow-sm ${
                                isConn
                                  ? "border-emerald-400"
                                  : isPend
                                  ? "border-amber-400"
                                  : "border-white/40"
                              }`}
                            />
                          ) : (
                            <div
                              className={`w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-sm ${
                                isConn
                                  ? "bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600"
                                  : isPend
                                  ? "bg-gradient-to-tr from-amber-600 to-orange-600"
                                  : "bg-gradient-to-tr from-purple-600 via-indigo-600 to-brand-600"
                              }`}
                            >
                              {initial}
                            </div>
                          )}
                          {/* Active / Connection status pulse dot */}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 ${
                              isConn
                                ? "bg-emerald-400 animate-pulse"
                                : isPend
                                ? "bg-amber-400"
                                : "bg-purple-400"
                            }`}
                          />
                        </div>

                        {/* Name, Skills, Connection Badge & City */}
                        <div className="flex flex-col text-left min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold truncate max-w-[110px]">
                              {peer.full_name || peer.username}
                            </span>
                            {/* Connection Badge */}
                            {isConn && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-500/25 text-emerald-300 border border-emerald-400/60 shadow-xs shrink-0">
                                <Check className="w-2.5 h-2.5 text-emerald-300" />
                                <span>Connected</span>
                              </span>
                            )}
                            {isPend && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-amber-500/25 text-amber-300 border border-amber-400/50 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                <span>Pending</span>
                              </span>
                            )}
                            {/* Skill icons */}
                            <span className="text-xs shrink-0 ml-auto" title={peer.skills_offered.join(", ")}>
                              {topIcons.join(" ")}
                            </span>
                          </div>

                          {/* Location Badge */}
                          {peer.city && (
                            <span className="text-[10px] text-slate-300 font-medium truncate max-w-[130px] flex items-center gap-1">
                              <MapPin className={`w-2.5 h-2.5 shrink-0 ${isConn ? "text-emerald-400" : isPend ? "text-amber-400" : "text-purple-400"}`} />
                              <span>
                                {peer.city}
                                {peer.country ? `, ${peer.country}` : ""}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Marker Needle Pointer */}
                      <div
                        className={`w-2.5 h-3 [clip-path:polygon(50%_100%,0_0,100%_0)] ${
                          isConn
                            ? "bg-gradient-to-b from-slate-900 to-emerald-500"
                            : isPend
                            ? "bg-gradient-to-b from-slate-900 to-amber-500"
                            : "bg-gradient-to-b from-slate-900 to-purple-500"
                        }`}
                      />
                      {/* Crust Glow Dot */}
                      <div
                        className={`w-2 h-2 rounded-full animate-ping opacity-80 ${
                          isConn
                            ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]"
                            : isPend
                            ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]"
                            : "bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.8)]"
                        }`}
                      />
                    </>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overlaid UI content (Left-side interface, Right-side floating card, etc.) */}
      {children}
    </div>
  );
}
