/**
 * High-fidelity programmatic Earth texture generator for LearnLync's 3D Globe.
 * Creates equirectangular canvas textures with recognizable continents, coastlines,
 * country borders, graticules, and city clusters.
 */

import * as THREE from "three";

export function createEarthCanvasTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // 1. Ocean Background (Rich deep navy & sapphire blue with realistic equatorial depth)
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, "#081329"); // North pole deep polar blue
  oceanGrad.addColorStop(0.25, "#0b2046"); // Mid latitudes
  oceanGrad.addColorStop(0.5, "#102f66"); // Equatorial ocean
  oceanGrad.addColorStop(0.75, "#0b2046");
  oceanGrad.addColorStop(1, "#081329"); // South pole
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Graticule Lines (Subtle latitude & longitude grid)
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = "rgba(99, 130, 185, 0.12)";

  // Latitude parallels (every 15 degrees)
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Longitude meridians (every 15 degrees)
  for (let lon = -180; lon <= 180; lon += 15) {
    const x = ((lon + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Highlight Equator & Prime Meridian
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(129, 160, 225, 0.22)";
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();

  // Helper: Convert [lon, lat] to [x, y]
  const toXY = (lon: number, lat: number): [number, number] => {
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return [x, y];
  };

  // Helper: Draw continent polygon
  const drawPolygon = (
    coords: [number, number][],
    fillColor: string,
    strokeColor: string,
    lineWidth = 1
  ) => {
    if (coords.length < 3) return;
    ctx.beginPath();
    const [firstX, firstY] = toXY(coords[0][0], coords[0][1]);
    ctx.moveTo(firstX, firstY);
    for (let i = 1; i < coords.length; i++) {
      const [px, py] = toXY(coords[i][0], coords[i][1]);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
  };

  // Color Palette for LearnLync's High-Contrast, Realistic Globe
  const landFill = "#1b3d34"; // Deep forest / terrestrial emerald landmass
  const landAccent = "#264f43"; // Elevated terrain & mountain regions
  const coastBorder = "#60a5fa"; // Glowing cyan-blue coastline
  const countryBorder = "rgba(147, 197, 253, 0.45)"; // Distinct country divisions

  // ==========================================
  // REALISTIC CONTINENT POLYGONS (Equirectangular)
  // ==========================================

  // 1. North America (Mainland, Alaska, Canada, USA, Mexico, Central America)
  drawPolygon(
    [
      [-168, 65], [-162, 59], [-148, 60], [-135, 54], [-125, 49], [-124, 38],
      [-117, 32], [-110, 23], [-105, 20], [-96, 16], [-87, 14], [-83, 9],
      [-77, 8], [-80, 9], [-83, 15], [-88, 21], [-97, 26], [-97, 30],
      [-89, 30], [-82, 25], [-80, 25], [-81, 31], [-75, 35], [-74, 41],
      [-70, 43], [-66, 44], [-60, 46], [-64, 49], [-60, 54], [-64, 58],
      [-78, 62], [-82, 55], [-94, 51], [-94, 60], [-87, 65], [-95, 69],
      [-120, 69], [-135, 69], [-142, 70], [-165, 71], [-168, 65]
    ],
    landFill,
    coastBorder,
    1.2
  );

  // Florida Peninsula
  drawPolygon([[-82, 30], [-80, 25], [-81, 25], [-83, 29]], landAccent, coastBorder);

  // Greenland
  drawPolygon(
    [[-45, 60], [-35, 65], [-20, 70], [-18, 77], [-30, 83], [-55, 82], [-60, 75], [-50, 68]],
    "#1c2e4a",
    coastBorder
  );

  // 2. South America
  drawPolygon(
    [
      [-77, 8], [-72, 11], [-61, 10], [-50, 0], [-35, -5], [-35, -9],
      [-38, -13], [-40, -22], [-48, -28], [-55, -34], [-62, -39], [-65, -45],
      [-68, -55], [-74, -53], [-75, -45], [-72, -37], [-70, -30], [-71, -18],
      [-80, -5], [-80, 2], [-77, 8]
    ],
    landFill,
    coastBorder,
    1.2
  );

  // 3. Europe (UK, Scandinavia, Western & Eastern Europe, Mediterranean)
  // British Isles
  drawPolygon([[-5, 50], [-1, 51], [1, 53], [-2, 57], [-5, 58], [-6, 54], [-5, 50]], landAccent, coastBorder);
  drawPolygon([[-10, 51], [-6, 52], [-6, 55], [-10, 54]], landAccent, coastBorder);

  // Continental Europe & Scandinavia
  drawPolygon(
    [
      [-9, 36], [-8, 43], [-1, 44], [0, 49], [4, 52], [8, 54],
      [5, 58], [5, 62], [12, 65], [18, 70], [28, 71], [30, 65],
      [25, 60], [22, 55], [30, 46], [36, 46], [40, 42], [30, 41],
      [26, 40], [20, 37], [16, 40], [13, 44], [9, 44], [3, 42],
      [-1, 38], [-5, 36], [-9, 36]
    ],
    landFill,
    coastBorder,
    1.2
  );

  // 4. Africa
  drawPolygon(
    [
      [-6, 36], [10, 37], [11, 33], [15, 32], [25, 31], [32, 31],
      [34, 28], [37, 22], [43, 13], [51, 12], [45, 5], [40, -3],
      [40, -11], [35, -20], [32, -28], [28, -32], [18, -34], [17, -30],
      [12, -18], [12, -6], [9, 4], [3, 6], [-3, 5], [-8, 4],
      [-14, 11], [-17, 15], [-17, 21], [-13, 28], [-6, 36]
    ],
    landFill,
    coastBorder,
    1.2
  );

  // Madagascar
  drawPolygon([[44, -12], [50, -14], [48, -25], [43, -25]], landAccent, coastBorder);

  // 5. Asia (Middle East, Russia, India, China, SE Asia, Japan)
  drawPolygon(
    [
      [36, 42], [40, 42], [42, 38], [52, 26], [60, 25], [68, 24],
      [70, 21], [72, 16], [80, 10], [80, 16], [87, 22], [92, 21],
      [98, 10], [104, 1], [105, 10], [109, 14], [108, 20], [118, 24],
      [122, 30], [122, 38], [128, 42], [135, 48], [142, 53], [150, 59],
      [162, 57], [169, 65], [178, 66], [180, 68], [170, 72], [140, 73],
      [105, 77], [80, 73], [60, 68], [50, 65], [42, 56], [36, 42]
    ],
    landFill,
    coastBorder,
    1.2
  );

  // Japan Islands
  drawPolygon([[130, 32], [133, 34], [136, 35], [139, 37], [141, 41], [141, 45], [145, 43], [137, 36], [131, 33]], landAccent, coastBorder);

  // Indian Subcontinent Detail
  drawPolygon([[68, 24], [72, 20], [77, 8], [80, 10], [85, 18], [88, 22], [75, 28]], landAccent, coastBorder);

  // Indonesia & Philippines
  drawPolygon([[96, 4], [105, -5], [115, -8], [107, -4]], landAccent, coastBorder);
  drawPolygon([[114, 4], [118, 2], [116, -4], [110, -2]], landAccent, coastBorder);
  drawPolygon([[120, 15], [125, 12], [125, 7], [121, 10]], landAccent, coastBorder);

  // 6. Australia & New Zealand
  drawPolygon(
    [
      [114, -22], [122, -18], [130, -13], [136, -12], [142, -11], [146, -16],
      [153, -28], [150, -35], [142, -38], [137, -35], [130, -32], [115, -34],
      [113, -26], [114, -22]
    ],
    landFill,
    coastBorder,
    1.2
  );
  // Tasmania
  drawPolygon([[145, -41], [148, -41], [147, -44], [144, -43]], landAccent, coastBorder);
  // New Zealand
  drawPolygon([[172, -35], [178, -38], [175, -42]], landAccent, coastBorder);
  drawPolygon([[168, -43], [172, -43], [170, -47]], landAccent, coastBorder);

  // 7. Antarctica
  drawPolygon(
    [
      [-180, -78], [-120, -74], [-60, -65], [-40, -70], [0, -68],
      [60, -67], [120, -66], [160, -70], [180, -75], [180, -90], [-180, -90]
    ],
    "#22334e",
    coastBorder
  );

  // ==========================================
  // REAL WORLD POPULATION CLUSTERS (City Lights / Glow)
  // ==========================================
  const cityClusters: [number, number, number, string][] = [
    [-122.4, 37.8, 3.5, "#60a5fa"], // SF Bay
    [-74.0, 40.7, 4.0, "#93c5fd"], // NYC
    [-0.1, 51.5, 4.0, "#a5b4fc"], // London
    [2.3, 48.8, 3.5, "#a5b4fc"], // Paris
    [13.4, 52.5, 3.5, "#818cf8"], // Berlin
    [4.9, 52.4, 3.0, "#818cf8"], // Amsterdam
    [77.6, 13.0, 4.5, "#34d399"], // Bengaluru
    [72.9, 19.1, 4.0, "#34d399"], // Mumbai
    [77.1, 28.7, 4.0, "#34d399"], // Delhi
    [139.7, 35.7, 4.5, "#60a5fa"], // Tokyo
    [127.0, 37.6, 3.5, "#60a5fa"], // Seoul
    [103.8, 1.4, 3.5, "#38bdf8"], // Singapore
    [151.2, -33.9, 3.5, "#a5b4fc"], // Sydney
    [-79.4, 43.7, 3.0, "#93c5fd"], // Toronto
    [-46.6, -23.5, 3.5, "#fcd34d"], // Sao Paulo
    [55.3, 25.2, 3.0, "#fbbf24"], // Dubai
    [-97.7, 30.3, 3.0, "#60a5fa"], // Austin
    [18.1, 59.3, 2.5, "#818cf8"], // Stockholm
  ];

  cityClusters.forEach(([lon, lat, radius, color]) => {
    const [cx, cy] = toXY(lon, lat);

    // Subtle outer atmospheric bloom
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 3.5);
    glow.addColorStop(0, color);
    glow.addColorStop(0.3, "rgba(99, 102, 241, 0.45)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Bright core dot
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

/**
 * Creates a semi-transparent procedural cloud layer texture.
 */
export function createCloudCanvasTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.clearRect(0, 0, width, height);

  // Soft atmospheric cloud bands
  ctx.fillStyle = "rgba(235, 245, 255, 0.08)";
  for (let i = 0; i < 40; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    const rx = 40 + Math.random() * 120;
    const ry = 15 + Math.random() * 45;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, (Math.random() - 0.5) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Swirling weather formations
  ctx.fillStyle = "rgba(220, 235, 255, 0.12)";
  for (let i = 0; i < 25; i++) {
    const cx = Math.random() * width;
    const cy = 100 + Math.random() * (height - 200);
    const rad = 25 + Math.random() * 70;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.16)");
    grad.addColorStop(0.6, "rgba(220, 235, 255, 0.08)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}
