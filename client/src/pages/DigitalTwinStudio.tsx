import {
  ContactShadows,
  Grid,
  Html,
  Line,
  OrbitControls,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ArrowLeft,
  Box,
  Building2,
  CheckCircle2,
  Droplets,
  Eye,
  EyeOff,
  Focus,
  Grid3X3,
  Home,
  Info,
  Layers3,
  Maximize2,
  RotateCcw,
  Wind,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Link } from "wouter";
import * as THREE from "three";
import "../digital-twin-studio.css";

type Vec3 = [number, number, number];
type SystemKey = "architecture" | "electricity" | "hvac" | "plumbing";
type FloorKey = "all" | "ground" | "first" | "second" | "roof";
type ViewPreset = "iso" | "top" | "front" | "walk";
type CameraTarget = { camera: Vec3; target: Vec3 };

const C = {
  ink: "#173f38",
  brand: "#0b4f46",
  stone: "#b8aa98",
  stoneDark: "#8f806f",
  stucco: "#e8e2d8",
  stuccoSide: "#d7d0c5",
  concrete: "#bdb8ae",
  slab: "#a9a59d",
  glass: "#6e9ba6",
  frame: "#4d5b58",
  steel: "#66716e",
  soil: "#b7aa93",
  green: "#688b70",
  electric: "#d3a53a",
  electric2: "#f1c75d",
  hvac: "#4f9e90",
  hvac2: "#7bc0b5",
  water: "#3f87ad",
  hot: "#c56c52",
  drain: "#737b79",
};

const floorY: Record<Exclude<FloorKey, "all" | "roof">, number> = {
  ground: 0.18,
  first: 3.23,
  second: 6.28,
};

const floorMeta: Array<{ key: FloorKey; label: string; short: string }> = [
  { key: "all", label: "المبنى كامل", short: "ALL" },
  { key: "ground", label: "الدور الأرضي", short: "G" },
  { key: "first", label: "الدور الأول", short: "01" },
  { key: "second", label: "الدور الثاني", short: "02" },
  { key: "roof", label: "السطح والخدمات", short: "R" },
];

const systemInfo: Record<SystemKey, {
  label: string;
  english: string;
  description: string;
  path: string[];
  components: Array<{ code: string; name: string; detail: string }>;
  color: string;
}> = {
  architecture: {
    label: "المعماري",
    english: "ARCHITECTURE",
    description: "واجهة سكنية كاملة مع الفتحات والشرفات والمدخل وغرفة خدمات السطح والتقسيمات الداخلية الأساسية.",
    path: ["الموقع", "الهيكل", "الواجهات", "الفتحات", "التقسيم الداخلي", "السطح"],
    components: [
      { code: "A-101", name: "واجهة أمامية", detail: "حجر + لياسة خارجية + زجاج" },
      { code: "A-201", name: "التقسيمات الداخلية", detail: "جدران داخلية وأبواب ومسارات حركة" },
      { code: "A-301", name: "السطح", detail: "بارابيت + غرفة خدمات + وصول صيانة" },
    ],
    color: C.brand,
  },
  electricity: {
    label: "الكهرباء",
    english: "ELECTRICAL",
    description: "مسار التغذية من نقطة الخدمة الخارجية إلى العداد ثم اللوحة الرئيسية والرایزر ولوحات الأدوار ومسارات الكوابل والمخارج.",
    path: ["SERVICE", "MTR-01", "MDB-01", "E-RISER-01", "DB-G/01/02", "CABLE TRAY", "FINAL CIRCUITS"],
    components: [
      { code: "MTR-01", name: "عداد الخدمة", detail: "نقطة دخول التغذية للمبنى" },
      { code: "MDB-01", name: "اللوحة الرئيسية", detail: "توزيع رئيسي إلى الأدوار والسطح" },
      { code: "E-RISER-01", name: "رايزر كهرباء", detail: "مسار رأسي محمي بين الأدوار" },
      { code: "DB-01", name: "لوحات الأدوار", detail: "دوائر إنارة ومخارج وخدمات" },
    ],
    color: C.electric,
  },
  hvac: {
    label: "التكييف المركزي",
    english: "HVAC",
    description: "تصور مركزي يوضح وحدات السطح وغرفة AHU والشافت الرأسي والدكت الرئيسي وفروع الهواء ومخارج التغذية والراجع.",
    path: ["RTU-01/02", "AHU-01", "M-SHAFT-01", "MAIN SUPPLY", "BRANCH DUCTS", "DIFFUSERS", "RETURN"],
    components: [
      { code: "RTU-01", name: "وحدة تكثيف سطحية", detail: "وحدة خارجية مولّدة للمشهد" },
      { code: "AHU-01", name: "وحدة مناولة الهواء", detail: "داخل غرفة الخدمات على السطح" },
      { code: "M-SHAFT-01", name: "شافت ميكانيكي", detail: "نزول رأسي للدكت بين الأدوار" },
      { code: "SA-01", name: "Supply Air", detail: "دكت رئيسي ثم فروع إلى المخارج" },
    ],
    color: C.hvac,
  },
  plumbing: {
    label: "المياه والصرف",
    english: "PLUMBING",
    description: "مسار المياه من خزان السطح والمضخة إلى الرايزر البارد والسخانات والنقاط الصحية، مع رايزر صرف مستقل حتى خط الموقع.",
    path: ["WT-01", "P-01", "CW-RISER", "WH", "FIXTURES", "SW-RISER", "SITE SEWER"],
    components: [
      { code: "WT-01", name: "خزان السطح", detail: "مصدر التغذية المائي للمشهد" },
      { code: "P-01", name: "مضخة تعزيز", detail: "بعد الخزان وقبل الرايزر" },
      { code: "CW-RISER", name: "رايزر مياه باردة", detail: "فروع لكل دور" },
      { code: "SW-RISER", name: "رايزر صرف", detail: "نزول مستقل حتى خط الموقع" },
    ],
    color: C.water,
  },
};

function CameraRig({ desired, nonce, controlsRef }: { desired: CameraTarget; nonce: number; controlsRef: MutableRefObject<any> }) {
  const { camera } = useThree();
  const amount = useRef(1);
  const p = useMemo(() => new THREE.Vector3(...desired.camera), [desired]);
  const t = useMemo(() => new THREE.Vector3(...desired.target), [desired]);

  useEffect(() => { amount.current = 1; }, [nonce, p, t]);
  useFrame(() => {
    if (amount.current < 0.01) return;
    camera.position.lerp(p, 0.11);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(t, 0.12);
      controlsRef.current.update();
    } else camera.lookAt(t);
    amount.current *= 0.86;
  });
  return null;
}

function BoxPart({
  position,
  size,
  color,
  opacity = 1,
  roughness = 0.72,
  metalness = 0.02,
  rotation = [0, 0, 0],
}: {
  position: Vec3;
  size: Vec3;
  color: string;
  opacity?: number;
  roughness?: number;
  metalness?: number;
  rotation?: Vec3;
}) {
  return <mesh position={position} rotation={rotation} castShadow={opacity > 0.45} receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} roughness={roughness} metalness={metalness} depthWrite={opacity > 0.35} />
  </mesh>;
}

function GlassPanel({ position, size, opacity = 0.5 }: { position: Vec3; size: Vec3; opacity?: number }) {
  return <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={size} />
    <meshPhysicalMaterial color={C.glass} transparent opacity={opacity} transmission={0.28} thickness={0.08} roughness={0.12} metalness={0.05} />
  </mesh>;
}

function TubeRoute({ points, radius, color, opacity = 1 }: { points: Vec3[]; radius: number; color: string; opacity?: number }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), [points]);
  return <mesh castShadow={opacity > 0.7}>
    <tubeGeometry args={[curve, Math.max(24, points.length * 12), radius, 10, false]} />
    <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} roughness={0.4} metalness={0.18} depthWrite={opacity > 0.35} />
  </mesh>;
}

function Label({ position, code, title, detail, color = C.brand }: { position: Vec3; code: string; title: string; detail?: string; color?: string }) {
  return <Html position={position} center distanceFactor={12} zIndexRange={[50, 0]}>
    <div className="studio-world-label" style={{ "--label-color": color } as React.CSSProperties} dir="rtl">
      <span>{code}</span>
      <strong>{title}</strong>
      {detail && <small>{detail}</small>}
    </div>
  </Html>;
}

function WindowModule({ x, y, z, width = 2.15, shellOpacity = 1 }: { x: number; y: number; z: number; width?: number; shellOpacity?: number }) {
  const frameOpacity = Math.max(shellOpacity, 0.55);
  return <group>
    <BoxPart position={[x, y, z]} size={[width + 0.28, 1.78, 0.08]} color={C.frame} opacity={frameOpacity} metalness={0.28} roughness={0.36} />
    <GlassPanel position={[x, y, z + 0.035]} size={[width, 1.54, 0.045]} opacity={Math.max(0.18, shellOpacity * 0.48)} />
    <BoxPart position={[x, y, z + 0.075]} size={[0.045, 1.55, 0.06]} color={C.frame} opacity={frameOpacity} metalness={0.3} roughness={0.34} />
    <BoxPart position={[x, y, z + 0.075]} size={[width, 0.045, 0.06]} color={C.frame} opacity={frameOpacity} metalness={0.3} roughness={0.34} />
  </group>;
}

function Balcony({ y, shellOpacity }: { y: number; shellOpacity: number }) {
  return <group>
    <BoxPart position={[0, y, 5.05]} size={[4.8, 0.18, 1.25]} color={C.concrete} opacity={shellOpacity} />
    <GlassPanel position={[0, y + 0.72, 5.62]} size={[4.5, 1.0, 0.06]} opacity={Math.max(0.16, shellOpacity * 0.4)} />
    {[-2.3, -1.15, 0, 1.15, 2.3].map((x) => <BoxPart key={x} position={[x, y + 0.72, 5.64]} size={[0.045, 1.05, 0.05]} color={C.frame} opacity={Math.max(shellOpacity, 0.45)} metalness={0.45} roughness={0.28} />)}
    <BoxPart position={[0, y + 1.23, 5.64]} size={[4.65, 0.055, 0.055]} color={C.frame} opacity={Math.max(shellOpacity, 0.45)} metalness={0.45} roughness={0.28} />
  </group>;
}

function InteriorPlan({ baseY, opacity }: { baseY: number; opacity: number }) {
  const y = baseY + 1.38;
  return <group>
    <BoxPart position={[0.3, y, 0.2]} size={[0.16, 2.55, 8.0]} color="#ded8cf" opacity={opacity} />
    <BoxPart position={[-2.2, y, -1.25]} size={[4.9, 2.55, 0.16]} color="#ded8cf" opacity={opacity} />
    <BoxPart position={[3.1, y, -1.25]} size={[5.4, 2.55, 0.16]} color="#ded8cf" opacity={opacity} />
    <BoxPart position={[2.85, y, -2.7]} size={[0.16, 2.55, 2.8]} color="#ded8cf" opacity={opacity} />
    <BoxPart position={[-4.2, baseY + 0.12, 1.7]} size={[3.1, 0.05, 2.0]} color="#bda98f" opacity={opacity * 0.82} />
    <BoxPart position={[3.5, baseY + 0.12, 1.4]} size={[3.4, 0.05, 2.2]} color="#b8c9c4" opacity={opacity * 0.82} />
  </group>;
}

function FloorArchitecture({ level, baseY, shellOpacity, selected, cutaway }: { level: "ground" | "first" | "second"; baseY: number; shellOpacity: number; selected: boolean; cutaway: boolean }) {
  const wallY = baseY + 1.46;
  const floorOpacity = selected ? 1 : Math.max(0.18, shellOpacity);
  return <group>
    <BoxPart position={[0, baseY, 0]} size={[14.4, 0.28, 10.0]} color={C.slab} opacity={floorOpacity} roughness={0.86} />
    <BoxPart position={[0, wallY, -4.86]} size={[14.2, 2.8, 0.22]} color={C.stucco} opacity={shellOpacity} />
    <BoxPart position={[-7.0, wallY, 0]} size={[0.22, 2.8, 9.55]} color={C.stuccoSide} opacity={shellOpacity} />
    <BoxPart position={[7.0, wallY, 0]} size={[0.22, 2.8, 9.55]} color={C.stuccoSide} opacity={shellOpacity} />

    {!cutaway && <>
      <BoxPart position={[-5.55, wallY, 4.86]} size={[2.7, 2.8, 0.22]} color={C.stucco} opacity={shellOpacity} />
      <BoxPart position={[5.55, wallY, 4.86]} size={[2.7, 2.8, 0.22]} color={C.stucco} opacity={shellOpacity} />
      <BoxPart position={[0, wallY, 4.87]} size={[4.2, 2.8, 0.2]} color={level === "ground" ? C.stone : C.stucco} opacity={shellOpacity} />
    </>}

    {level === "ground" ? <>
      <WindowModule x={-4.9} y={wallY + 0.1} z={4.99} width={2.0} shellOpacity={shellOpacity} />
      <WindowModule x={4.85} y={wallY + 0.1} z={4.99} width={2.0} shellOpacity={shellOpacity} />
      <BoxPart position={[0, baseY + 1.23, 4.98]} size={[1.65, 2.38, 0.12]} color="#765d47" opacity={Math.max(shellOpacity, 0.45)} roughness={0.44} />
      <BoxPart position={[0, baseY + 2.58, 5.35]} size={[3.2, 0.18, 1.05]} color={C.stoneDark} opacity={shellOpacity} />
      <BoxPart position={[0, baseY + 2.46, 5.88]} size={[2.85, 0.07, 0.12]} color={C.frame} opacity={shellOpacity} metalness={0.35} roughness={0.3} />
      <BoxPart position={[6.2, baseY + 1.4, 4.96]} size={[0.8, 2.8, 0.28]} color={C.stone} opacity={shellOpacity} />
    </> : <>
      <WindowModule x={-4.95} y={wallY + 0.08} z={4.99} width={2.1} shellOpacity={shellOpacity} />
      <WindowModule x={4.95} y={wallY + 0.08} z={4.99} width={2.1} shellOpacity={shellOpacity} />
      <WindowModule x={0} y={wallY + 0.08} z={4.99} width={2.4} shellOpacity={shellOpacity} />
      <Balcony y={baseY + 0.12} shellOpacity={shellOpacity} />
      <BoxPart position={[6.2, wallY, 4.96]} size={[0.8, 2.8, 0.28]} color={C.stone} opacity={shellOpacity} />
    </>}

    <WindowModule x={-6.98} y={wallY + 0.05} z={1.8} width={1.5} shellOpacity={shellOpacity} />
    <WindowModule x={6.98} y={wallY + 0.05} z={-1.8} width={1.5} shellOpacity={shellOpacity} />
    <InteriorPlan baseY={baseY} opacity={selected || cutaway ? 0.7 : 0.28} />
  </group>;
}

function RoofArchitecture({ shellOpacity, cutaway }: { shellOpacity: number; cutaway: boolean }) {
  const y = 9.34;
  return <group>
    <BoxPart position={[0, y, 0]} size={[14.4, 0.28, 10.0]} color={C.concrete} opacity={Math.max(shellOpacity, 0.45)} />
    <BoxPart position={[0, y + 0.55, -4.82]} size={[14.2, 0.9, 0.18]} color={C.stuccoSide} opacity={shellOpacity} />
    <BoxPart position={[-7.0, y + 0.55, 0]} size={[0.18, 0.9, 9.5]} color={C.stuccoSide} opacity={shellOpacity} />
    <BoxPart position={[7.0, y + 0.55, 0]} size={[0.18, 0.9, 9.5]} color={C.stuccoSide} opacity={shellOpacity} />
    {!cutaway && <BoxPart position={[0, y + 0.55, 4.82]} size={[14.2, 0.9, 0.18]} color={C.stucco} opacity={shellOpacity} />}
    <BoxPart position={[3.9, y + 1.25, -2.2]} size={[4.0, 2.4, 3.0]} color="#d7d2c9" opacity={Math.max(shellOpacity, 0.38)} />
    <BoxPart position={[3.9, y + 2.5, -2.2]} size={[4.35, 0.16, 3.35]} color={C.concrete} opacity={Math.max(shellOpacity, 0.42)} />
  </group>;
}

function SiteArchitecture({ shellOpacity }: { shellOpacity: number }) {
  return <group>
    <BoxPart position={[0, -0.32, 0]} size={[22, 0.36, 17]} color="#c8c1b4" opacity={1} roughness={0.95} />
    <BoxPart position={[0, -0.12, 6.4]} size={[8.2, 0.08, 4.0]} color="#9f9d98" opacity={1} roughness={0.9} />
    <BoxPart position={[-8.6, -0.08, 1.0]} size={[3.2, 0.08, 11.0]} color="#8aa07f" opacity={0.9} roughness={0.95} />
    <BoxPart position={[8.7, -0.08, -1.0]} size={[3.0, 0.08, 9.0]} color="#839b7a" opacity={0.9} roughness={0.95} />
    <BoxPart position={[0, 0.72, -7.9]} size={[21.2, 1.5, 0.18]} color="#c9c1b5" opacity={Math.max(shellOpacity, 0.45)} />
    <BoxPart position={[-10.5, 0.72, 0]} size={[0.18, 1.5, 15.6]} color="#c9c1b5" opacity={Math.max(shellOpacity, 0.45)} />
    <BoxPart position={[10.5, 0.72, 0]} size={[0.18, 1.5, 15.6]} color="#c9c1b5" opacity={Math.max(shellOpacity, 0.45)} />
    <BoxPart position={[-6.2, 0.72, 7.8]} size={[8.0, 1.5, 0.18]} color="#c9c1b5" opacity={Math.max(shellOpacity, 0.45)} />
    <BoxPart position={[6.2, 0.72, 7.8]} size={[8.0, 1.5, 0.18]} color="#c9c1b5" opacity={Math.max(shellOpacity, 0.45)} />
    <BoxPart position={[0, 1.05, 7.82]} size={[4.2, 1.9, 0.12]} color={C.frame} opacity={Math.max(shellOpacity, 0.5)} metalness={0.45} roughness={0.28} />
    {[-8.2, 8.2].map((x) => <group key={x}>
      <mesh position={[x, 0.5, 5.5]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 1.1, 12]} />
        <meshStandardMaterial color="#6f5a43" roughness={0.9} />
      </mesh>
      <mesh position={[x, 1.35, 5.5]} castShadow>
        <sphereGeometry args={[0.72, 18, 14]} />
        <meshStandardMaterial color={C.green} roughness={0.92} />
      </mesh>
    </group>)}
  </group>;
}

function ElectricalSystem({ floor, labels }: { floor: FloorKey; labels: boolean }) {
  const showFloor = (key: FloorKey) => floor === "all" || floor === key;
  const floorLevels: Array<[Exclude<FloorKey, "all" | "roof">, number, string]> = [
    ["ground", 0.18, "DB-G"],
    ["first", 3.23, "DB-01"],
    ["second", 6.28, "DB-02"],
  ];

  return <group>
    <BoxPart position={[8.35, 1.0, 5.55]} size={[0.85, 1.5, 0.28]} color="#9a8f7f" roughness={0.52} metalness={0.18} />
    <BoxPart position={[6.35, 1.42, 3.82]} size={[0.85, 1.65, 0.34]} color={C.electric} roughness={0.45} metalness={0.28} />
    <TubeRoute points={[[8.25, 1.0, 5.45], [7.2, 1.0, 5.1], [6.35, 1.2, 3.95]]} radius={0.055} color={C.electric2} />
    <TubeRoute points={[[6.35, 1.65, 3.6], [5.95, 1.65, 3.2], [5.95, 8.2, 3.2], [5.95, 9.7, 1.8]]} radius={0.07} color={C.electric} />
    <BoxPart position={[5.95, 5.0, 3.2]} size={[0.45, 8.0, 0.45]} color="#6b6559" opacity={0.16} />

    {floorLevels.map(([key, base, code]) => showFloor(key) && <group key={key}>
      <BoxPart position={[5.62, base + 1.25, 3.0]} size={[0.48, 0.78, 0.2]} color={C.electric} roughness={0.42} metalness={0.28} />
      <TubeRoute points={[[5.75, base + 2.35, 3.15], [3.5, base + 2.35, 3.15], [0.2, base + 2.35, 3.15], [-4.9, base + 2.35, 3.15], [-4.9, base + 2.35, -3.3], [3.8, base + 2.35, -3.3]]} radius={0.035} color={C.electric2} />
      {[-4.7, -1.6, 1.6, 4.7].map((x, i) => <group key={x}>
        <TubeRoute points={[[x, base + 2.35, 3.1], [x, base + 0.65, 3.1]]} radius={0.018} color={C.electric2} opacity={0.94} />
        <BoxPart position={[x, base + 0.62, 3.98]} size={[0.13, 0.22, 0.05]} color={C.electric} roughness={0.4} metalness={0.14} />
        {i % 2 === 0 && <BoxPart position={[x, base + 2.55, 0.2]} size={[0.65, 0.04, 0.65]} color="#f5e6ad" opacity={0.92} />}
      </group>)}
      {labels && <Label position={[5.2, base + 2.35, 3.15]} code={code} title="لوحة توزيع الدور" detail="إنارة · مخارج · خدمات" color={C.electric} />}
    </group>)}

    {labels && <>
      <Label position={[8.35, 2.1, 5.55]} code="MTR-01" title="عداد الخدمة" detail="نقطة دخول التغذية" color={C.electric} />
      <Label position={[6.35, 2.7, 3.82]} code="MDB-01" title="اللوحة الرئيسية" detail="Main Distribution Board" color={C.electric} />
      <Label position={[5.95, 7.7, 3.2]} code="E-RISER-01" title="رايزر الكهرباء" detail="مسار رأسي بين الأدوار" color={C.electric} />
    </>}
  </group>;
}

function Duct({ position, size, opacity = 1 }: { position: Vec3; size: Vec3; opacity?: number }) {
  return <BoxPart position={position} size={size} color={C.hvac} opacity={opacity} metalness={0.22} roughness={0.38} />;
}

function FanUnit({ position, code, labels }: { position: Vec3; code: string; labels: boolean }) {
  return <group>
    <BoxPart position={position} size={[2.0, 1.0, 1.35]} color="#778782" metalness={0.25} roughness={0.42} />
    <mesh position={[position[0], position[1] + 0.52, position[2]]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.46, 0.46, 0.08, 28]} />
      <meshStandardMaterial color="#46514e" roughness={0.45} metalness={0.36} />
    </mesh>
    {labels && <Label position={[position[0], position[1] + 1.45, position[2]]} code={code} title="وحدة تكثيف" detail="Rooftop condensing unit" color={C.hvac} />}
  </group>;
}

function HvacSystem({ floor, labels }: { floor: FloorKey; labels: boolean }) {
  const showFloor = (key: FloorKey) => floor === "all" || floor === key;
  const levels: Array<[Exclude<FloorKey, "all" | "roof">, number]> = [
    ["ground", 0.18],
    ["first", 3.23],
    ["second", 6.28],
  ];
  return <group>
    <FanUnit position={[-3.6, 10.18, -1.9]} code="RTU-01" labels={labels} />
    <FanUnit position={[-0.95, 10.18, -1.9]} code="RTU-02" labels={labels} />
    <BoxPart position={[3.9, 10.25, -2.15]} size={[2.4, 1.3, 1.55]} color="#83958f" metalness={0.18} roughness={0.42} />
    <TubeRoute points={[[-2.0, 10.2, -1.9], [1.4, 10.2, -1.9], [2.7, 10.25, -2.15]]} radius={0.055} color={C.hvac2} />
    <Duct position={[1.0, 8.2, -3.15]} size={[0.72, 5.7, 0.78]} opacity={0.9} />

    {levels.map(([key, base]) => showFloor(key) && <group key={key}>
      <Duct position={[0.6, base + 2.35, -2.9]} size={[8.8, 0.36, 0.52]} />
      <Duct position={[-3.8, base + 2.35, 0.1]} size={[0.46, 0.34, 6.1]} />
      <Duct position={[2.5, base + 2.35, 0.35]} size={[0.46, 0.34, 6.6]} />
      {[
        [-3.8, base + 2.32, 2.35], [-3.8, base + 2.32, -2.25],
        [2.5, base + 2.32, 2.35], [2.5, base + 2.32, -2.25],
      ].map((p, i) => <BoxPart key={i} position={p as Vec3} size={[0.95, 0.05, 0.38]} color="#d9ebe7" metalness={0.08} roughness={0.32} />)}
      <Line points={[[0.6, base + 2.58, -2.9], [0.6, base + 2.58, 2.8]]} color={C.hvac2} lineWidth={1.7} transparent opacity={0.75} />
      {labels && <Label position={[0.7, base + 3.0, -2.7]} code={`SA-${key === "ground" ? "G" : key === "first" ? "01" : "02"}`} title="دكت التغذية الرئيسي" detail="Supply air → branch ducts → diffusers" color={C.hvac} />}
    </group>)}

    {labels && <>
      <Label position={[3.9, 11.45, -2.15]} code="AHU-01" title="وحدة مناولة الهواء" detail="غرفة خدمات السطح" color={C.hvac} />
      <Label position={[1.0, 7.2, -3.15]} code="M-SHAFT-01" title="شافت ميكانيكي" detail="نزول الدكت الرئيسي" color={C.hvac} />
    </>}
  </group>;
}

function PlumbingSystem({ floor, labels }: { floor: FloorKey; labels: boolean }) {
  const showFloor = (key: FloorKey) => floor === "all" || floor === key;
  const levels: Array<[Exclude<FloorKey, "all" | "roof">, number]> = [
    ["ground", 0.18],
    ["first", 3.23],
    ["second", 6.28],
  ];
  return <group>
    <mesh position={[-4.7, 10.45, -2.45]} castShadow receiveShadow>
      <cylinderGeometry args={[0.9, 0.9, 1.5, 32]} />
      <meshStandardMaterial color="#8ba5aa" roughness={0.5} metalness={0.15} />
    </mesh>
    <mesh position={[-3.0, 9.75, -2.45]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.24, 0.24, 0.55, 24]} />
      <meshStandardMaterial color="#6b8f94" roughness={0.46} metalness={0.22} />
    </mesh>
    <TubeRoute points={[[-4.7, 9.8, -2.45], [-3.0, 9.8, -2.45], [-2.4, 9.8, -2.45], [-2.4, 1.0, -2.45]]} radius={0.065} color={C.water} />
    <TubeRoute points={[[-1.8, 8.8, -2.45], [-1.8, 0.2, -2.45], [-1.8, -0.1, -5.8], [-1.8, -0.1, -8.0]]} radius={0.085} color={C.drain} />

    {levels.map(([key, base]) => showFloor(key) && <group key={key}>
      <TubeRoute points={[[-2.4, base + 1.0, -2.45], [3.6, base + 1.0, -2.45], [3.6, base + 0.65, 1.3], [5.0, base + 0.65, 1.3]]} radius={0.045} color={C.water} />
      <TubeRoute points={[[-2.4, base + 1.0, -2.45], [-4.1, base + 1.0, -2.45], [-4.1, base + 0.65, 1.6]]} radius={0.042} color={C.water} />
      <BoxPart position={[4.65, base + 1.4, -3.2]} size={[0.55, 0.95, 0.45]} color="#b9aaa0" metalness={0.08} roughness={0.48} />
      <TubeRoute points={[[4.65, base + 1.4, -3.2], [3.8, base + 1.35, -2.45], [3.8, base + 1.35, 1.3]]} radius={0.038} color={C.hot} />
      <TubeRoute points={[[5.0, base + 0.18, 1.3], [5.0, base + 0.18, -2.45], [-1.8, base + 0.18, -2.45]]} radius={0.055} color={C.drain} />
      {labels && <Label position={[-2.15, base + 2.0, -2.45]} code={`CW-${key === "ground" ? "G" : key === "first" ? "01" : "02"}`} title="فرع مياه الدور" detail="Cold water branch" color={C.water} />}
    </group>)}

    {labels && <>
      <Label position={[-4.7, 11.55, -2.45]} code="WT-01" title="خزان المياه" detail="خزان علوي للمشهد التجريبي" color={C.water} />
      <Label position={[-3.0, 10.7, -2.45]} code="P-01" title="مضخة تعزيز" detail="Booster pump" color={C.water} />
      <Label position={[-2.4, 7.4, -2.45]} code="CW-RISER" title="رايزر مياه باردة" detail="يغذي الأدوار الثلاثة" color={C.water} />
      <Label position={[-1.8, 6.7, -2.45]} code="SW-RISER" title="رايزر صرف" detail="إلى خط الصرف بالموقع" color={C.drain} />
    </>}
  </group>;
}

function SystemLegend({ system }: { system: SystemKey }) {
  if (system === "architecture") return null;
  const info = systemInfo[system];
  return <Html position={[-8.3, 10.8, 4.9]} transform={false} zIndexRange={[40, 0]}>
    <div className="studio-scene-legend" dir="rtl">
      <span style={{ background: info.color }} />
      <div><small>{info.english}</small><strong>{info.label}</strong></div>
    </div>
  </Html>;
}

function BuildingScene({ system, floor, labels }: { system: SystemKey; floor: FloorKey; labels: boolean }) {
  const cutaway = system !== "architecture";
  const shellOpacity = system === "architecture" ? 1 : 0.14;
  const selectedFloor = (key: FloorKey) => floor === "all" || floor === key;

  return <>
    <ambientLight intensity={0.52} />
    <hemisphereLight intensity={0.5} color="#f7faf8" groundColor="#c5b7a2" />
    <directionalLight castShadow position={[13, 20, 12]} intensity={2.2} shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-near={1} shadow-camera-far={55} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={22} shadow-camera-bottom={-22} />
    <directionalLight position={[-12, 12, -9]} intensity={0.55} color="#d9ebe6" />

    <SiteArchitecture shellOpacity={shellOpacity} />
    <FloorArchitecture level="ground" baseY={floorY.ground} shellOpacity={selectedFloor("ground") ? shellOpacity : 0.07} selected={floor === "ground" || floor === "all"} cutaway={cutaway} />
    <FloorArchitecture level="first" baseY={floorY.first} shellOpacity={selectedFloor("first") ? shellOpacity : 0.07} selected={floor === "first" || floor === "all"} cutaway={cutaway} />
    <FloorArchitecture level="second" baseY={floorY.second} shellOpacity={selectedFloor("second") ? shellOpacity : 0.07} selected={floor === "second" || floor === "all"} cutaway={cutaway} />
    <RoofArchitecture shellOpacity={selectedFloor("roof") ? shellOpacity : 0.08} cutaway={cutaway} />

    {system === "electricity" && <ElectricalSystem floor={floor} labels={labels} />}
    {system === "hvac" && <HvacSystem floor={floor} labels={labels} />}
    {system === "plumbing" && <PlumbingSystem floor={floor} labels={labels} />}

    {system === "architecture" && labels && <>
      <Label position={[0, 4.7, 5.8]} code="A-101" title="الواجهة الرئيسية" detail="حجر · زجاج · شرفات" />
      <Label position={[4.0, 12.25, -2.1]} code="A-301" title="غرفة خدمات السطح" detail="MEP service room" />
      <Label position={[0, 2.2, 6.1]} code="A-001" title="المدخل الرئيسي" detail="مدخل مظلل + بوابة الموقع" />
    </>}
    <SystemLegend system={system} />

    <Grid position={[0, -0.48, 0]} args={[42, 42]} cellSize={0.5} cellThickness={0.38} cellColor="#b8c5c1" sectionSize={2} sectionThickness={0.75} sectionColor="#8ba39b" fadeDistance={36} fadeStrength={1.1} infiniteGrid />
    <ContactShadows position={[0, -0.42, 0]} opacity={0.32} scale={35} blur={2.2} far={22} />
  </>;
}

function resolveCamera(system: SystemKey, floor: FloorKey, preset: ViewPreset): CameraTarget {
  const y = floor === "ground" ? 1.7 : floor === "first" ? 4.7 : floor === "second" ? 7.75 : floor === "roof" ? 10.3 : 5.2;
  if (preset === "top") return { camera: [0.2, 29, 0.2], target: [0, floor === "all" ? 4.7 : y, 0] };
  if (preset === "front") return { camera: [0, floor === "all" ? 7.4 : y + 1.5, 25], target: [0, y, 0] };
  if (preset === "walk") return { camera: [-8.4, Math.max(2.1, y), 9.8], target: [0, y - 0.2, 0] };
  if (system === "electricity") return { camera: [18.5, 11.8, 18], target: [3.4, y, 0.8] };
  if (system === "hvac") return { camera: [15.5, 14.8, -18.5], target: [0.6, floor === "all" ? 6.2 : y + 0.7, -1.5] };
  if (system === "plumbing") return { camera: [-18.5, 12.6, 16.5], target: [-1.5, floor === "all" ? 5.8 : y, -1.2] };
  return { camera: [20.5, 13.8, 23], target: [0, floor === "all" ? 4.7 : y, 0] };
}

function StudioCanvas({ system, floor, labels, preset, nonce }: { system: SystemKey; floor: FloorKey; labels: boolean; preset: ViewPreset; nonce: number }) {
  const controlsRef = useRef<any>(null);
  const desired = useMemo(() => resolveCamera(system, floor, preset), [system, floor, preset]);
  return <Canvas
    shadows
    dpr={[1, 1.7]}
    gl={{ antialias: true, powerPreference: "high-performance" }}
    camera={{ position: desired.camera, fov: 34, near: 0.1, far: 150 }}
    onCreated={({ gl }) => {
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1.02;
      gl.outputColorSpace = THREE.SRGBColorSpace;
    }}
  >
    <color attach="background" args={["#e8eeeb"]} />
    <fog attach="fog" args={["#e8eeeb", 34, 68]} />
    <CameraRig desired={desired} nonce={nonce} controlsRef={controlsRef} />
    <BuildingScene system={system} floor={floor} labels={labels} />
    <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.075} minDistance={6} maxDistance={42} minPolarAngle={0.12} maxPolarAngle={Math.PI / 2.04} screenSpacePanning enablePan />
  </Canvas>;
}

export function DigitalTwinStudioPage() {
  const [system, setSystem] = useState<SystemKey>("architecture");
  const [floor, setFloor] = useState<FloorKey>("all");
  const [preset, setPreset] = useState<ViewPreset>("iso");
  const [labels, setLabels] = useState(true);
  const [nonce, setNonce] = useState(0);
  const info = systemInfo[system];

  const selectSystem = (next: SystemKey) => {
    setSystem(next);
    setPreset(next === "architecture" ? "iso" : "front");
    setLabels(true);
    setNonce((n) => n + 1);
  };

  return <main className="twin-studio-page" dir="rtl">
    <header className="twin-studio-topbar">
      <div className="twin-studio-brand">
        <Link href="/unit" className="twin-studio-back"><ArrowLeft size={17} /> العودة لمسكني</Link>
        <div><small>DIGITAL TWIN · ENGINEERING VIEW</small><h1>التوأم الرقمي الهندسي</h1><p>نموذج 3D مولّد لشرح المعماري ومسارات MEP داخل مبنى سكني كامل.</p></div>
      </div>
      <div className="twin-studio-warning"><Info size={16} /><span>تصور تجريبي مولّد — ليس مخطط تنفيذ أو اعتماد هندسي.</span></div>
    </header>

    <nav className="twin-studio-system-nav" aria-label="أنظمة المبنى">
      {(Object.keys(systemInfo) as SystemKey[]).map((key) => {
        const Icon = key === "architecture" ? Building2 : key === "electricity" ? Zap : key === "hvac" ? Wind : Droplets;
        return <button key={key} className={system === key ? "active" : ""} onClick={() => selectSystem(key)} style={{ "--system-color": systemInfo[key].color } as React.CSSProperties}>
          <Icon size={18} /><span><small>{systemInfo[key].english}</small><strong>{systemInfo[key].label}</strong></span>
        </button>;
      })}
    </nav>

    <section className="twin-studio-workspace">
      <div className="twin-studio-viewer">
        <div className="twin-studio-viewbar">
          <div className="twin-studio-floor-tabs" aria-label="اختيار الدور">
            {floorMeta.map((item) => <button key={item.key} className={floor === item.key ? "active" : ""} onClick={() => { setFloor(item.key); setNonce((n) => n + 1); }}><b>{item.short}</b><span>{item.label}</span></button>)}
          </div>
          <div className="twin-studio-camera-actions">
            <button className={preset === "iso" ? "active" : ""} onClick={() => { setPreset("iso"); setNonce((n) => n + 1); }}><Maximize2 size={15} /> منظور</button>
            <button className={preset === "top" ? "active" : ""} onClick={() => { setPreset("top"); setNonce((n) => n + 1); }}><Grid3X3 size={15} /> علوي</button>
            <button className={preset === "front" ? "active" : ""} onClick={() => { setPreset("front"); setNonce((n) => n + 1); }}><Box size={15} /> مقطع</button>
            <button className={preset === "walk" ? "active" : ""} onClick={() => { setPreset("walk"); setNonce((n) => n + 1); }}><Home size={15} /> قريب</button>
            <button onClick={() => setLabels((v) => !v)}>{labels ? <Eye size={15} /> : <EyeOff size={15} />} التسميات</button>
            <button onClick={() => setNonce((n) => n + 1)}><Focus size={15} /> تركيز</button>
            <button onClick={() => { setFloor("all"); setPreset("iso"); setNonce((n) => n + 1); }}><RotateCcw size={15} /> إعادة</button>
          </div>
        </div>

        <div className="twin-studio-canvas">
          <StudioCanvas system={system} floor={floor} labels={labels} preset={preset} nonce={nonce} />
          <div className="twin-studio-hud primary"><span style={{ background: info.color }} /><div><small>{info.english}</small><strong>{info.label}</strong></div></div>
          <div className="twin-studio-hud help"><span>اسحب للدوران</span><i /><span>قرّب بإصبعين</span><i /><span>اختر النظام لكشف مساره</span></div>
        </div>
      </div>

      <aside className="twin-studio-inspector">
        <div className="twin-studio-inspector-head">
          <span className="twin-studio-system-icon" style={{ color: info.color, borderColor: info.color }}>{system === "architecture" ? <Building2 size={20} /> : system === "electricity" ? <Zap size={20} /> : system === "hvac" ? <Wind size={20} /> : <Droplets size={20} />}</span>
          <div><small>{info.english}</small><h2>{info.label}</h2></div>
          <CheckCircle2 size={17} className="twin-studio-ok" />
        </div>
        <p className="twin-studio-description">{info.description}</p>

        <section className="twin-studio-route">
          <div className="studio-inspector-title"><Layers3 size={15} /><h3>المسار داخل المبنى</h3></div>
          <div className="twin-studio-route-flow">
            {info.path.map((step, index) => <div key={step}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong>{index < info.path.length - 1 && <i />}</div>)}
          </div>
        </section>

        <section className="twin-studio-components">
          <div className="studio-inspector-title"><Grid3X3 size={15} /><h3>العناصر الظاهرة</h3></div>
          <div className="twin-studio-component-list">
            {info.components.map((component) => <article key={component.code}>
              <span>{component.code}</span><div><strong>{component.name}</strong><small>{component.detail}</small></div>
            </article>)}
          </div>
        </section>

        <section className="twin-studio-reading">
          <div><span>الدور المعروض</span><strong>{floorMeta.find((item) => item.key === floor)?.label}</strong></div>
          <div><span>وضع الرؤية</span><strong>{system === "architecture" ? "واجهة كاملة" : "Cutaway · كشف الخدمات"}</strong></div>
          <div><span>مصدر البيانات</span><strong>Generated demo</strong></div>
        </section>
      </aside>
    </section>
  </main>;
}

export default DigitalTwinStudioPage;
