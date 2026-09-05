import {
  ContactShadows,
  Html,
  Line,
  OrbitControls,
  RoundedBox,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ArrowLeft,
  BedDouble,
  Building2,
  Cable,
  ChevronDown,
  ChevronLeft,
  CircleDot,
  Droplets,
  Eye,
  EyeOff,
  Focus,
  Home,
  Layers3,
  PanelTop,
  RotateCcw,
  ScanLine,
  ShowerHead,
  Sofa,
  SquareStack,
  UtensilsCrossed,
  Waves,
  Wind,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { Link } from "wouter";
import * as THREE from "three";
import "../engineering-twin-v6.css";

type Vec3 = [number, number, number];
type FloorKey = "all" | "ground" | "first" | "second" | "roof";
type RoomId = "all" | "living" | "kitchen" | "master" | "bedroom" | "bath";
type SystemKey = "building" | "electricity" | "grounding" | "hvac" | "water" | "drainage";
type ViewPreset = "iso" | "top" | "front" | "walk";
type NodeKind = "source" | "meter" | "panel" | "riser" | "branch" | "device" | "equipment" | "terminal";
type FloorInfo = { key: FloorKey; label: string; short: string };
type RoomInfo = { id: Exclude<RoomId, "all">; name: string; short: string; x: number; z: number; w: number; d: number };
type NodeInfo = {
  id: string;
  system: Exclude<SystemKey, "building">;
  code: string;
  title: string;
  detail: string;
  position: Vec3;
  kind: NodeKind;
  floor?: Exclude<FloorKey, "all">;
  room?: Exclude<RoomId, "all">;
  parentId?: string;
};
type CameraTarget = { camera: Vec3; target: Vec3 };

const C = {
  bg: "#f7f9f8",
  brand: "#0b6659",
  wall: "#f2eee6",
  wall2: "#e7e0d5",
  slab: "#b8b5ad",
  wood: "#a98568",
  stone: "#c7baa9",
  glass: "#9fc9d2",
  electrical: "#e7ad2f",
  electricalBright: "#ffd96f",
  grounding: "#5b9270",
  hvac: "#5d9f9a",
  water: "#3e94c3",
  hot: "#cf6d5d",
  drainage: "#687575",
};

const floors: FloorInfo[] = [
  { key: "all", label: "المبنى كامل", short: "ALL" },
  { key: "ground", label: "الدور الأرضي", short: "G" },
  { key: "first", label: "الدور الأول", short: "01" },
  { key: "second", label: "الدور الثاني", short: "02" },
  { key: "roof", label: "السطح والخدمات", short: "R" },
];

const floorY: Record<Exclude<FloorKey, "all">, number> = {
  ground: 0.2,
  first: 3.45,
  second: 6.7,
  roof: 9.95,
};

const rooms: Record<Exclude<RoomId, "all">, RoomInfo> = {
  living: { id: "living", name: "المجلس والمعيشة", short: "LIV", x: -3.65, z: 1.8, w: 6, d: 4.35 },
  kitchen: { id: "kitchen", name: "المطبخ", short: "KIT", x: 3.65, z: 1.8, w: 5.25, d: 4.35 },
  master: { id: "master", name: "غرفة النوم الرئيسية", short: "MBR", x: -4, z: -2.35, w: 4.9, d: 3.2 },
  bedroom: { id: "bedroom", name: "غرفة النوم", short: "BR2", x: 0.45, z: -2.35, w: 3.35, d: 3.2 },
  bath: { id: "bath", name: "دورة المياه", short: "BTH", x: 4.5, z: -2.35, w: 2.35, d: 3.2 },
};

const roomIds = Object.keys(rooms) as Array<Exclude<RoomId, "all">>;

const systemMeta: Record<SystemKey, { label: string; en: string; color: string; description: string }> = {
  building: { label: "المبنى", en: "BUILDING", color: C.brand, description: "الهيكل والأثاث كطبقة أساسية." },
  electricity: { label: "الكهرباء", en: "ELECTRICAL", color: C.electrical, description: "من الخدمة والعداد حتى اللوحات والدوائر والنقاط." },
  grounding: { label: "التأريض والحماية", en: "EARTHING", color: C.grounding, description: "حلقة التأريض وMET وموصلات الحماية." },
  hvac: { label: "التكييف والتهوية", en: "HVAC", color: C.hvac, description: "معدات السطح والشافت والدكت ومخارج الهواء." },
  water: { label: "المياه", en: "DOMESTIC WATER", color: C.water, description: "الخزان والمضخة والرايزر ونقاط الاستخدام." },
  drainage: { label: "الصرف الصحي", en: "DRAINAGE", color: C.drainage, description: "النقاط والفروع والـstack وغرفة التفتيش." },
};

const systemIcons: Record<SystemKey, typeof Building2> = {
  building: Building2,
  electricity: Zap,
  grounding: Cable,
  hvac: Wind,
  water: Droplets,
  drainage: Wrench,
};

function fy(floor: Exclude<FloorKey, "all">, exploded: boolean) {
  const i = floor === "ground" ? 0 : floor === "first" ? 1 : floor === "second" ? 2 : 3;
  return floorY[floor] + (exploded ? i * 1.45 : 0);
}

function displayNodePosition(node: NodeInfo, exploded: boolean): Vec3 {
  if (!node.floor) return node.position;
  const delta = fy(node.floor, exploded) - floorY[node.floor];
  return [node.position[0], node.position[1] + delta, node.position[2]];
}

function makeNodes(): NodeInfo[] {
  const n: NodeInfo[] = [
    { id: "elec-service", system: "electricity", code: "SERVICE", title: "مصدر الخدمة", detail: "دخول التغذية الكهربائية إلى حدود المبنى.", position: [-9.2, 0.8, 5.7], kind: "source" },
    { id: "elec-meter", system: "electricity", code: "MTR-01", title: "عداد الكهرباء", detail: "عداد الطاقة الرئيسي قبل لوحة التوزيع.", position: [-7.9, 1.25, 4.9], kind: "meter", parentId: "elec-service" },
    { id: "elec-mdb", system: "electricity", code: "MDB-01", title: "لوحة التوزيع الرئيسية", detail: "القاطع الرئيسي وتوزيع التغذية إلى لوحات الأدوار.", position: [-6.35, 1.6, 3.45], kind: "panel", parentId: "elec-meter" },
    { id: "elec-riser", system: "electricity", code: "E-RISER", title: "مسار التغذية الرأسي", detail: "كابل رأسي يربط MDB بلوحات الأدوار.", position: [-5.75, 5.2, 2.65], kind: "riser", parentId: "elec-mdb" },
    { id: "earth-ring", system: "grounding", code: "GR-01", title: "حلقة التأريض", detail: "موصل أرضي محيطي يربط أقطاب التأريض.", position: [-7.2, 0.1, 5.3], kind: "source" },
    { id: "earth-met", system: "grounding", code: "MET-01", title: "نقطة التأريض الرئيسية", detail: "نقطة تجميع موصلات الحماية والربط.", position: [-6.25, 0.75, 3.35], kind: "panel", parentId: "earth-ring" },
    { id: "earth-riser", system: "grounding", code: "PE-RISER", title: "موصل الحماية الرأسي", detail: "يمتد من MET إلى لوحات الأدوار.", position: [-5.95, 5.1, 2.82], kind: "riser", parentId: "earth-met" },
    { id: "hvac-rtu", system: "hvac", code: "RTU-01", title: "وحدة تكييف السطح", detail: "وحدة معالجة وتبريد الهواء على السطح.", position: [4.4, 10.9, -2.6], kind: "equipment" },
    { id: "hvac-shaft", system: "hvac", code: "M-SHAFT", title: "الشافت الميكانيكي", detail: "الممر الرأسي للدكت بين السطح والأدوار.", position: [1.05, 5.25, -3.55], kind: "riser", parentId: "hvac-rtu" },
    { id: "water-tank", system: "water", code: "WT-01", title: "خزان المياه", detail: "خزان السطح المغذي لشبكة المياه المنزلية.", position: [-4.25, 11.25, -2.65], kind: "source" },
    { id: "water-pump", system: "water", code: "P-01", title: "مضخة المياه", detail: "مضخة رفع الضغط وتغذية الرايزر.", position: [-3, 10.55, -2.65], kind: "equipment", parentId: "water-tank" },
    { id: "water-riser", system: "water", code: "CW-RISER", title: "رايزر المياه", detail: "خط رأسي يوزع المياه إلى فروع الأدوار.", position: [-2.55, 5.1, -2.65], kind: "riser", parentId: "water-pump" },
    { id: "drain-stack", system: "drainage", code: "SW-01", title: "رايزر الصرف", detail: "Soil/Waste stack يستقبل فروع الصرف.", position: [-1.45, 4.8, -3.25], kind: "riser" },
    { id: "drain-mh", system: "drainage", code: "MH-01", title: "غرفة التفتيش", detail: "نقطة فحص وتجميع قبل خط الصرف الخارجي.", position: [-1.45, 0.1, -7.5], kind: "terminal", parentId: "drain-stack" },
    { id: "drain-site", system: "drainage", code: "SITE-SEWER", title: "خط الصرف الخارجي", detail: "الربط من غرفة التفتيش إلى شبكة الموقع.", position: [5.5, 0.02, -8.5], kind: "terminal", parentId: "drain-mh" },
  ];

  const defs: Array<{ f: "ground" | "first" | "second"; code: string }> = [
    { f: "ground", code: "G" },
    { f: "first", code: "01" },
    { f: "second", code: "02" },
  ];

  defs.forEach(({ f, code }) => {
    const y = floorY[f];
    n.push({ id: `elec-db-${f}`, system: "electricity", code: `DB-${code}`, title: `لوحة ${floors.find(x => x.key === f)?.label}`, detail: "لوحة فرعية لدوائر الإنارة والمقابس والأحمال.", position: [-5.35, y + 2.1, 2.65], kind: "panel", floor: f, parentId: "elec-riser" });
    n.push({ id: `earth-pe-${f}`, system: "grounding", code: `PE-${code}`, title: `تأريض ${floors.find(x => x.key === f)?.label}`, detail: "موصل حماية PE للوحة الدور والأجزاء المعدنية.", position: [-5.55, y + 2, 2.85], kind: "branch", floor: f, parentId: "earth-riser" });
    n.push({ id: `hvac-duct-${f}`, system: "hvac", code: `DUCT-${code}`, title: `دكت ${floors.find(x => x.key === f)?.label}`, detail: "الدكت الرئيسي قبل تفرعه إلى الغرف.", position: [0.9, y + 2.5, 0.3], kind: "branch", floor: f, parentId: "hvac-shaft" });
    n.push({ id: `water-branch-${f}`, system: "water", code: `CW-${code}`, title: `فرع مياه ${floors.find(x => x.key === f)?.label}`, detail: "فرع توزيع المياه الباردة والساخنة.", position: [-1.4, y + 0.55, -2.55], kind: "branch", floor: f, parentId: "water-riser" });
    n.push({ id: `drain-branch-${f}`, system: "drainage", code: `WASTE-${code}`, title: `صرف ${floors.find(x => x.key === f)?.label}`, detail: "فرع صرف أفقي من المناطق الرطبة إلى الـstack.", position: [1.6, y + 0.3, -2.8], kind: "branch", floor: f, parentId: "drain-stack" });

    roomIds.forEach(roomId => {
      const r = rooms[roomId];
      n.push({ id: `elec-circuit-${f}-${roomId}`, system: "electricity", code: `C-${code}-${r.short}`, title: `دائرة ${r.name}`, detail: "دائرة نهائية من لوحة الدور إلى نقاط الغرفة.", position: [r.x, y + 2.55, r.z], kind: "branch", floor: f, room: roomId, parentId: `elec-db-${f}` });
      n.push({ id: `elec-light-${f}-${roomId}`, system: "electricity", code: `L-${code}-${r.short}`, title: `إنارة ${r.name}`, detail: "وحدة إنارة سقفية مرتبطة بمفتاح الغرفة.", position: [r.x, y + 2.82, r.z], kind: "device", floor: f, room: roomId, parentId: `elec-circuit-${f}-${roomId}` });
      n.push({ id: `elec-switch-${f}-${roomId}`, system: "electricity", code: `SW-${code}-${r.short}`, title: `مفتاح ${r.name}`, detail: "مفتاح جداري للتحكم بالإنارة.", position: [r.x - r.w * 0.32, y + 1.1, r.z + r.d * 0.38], kind: "device", floor: f, room: roomId, parentId: `elec-circuit-${f}-${roomId}` });
      n.push({ id: `elec-outlet-${f}-${roomId}`, system: "electricity", code: `SO-${code}-${r.short}`, title: `مقبس ${r.name}`, detail: "مقبس قدرة نهائي ضمن دائرة المقابس.", position: [r.x + r.w * 0.32, y + 0.55, r.z - r.d * 0.32], kind: "device", floor: f, room: roomId, parentId: `elec-circuit-${f}-${roomId}` });
      n.push({ id: `hvac-diff-${f}-${roomId}`, system: "hvac", code: `D-${code}-${r.short}`, title: `مخرج هواء ${r.name}`, detail: "Diffuser سقفي يوزع الهواء المكيّف.", position: [r.x, y + 2.72, r.z], kind: "terminal", floor: f, room: roomId, parentId: `hvac-duct-${f}` });
      if (roomId === "kitchen" || roomId === "bath") {
        n.push({ id: `water-fix-${f}-${roomId}`, system: "water", code: `FX-${code}-${r.short}`, title: `نقطة مياه ${r.name}`, detail: "نقطة استخدام للمياه الباردة والساخنة.", position: [r.x, y + 0.85, r.z], kind: "terminal", floor: f, room: roomId, parentId: `water-branch-${f}` });
        n.push({ id: `drain-fix-${f}-${roomId}`, system: "drainage", code: `DF-${code}-${r.short}`, title: `نقطة صرف ${r.name}`, detail: "نقطة صرف تتجه إلى فرع الدور ثم الـstack.", position: [r.x, y + 0.22, r.z], kind: "source", floor: f, room: roomId, parentId: `drain-branch-${f}` });
      }
    });
  });

  return n;
}

const allNodes = makeNodes();
const nodeMap = new Map(allNodes.map(n => [n.id, n]));

const chainIds: Record<Exclude<SystemKey, "building">, string[]> = {
  electricity: ["elec-service", "elec-meter", "elec-mdb", "elec-riser", "elec-db-ground", "elec-circuit-ground-living", "elec-light-ground-living"],
  grounding: ["earth-ring", "earth-met", "earth-riser", "earth-pe-ground"],
  hvac: ["hvac-rtu", "hvac-shaft", "hvac-duct-ground", "hvac-diff-ground-living"],
  water: ["water-tank", "water-pump", "water-riser", "water-branch-ground", "water-fix-ground-kitchen"],
  drainage: ["drain-fix-ground-kitchen", "drain-branch-ground", "drain-stack", "drain-mh", "drain-site"],
};

function Box({ p, s, color, opacity = 1, metalness = 0.02, roughness = 0.72, radius = 0.035, emissive, emissiveIntensity = 0, onClick }: {
  p: Vec3;
  s: Vec3;
  color: string;
  opacity?: number;
  metalness?: number;
  roughness?: number;
  radius?: number;
  emissive?: string;
  emissiveIntensity?: number;
  onClick?: () => void;
}) {
  return (
    <RoundedBox
      args={s}
      radius={Math.min(radius, ...s) / 2}
      smoothness={2}
      position={p}
      castShadow={opacity > 0.3}
      receiveShadow
      onClick={onClick ? e => { e.stopPropagation(); onClick(); } : undefined}
    >
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        metalness={metalness}
        roughness={roughness}
        emissive={emissive ?? "#000"}
        emissiveIntensity={emissiveIntensity}
        depthWrite={opacity > 0.22}
      />
    </RoundedBox>
  );
}

function Cylinder({ p, r, h, color, opacity = 1, metalness = 0.08, roughness = 0.5, rot = [0, 0, 0], onClick }: {
  p: Vec3;
  r: number;
  h: number;
  color: string;
  opacity?: number;
  metalness?: number;
  roughness?: number;
  rot?: Vec3;
  onClick?: () => void;
}) {
  return (
    <mesh position={p} rotation={rot} castShadow receiveShadow onClick={onClick ? e => { e.stopPropagation(); onClick(); } : undefined}>
      <cylinderGeometry args={[r, r, h, 24]} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
}

function Tube({ points, color, radius = 0.055, opacity = 1 }: { points: Vec3[]; color: string; radius?: number; opacity?: number }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, "catmullrom", 0.08), [points]);
  return (
    <mesh castShadow={opacity > 0.55}>
      <tubeGeometry args={[curve, Math.max(24, points.length * 12), radius, 12, false]} />
      <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} roughness={0.36} metalness={0.12} />
    </mesh>
  );
}

function CableRun({ points, active = true, width = 1.45 }: { points: Vec3[]; active?: boolean; width?: number }) {
  return (
    <group>
      <Line points={points} color={active ? "#67522b" : "#aaa59b"} lineWidth={width + 2.3} transparent opacity={active ? 0.65 : 0.22} />
      <Line points={points} color={active ? C.electricalBright : "#c8c3ba"} lineWidth={width} transparent opacity={active ? 1 : 0.32} />
    </group>
  );
}

function FlowDots({ points, color, count = 6, speed = 0.08, size = 0.05 }: { points: Vec3[]; color: string; count?: number; speed?: number; size?: number }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, "catmullrom", 0.08), [points]);
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    ref.current?.children.forEach((child, i) => child.position.copy(curve.getPointAt((clock.elapsedTime * speed + i / count) % 1)));
  });
  return (
    <group ref={ref}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[size, 10, 8]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Glass({ p, s, opacity = 0.38 }: { p: Vec3; s: Vec3; opacity?: number }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshPhysicalMaterial color="#cce7eb" transmission={0.12} transparent opacity={opacity} roughness={0.08} metalness={0} />
    </mesh>
  );
}

function WorldLabel({ node, selected, onSelect, exploded }: { node: NodeInfo; selected: boolean; onSelect: (id: string) => void; exploded: boolean }) {
  const p = displayNodePosition(node, exploded);
  return (
    <Html position={p} center distanceFactor={10} zIndexRange={[40, 0]}>
      <button className={`v6-world-label ${selected ? "selected" : ""}`} onClick={() => onSelect(node.id)} dir="rtl">
        <small>{node.code}</small>
        <strong>{node.title}</strong>
      </button>
    </Html>
  );
}

function Site() {
  return (
    <group>
      <Box p={[0, -0.24, 0]} s={[31, 0.38, 25]} color="#edf1ec" roughness={1} />
      <Box p={[0, -0.02, 8.7]} s={[31, 0.08, 5.8]} color="#d9ddda" roughness={0.95} />
      <Box p={[0, 0.02, 5.75]} s={[18, 0.1, 1.2]} color="#d4cdc1" roughness={0.88} />
      {[[ -10, 2.2 ], [ 10.4, 1.8 ], [ -10.4, -5.3 ], [ 10.2, -5.1 ]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Cylinder p={[0, 0.85, 0]} r={0.14} h={1.7} color="#7e6048" roughness={0.9} />
          <mesh position={[0, 2.05, 0]} castShadow>
            <sphereGeometry args={[0.88, 18, 14]} />
            <meshStandardMaterial color="#769071" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SofaSet({ y, opacity }: { y: number; opacity: number }) {
  const cushion = "#c8b9ab";
  return (
    <group>
      <Box p={[-4.1, y + 0.26, 2.7]} s={[2.85, 0.32, 1.02]} color="#8e7969" opacity={opacity} radius={0.12} />
      <Box p={[-5.43, y + 0.58, 2.7]} s={[0.2, 0.62, 1.02]} color="#9c8879" opacity={opacity} radius={0.08} />
      <Box p={[-2.77, y + 0.58, 2.7]} s={[0.2, 0.62, 1.02]} color="#9c8879" opacity={opacity} radius={0.08} />
      {[-4.98, -4.1, -3.22].map((x, i) => <Box key={`seat-${i}`} p={[x, y + 0.52, 2.72]} s={[0.78, 0.22, 0.82]} color={cushion} opacity={opacity} radius={0.1} />)}
      {[-4.98, -4.1, -3.22].map((x, i) => <Box key={`back-${i}`} p={[x, y + 0.92, 2.33]} s={[0.78, 0.68, 0.16]} color="#b4a394" opacity={opacity} radius={0.1} />)}
      <Box p={[-2.55, y + 0.31, 0.95]} s={[1.38, 0.18, 0.82]} color="#9a795e" opacity={opacity} radius={0.06} />
      <Box p={[-2.55, y + 0.19, 0.95]} s={[0.08, 0.38, 0.08]} color="#51463d" opacity={opacity} />
      <Box p={[-1.35, y + 0.5, 2.55]} s={[0.82, 0.42, 0.3]} color="#765e4e" opacity={opacity} radius={0.05} />
      <Box p={[-1.35, y + 1.12, 2.42]} s={[1.18, 0.72, 0.07]} color="#252b2b" opacity={opacity} metalness={0.12} roughness={0.24} />
      <Box p={[-1.35, y + 1.12, 2.375]} s={[1.02, 0.56, 0.025]} color="#111616" opacity={opacity} metalness={0.05} roughness={0.12} />
      <Box p={[-4.1, y + 0.205, 1.75]} s={[3.5, 0.025, 1.55]} color="#d8c8b5" opacity={opacity * 0.82} roughness={1} />
    </group>
  );
}

function KitchenSet({ y, opacity }: { y: number; opacity: number }) {
  return (
    <group>
      <Box p={[5.65, y + 0.46, 1.5]} s={[0.72, 0.88, 3.2]} color="#dfdbd3" opacity={opacity} radius={0.03} />
      <Box p={[3.55, y + 0.46, 3.55]} s={[3.65, 0.88, 0.72]} color="#dfdbd3" opacity={opacity} radius={0.03} />
      <Box p={[5.65, y + 0.94, 1.5]} s={[0.78, 0.09, 3.28]} color="#716a64" opacity={opacity} roughness={0.32} />
      <Box p={[3.55, y + 0.94, 3.55]} s={[3.75, 0.09, 0.78]} color="#716a64" opacity={opacity} roughness={0.32} />
      <Box p={[3.45, y + 0.47, 1.2]} s={[2.2, 0.88, 0.9]} color="#e7e1d8" opacity={opacity} radius={0.04} />
      <Box p={[3.45, y + 0.94, 1.2]} s={[2.28, 0.08, 0.98]} color="#8a8178" opacity={opacity} roughness={0.28} />
      <Box p={[2.4, y + 0.78, 3.38]} s={[0.82, 1.55, 0.68]} color="#bcc2c1" opacity={opacity} metalness={0.42} roughness={0.25} />
      <Box p={[2.4, y + 1.0, 3.02]} s={[0.42, 0.04, 0.025]} color="#5a6261" opacity={opacity} metalness={0.5} roughness={0.18} />
      <Box p={[4.23, y + 0.99, 3.55]} s={[0.92, 0.035, 0.52]} color="#333b3a" opacity={opacity} metalness={0.22} roughness={0.18} />
      {[3.95, 4.18, 4.42, 4.65].map((x, i) => <Cylinder key={i} p={[x, y + 1.025, 3.55]} r={0.07} h={0.015} color="#111716" opacity={opacity} metalness={0.35} roughness={0.2} />)}
      <Box p={[5.2, y + 0.985, 3.55]} s={[0.72, 0.025, 0.42]} color="#c4c7c6" opacity={opacity} metalness={0.5} roughness={0.18} />
      <Tube points={[[5.15, y + 1.02, 3.55], [5.15, y + 1.28, 3.55], [5.38, y + 1.28, 3.55]]} color="#8f9896" radius={0.025} opacity={opacity} />
      {[2.75, 4.15].map((x, i) => (
        <group key={i}>
          <Cylinder p={[x, y + 0.45, 0.62]} r={0.24} h={0.1} color="#9a806d" opacity={opacity} />
          <Cylinder p={[x, y + 0.2, 0.62]} r={0.055} h={0.5} color="#5e554d" opacity={opacity} />
        </group>
      ))}
    </group>
  );
}

function BedSet({ roomId, y, opacity }: { roomId: "master" | "bedroom"; y: number; opacity: number }) {
  const x = roomId === "master" ? -4.15 : 0.45;
  const w = roomId === "master" ? 2.3 : 1.75;
  return (
    <group>
      <Box p={[x, y + 0.22, -2.55]} s={[w, 0.36, 2.1]} color="#7a5e49" opacity={opacity} radius={0.06} />
      <Box p={[x, y + 0.49, -2.55]} s={[w - 0.08, 0.25, 1.98]} color="#efeae2" opacity={opacity} radius={0.12} />
      <Box p={[x, y + 0.65, -2.25]} s={[w - 0.12, 0.12, 1.25]} color="#d9c8b7" opacity={opacity} radius={0.08} />
      <Box p={[x, y + 0.88, -3.46]} s={[w, 1.16, 0.16]} color="#8d7663" opacity={opacity} radius={0.08} />
      <Box p={[x - w * 0.27, y + 0.72, -3.05]} s={[w * 0.38, 0.15, 0.42]} color="#f7f3ec" opacity={opacity} radius={0.12} />
      <Box p={[x + w * 0.27, y + 0.72, -3.05]} s={[w * 0.38, 0.15, 0.42]} color="#f7f3ec" opacity={opacity} radius={0.12} />
      <Box p={[x - w * 0.72, y + 0.34, -3.0]} s={[0.44, 0.52, 0.48]} color="#80664f" opacity={opacity} radius={0.04} />
      <Cylinder p={[x - w * 0.72, y + 0.73, -3.0]} r={0.14} h={0.28} color="#ded0be" opacity={opacity} />
      <Box p={[x, y + 0.205, -1.7]} s={[w + 0.65, 0.02, 2.75]} color="#d4c1aa" opacity={opacity * 0.7} />
    </group>
  );
}

function BathSet({ y, opacity }: { y: number; opacity: number }) {
  return (
    <group>
      <Box p={[5.05, y + 0.44, -1.62]} s={[0.95, 0.78, 0.5]} color="#e1ded7" opacity={opacity} radius={0.05} />
      <Box p={[5.05, y + 0.86, -1.62]} s={[0.9, 0.06, 0.52]} color="#a8a49c" opacity={opacity} roughness={0.28} />
      <Cylinder p={[5.05, y + 0.9, -1.62]} r={0.2} h={0.04} color="#f0eeea" opacity={opacity} />
      <Tube points={[[5.05, y + 0.93, -1.62], [5.05, y + 1.16, -1.62], [5.22, y + 1.16, -1.62]]} color="#9ba2a0" radius={0.02} opacity={opacity} />
      <Box p={[3.9, y + 0.26, -3.0]} s={[0.68, 0.38, 0.9]} color="#f1efea" opacity={opacity} radius={0.16} />
      <Box p={[3.9, y + 0.58, -3.33]} s={[0.62, 0.68, 0.32]} color="#e8e6e1" opacity={opacity} radius={0.12} />
      <Glass p={[5.35, y + 1.35, -3.25]} s={[0.05, 2, 1.1]} opacity={opacity * 0.48} />
      <Tube points={[[5.65, y + 0.55, -3.45], [5.65, y + 1.7, -3.45], [5.45, y + 1.7, -3.45]]} color="#979f9d" radius={0.018} opacity={opacity} />
      <Cylinder p={[5.36, y + 1.7, -3.45]} r={0.1} h={0.035} color="#b0b7b5" opacity={opacity} rot={[0, 0, Math.PI / 2]} />
    </group>
  );
}

function Furniture({ y, room, contextOpacity }: { y: number; room: RoomId; contextOpacity: number }) {
  const show = (id: Exclude<RoomId, "all">) => room === "all" || room === id;
  return (
    <group>
      {show("living") && <SofaSet y={y} opacity={contextOpacity} />}
      {show("kitchen") && <KitchenSet y={y} opacity={contextOpacity} />}
      {show("master") && <BedSet roomId="master" y={y} opacity={contextOpacity} />}
      {show("bedroom") && <BedSet roomId="bedroom" y={y} opacity={contextOpacity} />}
      {show("bath") && <BathSet y={y} opacity={contextOpacity} />}
    </group>
  );
}

function Window({ x, y, z, opacity }: { x: number; y: number; z: number; opacity: number }) {
  return (
    <group>
      <Glass p={[x, y, z]} s={[2, 1.45, 0.045]} opacity={Math.max(0.18, opacity * 0.55)} />
      <Box p={[x, y + 0.76, z]} s={[2.08, 0.05, 0.07]} color="#7f8987" opacity={opacity} metalness={0.25} roughness={0.3} />
      <Box p={[x, y - 0.76, z]} s={[2.08, 0.05, 0.07]} color="#7f8987" opacity={opacity} metalness={0.25} roughness={0.3} />
      <Box p={[x - 1.02, y, z]} s={[0.05, 1.55, 0.07]} color="#7f8987" opacity={opacity} metalness={0.25} roughness={0.3} />
      <Box p={[x + 1.02, y, z]} s={[0.05, 1.55, 0.07]} color="#7f8987" opacity={opacity} metalness={0.25} roughness={0.3} />
      <Box p={[x, y, z]} s={[0.04, 1.45, 0.07]} color="#8a9491" opacity={opacity} metalness={0.2} roughness={0.3} />
    </group>
  );
}

function FloorShell({ floor, selectedFloor, room, system, cutaway, exploded }: { floor: "ground" | "first" | "second"; selectedFloor: FloorKey; room: RoomId; system: SystemKey; cutaway: boolean; exploded: boolean }) {
  const y = fy(floor, exploded);
  const focus = selectedFloor === "all" || selectedFloor === floor;
  const context = system === "building" ? 1 : 0.36;
  const opacity = focus ? context : 0.08;
  const h = 2.88;
  const cy = y + h / 2 + 0.16;
  const furnitureOpacity = focus ? (system === "building" ? 1 : 0.58) : 0.06;
  return (
    <group>
      <Box p={[0, y, 0]} s={[14.1, 0.3, 9.55]} color={C.slab} opacity={focus ? 1 : 0.1} roughness={0.88} />
      <Box p={[-3.4, y + 0.18, 1.8]} s={[6.65, 0.07, 4.15]} color="#a98568" opacity={focus ? (system === "building" ? 0.98 : 0.48) : 0.06} roughness={0.72} />
      <Box p={[3.75, y + 0.18, 1.8]} s={[5.9, 0.07, 4.15]} color="#d6d0c8" opacity={focus ? (system === "building" ? 0.98 : 0.48) : 0.06} roughness={0.9} />
      <Box p={[0, y + 0.18, -2.4]} s={[13.55, 0.07, 3.1]} color="#cfc8be" opacity={focus ? (system === "building" ? 0.98 : 0.48) : 0.06} roughness={0.9} />
      <Box p={[0, cy, -4.65]} s={[14, h, 0.22]} color={C.wall} opacity={opacity} />
      <Box p={[-6.88, cy, 0]} s={[0.22, h, 9.25]} color={C.wall2} opacity={opacity} />
      <Box p={[6.88, cy, 0]} s={[0.22, h, 9.25]} color={C.wall2} opacity={opacity} />
      {!cutaway && (
        <>
          <Box p={[0, cy, 4.65]} s={[14, h, 0.24]} color={C.wall} opacity={opacity} />
          <Window x={-3.2} y={cy + 0.1} z={4.72} opacity={opacity} />
          <Window x={3.2} y={cy + 0.1} z={4.72} opacity={opacity} />
        </>
      )}
      <Box p={[0, cy, 0]} s={[0.17, h, 8.9]} color="#ebe5dc" opacity={opacity} />
      <Box p={[-0.1, cy, -0.65]} s={[13.1, h, 0.16]} color="#ebe5dc" opacity={opacity} />
      <Box p={[2.4, cy, -2.4]} s={[0.16, h, 3.35]} color="#ebe5dc" opacity={opacity} />
      <Box p={[-1.62, cy, -2.4]} s={[0.16, h, 3.35]} color="#ebe5dc" opacity={opacity} />
      {focus && <Furniture y={y + 0.2} room={room} contextOpacity={furnitureOpacity} />}
    </group>
  );
}

function RoofShell({ system, exploded }: { system: SystemKey; exploded: boolean }) {
  const y = fy("roof", exploded);
  const o = system === "building" ? 1 : 0.38;
  return (
    <group>
      <Box p={[0, y, 0]} s={[14.1, 0.32, 9.55]} color={C.slab} opacity={o} />
      <Box p={[4.6, y + 0.9, -2.6]} s={[3.1, 1.8, 2.35]} color={C.wall} opacity={o} />
      <Box p={[-1.4, y + 0.3, 1.8]} s={[4.5, 0.12, 2.4]} color="#41545a" opacity={o} metalness={0.25} roughness={0.25} />
      {[[-2.7, 1.8], [-1.4, 1.8], [-0.1, 1.8]].map(([x, z], i) => <Box key={i} p={[x, y + 0.38, z]} s={[1.1, 0.05, 2.05]} color="#263a42" opacity={o} metalness={0.2} roughness={0.22} />)}
    </group>
  );
}

function PanelDevice({ node, color, selected, onSelect, rows = 3, position }: { node: NodeInfo; color: string; selected: boolean; onSelect: (id: string) => void; rows?: number; position?: Vec3 }) {
  const [x, y, z] = position ?? node.position;
  return (
    <group onClick={e => { e.stopPropagation(); onSelect(node.id); }}>
      <Box p={[x, y, z]} s={[0.82, 1.08, 0.24]} color={selected ? "#fff7dc" : "#deded9"} metalness={0.3} roughness={0.3} emissive={selected ? color : undefined} emissiveIntensity={selected ? 0.12 : 0} />
      <Box p={[x, y, z + 0.128]} s={[0.66, 0.9, 0.025]} color="#f5f5f1" metalness={0.12} roughness={0.24} />
      <Box p={[x, y + 0.37, z + 0.148]} s={[0.44, 0.11, 0.018]} color="#303a38" metalness={0.08} roughness={0.2} />
      {Array.from({ length: rows }, (_, i) => (
        <group key={i}>
          <Box p={[x - 0.13, y + 0.15 - i * 0.22, z + 0.152]} s={[0.17, 0.11, 0.024]} color={i === 0 ? color : "#4b5552"} roughness={0.3} />
          <Box p={[x + 0.13, y + 0.15 - i * 0.22, z + 0.152]} s={[0.17, 0.11, 0.024]} color="#58615f" roughness={0.3} />
        </group>
      ))}
      <Cylinder p={[x + 0.29, y - 0.38, z + 0.15]} r={0.025} h={0.02} color={selected ? color : "#8e9794"} rot={[Math.PI / 2, 0, 0]} />
    </group>
  );
}

function MeterDevice({ selected, onSelect }: { selected: boolean; onSelect: (id: string) => void }) {
  const n = nodeMap.get("elec-meter")!;
  const [x, y, z] = n.position;
  return (
    <group onClick={e => { e.stopPropagation(); onSelect(n.id); }}>
      <Box p={[x, y, z]} s={[0.62, 0.82, 0.22]} color={selected ? "#fff4cb" : "#e3e2dc"} metalness={0.2} roughness={0.32} emissive={selected ? C.electrical : undefined} emissiveIntensity={selected ? 0.13 : 0} />
      <Box p={[x, y + 0.18, z + 0.13]} s={[0.4, 0.18, 0.03]} color="#1d2928" metalness={0.08} roughness={0.15} />
      <Box p={[x, y + 0.18, z + 0.148]} s={[0.24, 0.055, 0.012]} color="#a8cfb8" emissive="#8ac2a0" emissiveIntensity={0.16} />
      <Cylinder p={[x, y - 0.15, z + 0.14]} r={0.12} h={0.025} color="#bac0bd" rot={[Math.PI / 2, 0, 0]} metalness={0.3} roughness={0.2} />
      <Cylinder p={[x, y - 0.15, z + 0.158]} r={0.075} h={0.018} color="#4b5653" rot={[Math.PI / 2, 0, 0]} metalness={0.1} roughness={0.2} />
    </group>
  );
}

function ServiceCabinet({ selected, onSelect }: { selected: boolean; onSelect: (id: string) => void }) {
  const n = nodeMap.get("elec-service")!;
  const [x, y, z] = n.position;
  return (
    <group onClick={e => { e.stopPropagation(); onSelect(n.id); }}>
      <Box p={[x, y, z]} s={[0.58, 0.9, 0.42]} color={selected ? "#fff3c7" : "#d2d2cd"} metalness={0.34} roughness={0.34} emissive={selected ? C.electrical : undefined} emissiveIntensity={selected ? 0.12 : 0} />
      <Box p={[x, y + 0.2, z + 0.22]} s={[0.4, 0.2, 0.03]} color="#535d5a" />
      <Box p={[x, y - 0.18, z + 0.22]} s={[0.08, 0.2, 0.03]} color={C.electrical} />
    </group>
  );
}

function Dot({ p }: { p: Vec3 }) {
  return <mesh position={p}><sphereGeometry args={[0.025, 8, 6]} /><meshStandardMaterial color="#26302e" /></mesh>;
}

function OutletDevice({ node, selected, onSelect }: { node: NodeInfo; selected: boolean; onSelect: (id: string) => void }) {
  const [x, y, z] = node.position;
  return (
    <group onClick={e => { e.stopPropagation(); onSelect(node.id); }}>
      <Box p={[x, y, z]} s={[0.28, 0.36, 0.06]} color={selected ? "#fff0b7" : "#f1efe8"} roughness={0.24} emissive={selected ? C.electrical : undefined} emissiveIntensity={selected ? 0.2 : 0} />
      <Box p={[x, y, z + 0.035]} s={[0.2, 0.27, 0.018]} color="#faf9f5" roughness={0.2} />
      <Dot p={[x - 0.055, y + 0.02, z + 0.055]} />
      <Dot p={[x + 0.055, y + 0.02, z + 0.055]} />
      <Dot p={[x, y - 0.08, z + 0.055]} />
    </group>
  );
}

function SwitchDevice({ node, selected, onSelect }: { node: NodeInfo; selected: boolean; onSelect: (id: string) => void }) {
  const [x, y, z] = node.position;
  return (
    <group onClick={e => { e.stopPropagation(); onSelect(node.id); }}>
      <Box p={[x, y, z]} s={[0.24, 0.34, 0.06]} color={selected ? "#fff0b7" : "#f0eee7"} roughness={0.24} emissive={selected ? C.electrical : undefined} emissiveIntensity={selected ? 0.2 : 0} />
      <Box p={[x, y + 0.012, z + 0.04]} s={[0.11, 0.17, 0.024]} color="#b8bbb6" roughness={0.18} />
      <Box p={[x, y + 0.045, z + 0.054]} s={[0.07, 0.07, 0.012]} color="#fbfaf6" />
    </group>
  );
}

function LightDevice({ node, selected, onSelect }: { node: NodeInfo; selected: boolean; onSelect: (id: string) => void }) {
  const [x, y, z] = node.position;
  return (
    <group onClick={e => { e.stopPropagation(); onSelect(node.id); }}>
      <Cylinder p={[x, y, z]} r={0.18} h={0.06} color="#d2d0ca" metalness={0.22} roughness={0.22} />
      <Cylinder p={[x, y - 0.035, z]} r={0.13} h={0.025} color={selected ? "#fff5c9" : "#fff1bf"} roughness={0.12} />
      <pointLight position={[x, y - 0.16, z]} color="#ffd98b" intensity={selected ? 3.6 : 1.1} distance={4.8} decay={2} />
    </group>
  );
}

const visibleFloor = (f: "ground" | "first" | "second", selected: FloorKey) => selected === "all" || selected === f;
const visibleRoom = (r: Exclude<RoomId, "all">, selected: RoomId) => selected === "all" || selected === r;

function ElectricalNetwork({ floor, room, exploded, selectedId, onSelect, flow, labels }: { floor: FloorKey; room: RoomId; exploded: boolean; selectedId: string | null; onSelect: (id: string) => void; flow: boolean; labels: boolean }) {
  const service: Vec3[] = [[-9.2, 0.8, 5.7], [-7.9, 1.25, 4.9], [-6.35, 1.6, 3.45]];
  const riser: Vec3[] = [[-6.35, 1.6, 3.45], [-5.75, 1.65, 2.65], [-5.75, 9.15, 2.65]];
  const core = ["elec-service", "elec-meter", "elec-mdb", "elec-riser"];
  return (
    <group>
      <CableRun points={service} width={2.1} />
      <CableRun points={riser} width={2} />
      {flow && <><FlowDots points={service} color="#fff1a7" count={5} /><FlowDots points={riser} color="#fff1a7" count={7} speed={0.06} /></>}
      <ServiceCabinet selected={selectedId === "elec-service"} onSelect={onSelect} />
      <MeterDevice selected={selectedId === "elec-meter"} onSelect={onSelect} />
      <PanelDevice node={nodeMap.get("elec-mdb")!} color={C.electrical} selected={selectedId === "elec-mdb"} onSelect={onSelect} rows={4} />
      {(["ground", "first", "second"] as const).map(f => {
        if (!visibleFloor(f, floor)) return null;
        const y = fy(f, exploded);
        const db = nodeMap.get(`elec-db-${f}`)!;
        const dbP: Vec3 = [-5.35, y + 2.1, 2.65];
        const feed: Vec3[] = [[-5.75, y + 2.2, 2.65], dbP];
        return (
          <group key={f}>
            <CableRun points={feed} width={1.65} />
            <PanelDevice node={db} position={dbP} color={C.electrical} selected={selectedId === db.id} onSelect={onSelect} />
            {roomIds.map(roomId => {
              if (!visibleRoom(roomId, room)) return null;
              const r = rooms[roomId];
              const circuitId = `elec-circuit-${f}-${roomId}`;
              const lightId = `elec-light-${f}-${roomId}`;
              const switchId = `elec-switch-${f}-${roomId}`;
              const outletId = `elec-outlet-${f}-${roomId}`;
              const junction: Vec3 = [r.x, y + 2.52, r.z];
              const trunk: Vec3[] = [dbP, [-3.8, y + 2.45, 2.25], [r.x, y + 2.45, 1], junction];
              const lightNode = { ...nodeMap.get(lightId)!, position: [r.x, y + 2.82, r.z] as Vec3 };
              const switchNode = { ...nodeMap.get(switchId)!, position: [r.x - r.w * 0.32, y + 1.1, r.z + r.d * 0.38] as Vec3 };
              const outletNode = { ...nodeMap.get(outletId)!, position: [r.x + r.w * 0.32, y + 0.55, r.z - r.d * 0.32] as Vec3 };
              const switchRun: Vec3[] = [junction, [switchNode.position[0], y + 2.45, switchNode.position[2]], switchNode.position];
              const outletRun: Vec3[] = [junction, [outletNode.position[0], y + 2.45, outletNode.position[2]], outletNode.position];
              return (
                <group key={roomId}>
                  <CableRun points={trunk} width={selectedId === circuitId ? 2.2 : 1.25} />
                  <CableRun points={switchRun} width={1} />
                  <CableRun points={outletRun} width={1} />
                  {flow && <FlowDots points={trunk} color="#fff2b7" count={4} speed={0.11} size={0.038} />}
                  <mesh position={junction} onClick={e => { e.stopPropagation(); onSelect(circuitId); }} castShadow>
                    <boxGeometry args={[0.18, 0.09, 0.18]} />
                    <meshStandardMaterial color={selectedId === circuitId ? "#fff0ad" : "#d8c37e"} emissive={C.electrical} emissiveIntensity={selectedId === circuitId ? 0.42 : 0.06} metalness={0.14} roughness={0.25} />
                  </mesh>
                  <LightDevice node={lightNode} selected={selectedId === lightId} onSelect={onSelect} />
                  <SwitchDevice node={switchNode} selected={selectedId === switchId} onSelect={onSelect} />
                  <OutletDevice node={outletNode} selected={selectedId === outletId} onSelect={onSelect} />
                </group>
              );
            })}
          </group>
        );
      })}
      {labels && core.map(id => <WorldLabel key={id} node={nodeMap.get(id)!} selected={selectedId === id} onSelect={onSelect} exploded={exploded} />)}
    </group>
  );
}

function GroundingNetwork({ floor, exploded, selectedId, onSelect, labels }: { floor: FloorKey; exploded: boolean; selectedId: string | null; onSelect: (id: string) => void; labels: boolean }) {
  const ring: Vec3[] = [[-7.6, 0.05, -5.3], [7.6, 0.05, -5.3], [7.6, 0.05, 5.3], [-7.6, 0.05, 5.3], [-7.6, 0.05, -5.3]];
  const bond: Vec3[] = [[-7.6, 0.05, 5.3], [-6.25, 0.75, 3.35], [-5.95, 1.2, 2.82], [-5.95, 9.1, 2.82]];
  return (
    <group>
      <Tube points={ring} color="#6f8e72" radius={0.035} />
      <Tube points={bond} color={C.grounding} radius={0.035} />
      {([[-7.6, -5.3], [7.6, -5.3], [7.6, 5.3], [-7.6, 5.3]] as Array<[number, number]>).map(([x, z], i) => (
        <group key={i}>
          <Cylinder p={[x, -0.45, z]} r={0.07} h={1.05} color="#8b5d3b" metalness={0.4} roughness={0.32} />
          <Cylinder p={[x, 0.05, z]} r={0.11} h={0.06} color="#a87545" metalness={0.35} roughness={0.25} />
        </group>
      ))}
      <PanelDevice node={nodeMap.get("earth-met")!} color={C.grounding} selected={selectedId === "earth-met"} onSelect={onSelect} rows={2} />
      {(["ground", "first", "second"] as const).map(f => {
        if (!visibleFloor(f, floor)) return null;
        const y = fy(f, exploded);
        const id = `earth-pe-${f}`;
        return <Tube key={f} points={[[-5.95, y + 1.9, 2.82], [-5.35, y + 2.05, 2.65]]} color={C.grounding} radius={0.025} />;
      })}
      {labels && ["earth-ring", "earth-met", "earth-riser"].map(id => <WorldLabel key={id} node={nodeMap.get(id)!} selected={selectedId === id} onSelect={onSelect} exploded={exploded} />)}
    </group>
  );
}

function RTU({ y, selected, onSelect }: { y: number; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <group onClick={e => { e.stopPropagation(); onSelect("hvac-rtu"); }}>
      <Box p={[4.4, y + 0.95, -2.6]} s={[2.6, 1.3, 1.62]} color={selected ? "#dff7f2" : "#a9b2b0"} metalness={0.42} roughness={0.28} emissive={selected ? C.hvac : undefined} emissiveIntensity={selected ? 0.13 : 0} />
      <Box p={[4.4, y + 1.63, -2.6]} s={[2.4, 0.08, 1.4]} color="#828d8a" metalness={0.5} roughness={0.2} />
      {[-0.65, 0.65].map((dx, i) => (
        <group key={i} position={[4.4 + dx, y + 1.72, -2.6]}>
          <Cylinder p={[0, 0, 0]} r={0.38} h={0.055} color="#515c5a" metalness={0.45} roughness={0.22} />
          {Array.from({ length: 6 }, (_, k) => <Box key={k} p={[0, 0.04, 0]} s={[0.06, 0.02, 0.62]} color="#6c7674" metalness={0.45} roughness={0.2} />)}
        </group>
      ))}
      {[-0.45, 0, 0.45].map((dy, i) => <Box key={i} p={[3.08, y + 0.95 + dy, -2.6]} s={[0.04, 0.08, 1.18]} color="#687370" metalness={0.35} roughness={0.24} />)}
    </group>
  );
}

function Diffuser({ p, selected, onClick }: { p: Vec3; selected: boolean; onClick: () => void }) {
  const [x, y, z] = p;
  return (
    <group onClick={e => { e.stopPropagation(); onClick(); }}>
      <Box p={p} s={[0.78, 0.055, 0.46]} color={selected ? "#d9fff8" : "#e5e8e5"} metalness={0.28} roughness={0.28} emissive={selected ? C.hvac : undefined} emissiveIntensity={selected ? 0.2 : 0} />
      {[-0.22, -0.08, 0.08, 0.22].map((dx, i) => <Box key={i} p={[x + dx, y - 0.035, z]} s={[0.045, 0.014, 0.36]} color="#9fa8a5" metalness={0.25} roughness={0.24} />)}
    </group>
  );
}

function HVACNetwork({ floor, room, exploded, selectedId, onSelect, labels }: { floor: FloorKey; room: RoomId; exploded: boolean; selectedId: string | null; onSelect: (id: string) => void; labels: boolean }) {
  const roofY = fy("roof", exploded);
  return (
    <group>
      <RTU y={roofY} selected={selectedId === "hvac-rtu"} onSelect={onSelect} />
      <Box p={[1.05, 5.1, -3.55]} s={[0.82, 8.3, 0.94]} color="#8ca6a0" opacity={0.68} metalness={0.42} roughness={0.24} onClick={() => onSelect("hvac-shaft")} emissive={selectedId === "hvac-shaft" ? C.hvac : undefined} emissiveIntensity={selectedId === "hvac-shaft" ? 0.16 : 0} />
      {(["ground", "first", "second"] as const).map(f => {
        if (!visibleFloor(f, floor)) return null;
        const y = fy(f, exploded);
        const ductId = `hvac-duct-${f}`;
        return (
          <group key={f}>
            <Box p={[0.85, y + 2.5, -1.7]} s={[0.72, 0.5, 3.5]} color="#a7bbb7" opacity={0.9} metalness={0.5} roughness={0.22} onClick={() => onSelect(ductId)} emissive={selectedId === ductId ? C.hvac : undefined} emissiveIntensity={selectedId === ductId ? 0.12 : 0} />
            <Box p={[0.85, y + 2.5, 1.05]} s={[0.72, 0.5, 2]} color="#a7bbb7" opacity={0.9} metalness={0.5} roughness={0.22} onClick={() => onSelect(ductId)} />
            {roomIds.map(roomId => {
              if (!visibleRoom(roomId, room)) return null;
              const r = rooms[roomId];
              const id = `hvac-diff-${f}-${roomId}`;
              const p: Vec3 = [r.x, y + 2.72, r.z];
              return (
                <group key={roomId}>
                  <Line points={[[0.85, y + 2.5, 0.2], [r.x * 0.55, y + 2.5, r.z * 0.7], [r.x, y + 2.5, r.z]]} color="#85bdb6" lineWidth={5.5} transparent opacity={0.55} />
                  <Diffuser p={p} selected={selectedId === id} onClick={() => onSelect(id)} />
                </group>
              );
            })}
          </group>
        );
      })}
      {labels && ["hvac-rtu", "hvac-shaft"].map(id => <WorldLabel key={id} node={nodeMap.get(id)!} selected={selectedId === id} onSelect={onSelect} exploded={exploded} />)}
    </group>
  );
}

function WaterTank({ y, selected, onSelect }: { y: number; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <group onClick={e => { e.stopPropagation(); onSelect("water-tank"); }}>
      <Cylinder p={[-4.25, y + 1.3, -2.65]} r={0.95} h={2} color={selected ? "#dff4ff" : "#e1e4e2"} metalness={0.15} roughness={0.38} />
      <Cylinder p={[-4.25, y + 2.33, -2.65]} r={0.68} h={0.1} color="#c2c8c5" metalness={0.2} roughness={0.28} />
      <Tube points={[[-4.85, y + 1.75, -2.65], [-5.25, y + 1.75, -2.65], [-5.25, y + 0.55, -2.65]]} color="#8a9a97" radius={0.035} />
      <Tube points={[[-3.65, y + 0.65, -2.65], [-3.05, y + 0.65, -2.65]]} color={C.water} radius={0.045} />
    </group>
  );
}

function Pump({ y, selected, onSelect }: { y: number; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <group onClick={e => { e.stopPropagation(); onSelect("water-pump"); }}>
      <Box p={[-3, y + 0.24, -2.65]} s={[1.2, 0.12, 0.72]} color="#6f7977" metalness={0.42} roughness={0.26} />
      <Cylinder p={[-3.18, y + 0.55, -2.65]} r={0.28} h={0.72} color={selected ? "#d8f1ff" : "#748b8e"} metalness={0.38} roughness={0.24} rot={[0, 0, Math.PI / 2]} />
      <Cylinder p={[-2.72, y + 0.55, -2.65]} r={0.2} h={0.42} color="#aeb7b5" metalness={0.5} roughness={0.2} rot={[0, 0, Math.PI / 2]} />
      <Tube points={[[-3.55, y + 0.55, -2.65], [-4.0, y + 0.55, -2.65]]} color={C.water} radius={0.045} />
      <Tube points={[[-2.5, y + 0.55, -2.65], [-2.15, y + 0.55, -2.65]]} color={C.water} radius={0.045} />
    </group>
  );
}

function WaterFixture({ p, selected, onClick }: { p: Vec3; selected: boolean; onClick: () => void }) {
  const [x, y, z] = p;
  return (
    <group onClick={e => { e.stopPropagation(); onClick(); }}>
      <Cylinder p={[x, y, z]} r={0.1} h={0.08} color={selected ? "#d8f2ff" : "#d5dad8"} metalness={0.45} roughness={0.18} />
      <Tube points={[[x, y + 0.02, z], [x, y + 0.26, z], [x + 0.18, y + 0.26, z]]} color="#8d9694" radius={0.018} />
    </group>
  );
}

function WaterNetwork({ floor, room, exploded, selectedId, onSelect, flow, labels }: { floor: FloorKey; room: RoomId; exploded: boolean; selectedId: string | null; onSelect: (id: string) => void; flow: boolean; labels: boolean }) {
  const roofY = fy("roof", exploded);
  const riser: Vec3[] = [[-4.25, roofY + 1.05, -2.65], [-3, roofY + 0.65, -2.65], [-2.55, roofY + 0.55, -2.65], [-2.55, 0.8, -2.65]];
  return (
    <group>
      <WaterTank y={roofY} selected={selectedId === "water-tank"} onSelect={onSelect} />
      <Pump y={roofY} selected={selectedId === "water-pump"} onSelect={onSelect} />
      <Tube points={riser} color={C.water} radius={0.07} />
      {flow && <FlowDots points={riser} color="#b7e8ff" count={9} speed={0.05} />}
      {(["ground", "first", "second"] as const).map(f => {
        if (!visibleFloor(f, floor)) return null;
        const y = fy(f, exploded);
        return (
          <group key={f}>
            {(["kitchen", "bath"] as const).map(roomId => {
              if (!visibleRoom(roomId, room)) return null;
              const r = rooms[roomId];
              const branchId = `water-branch-${f}`;
              const fixId = `water-fix-${f}-${roomId}`;
              const cold: Vec3[] = [[-2.55, y + 0.55, -2.65], [-0.8, y + 0.55, -2.4], [r.x, y + 0.55, r.z]];
              const hot: Vec3[] = [[-2, y + 0.65, -2.65], [-0.4, y + 0.65, -2.15], [r.x + 0.16, y + 0.65, r.z]];
              return (
                <group key={roomId}>
                  <group onClick={e => { e.stopPropagation(); onSelect(branchId); }}>
                    <Tube points={cold} color={C.water} radius={0.045} />
                    <Tube points={hot} color={C.hot} radius={0.038} />
                  </group>
                  {flow && <FlowDots points={cold} color="#c7edff" count={4} speed={0.08} size={0.035} />}
                  <WaterFixture p={[r.x, y + 0.85, r.z]} selected={selectedId === fixId} onClick={() => onSelect(fixId)} />
                </group>
              );
            })}
          </group>
        );
      })}
      {labels && ["water-tank", "water-pump", "water-riser"].map(id => <WorldLabel key={id} node={nodeMap.get(id)!} selected={selectedId === id} onSelect={onSelect} exploded={exploded} />)}
    </group>
  );
}

function FloorDrain({ p, selected, onClick }: { p: Vec3; selected: boolean; onClick: () => void }) {
  const [x, y, z] = p;
  return (
    <group onClick={e => { e.stopPropagation(); onClick(); }}>
      <Cylinder p={[x, y, z]} r={0.12} h={0.035} color={selected ? "#d9e6e4" : "#8f9997"} metalness={0.48} roughness={0.22} />
      {[-0.06, -0.02, 0.02, 0.06].map((dx, i) => <Box key={i} p={[x + dx, y + 0.022, z]} s={[0.01, 0.008, 0.17]} color="#535d5b" metalness={0.4} roughness={0.2} />)}
    </group>
  );
}

function DrainNetwork({ floor, room, exploded, selectedId, onSelect, flow, labels }: { floor: FloorKey; room: RoomId; exploded: boolean; selectedId: string | null; onSelect: (id: string) => void; flow: boolean; labels: boolean }) {
  const stack: Vec3[] = [[-1.45, 9.2, -3.25], [-1.45, 0.32, -3.25], [-1.45, 0.02, -5.7], [-1.45, -0.12, -7.5], [5.5, -0.15, -8.5]];
  return (
    <group>
      <Tube points={stack} color={C.drainage} radius={0.09} />
      {flow && <FlowDots points={stack} color="#c5cfcd" count={8} speed={0.055} size={0.055} />}
      {(["ground", "first", "second"] as const).map(f => {
        if (!visibleFloor(f, floor)) return null;
        const y = fy(f, exploded);
        return (
          <group key={f}>
            {(["kitchen", "bath"] as const).map(roomId => {
              if (!visibleRoom(roomId, room)) return null;
              const r = rooms[roomId];
              const fixId = `drain-fix-${f}-${roomId}`;
              const branchId = `drain-branch-${f}`;
              const points: Vec3[] = [[r.x, y + 0.22, r.z], [r.x - 0.45, y + 0.18, r.z - 0.3], [-1.45, y + 0.12, -3.25]];
              return (
                <group key={roomId}>
                  <group onClick={e => { e.stopPropagation(); onSelect(branchId); }}><Tube points={points} color="#7f8b89" radius={0.065} /></group>
                  <FloorDrain p={[r.x, y + 0.22, r.z]} selected={selectedId === fixId} onClick={() => onSelect(fixId)} />
                </group>
              );
            })}
          </group>
        );
      })}
      <group onClick={e => { e.stopPropagation(); onSelect("drain-mh"); }}>
        <Cylinder p={[-1.45, 0.04, -7.5]} r={0.72} h={0.16} color="#7a807e" metalness={0.35} roughness={0.28} />
        <Cylinder p={[-1.45, 0.13, -7.5]} r={0.56} h={0.035} color="#5c6462" metalness={0.42} roughness={0.2} />
      </group>
      <Line points={[[-1.45, -0.08, -7.5], [5.5, -0.08, -8.5], [10, -0.08, -8.5]]} color="#7d8987" lineWidth={6} onClick={() => onSelect("drain-site")} />
      {labels && ["drain-stack", "drain-mh", "drain-site"].map(id => <WorldLabel key={id} node={nodeMap.get(id)!} selected={selectedId === id} onSelect={onSelect} exploded={exploded} />)}
    </group>
  );
}

function BuildingScene({ system, floor, room, cutaway, exploded, selectedId, onSelect, flow, labels }: { system: SystemKey; floor: FloorKey; room: RoomId; cutaway: boolean; exploded: boolean; selectedId: string | null; onSelect: (id: string) => void; flow: boolean; labels: boolean }) {
  return (
    <>
      <color attach="background" args={[C.bg]} />
      <fog attach="fog" args={[C.bg, 34, 58]} />
      <ambientLight intensity={0.78} />
      <hemisphereLight color="#ffffff" groundColor="#c8cec9" intensity={1.0} />
      <directionalLight castShadow position={[15, 23, 12]} intensity={3.1} color="#fff7e8" shadow-mapSize-width={1536} shadow-mapSize-height={1536} shadow-bias={-0.00015} />
      <directionalLight position={[-12, 10, -8]} intensity={0.7} color="#dfeef3" />
      <Site />
      {(["ground", "first", "second"] as const).map(f => (floor === "all" || floor === f) ? <FloorShell key={f} floor={f} selectedFloor={floor} room={room} system={system} cutaway={cutaway} exploded={exploded} /> : null)}
      {(floor === "all" || floor === "roof") && <RoofShell system={system} exploded={exploded} />}
      {system === "electricity" && <ElectricalNetwork floor={floor} room={room} exploded={exploded} selectedId={selectedId} onSelect={onSelect} flow={flow} labels={labels} />}
      {system === "grounding" && <GroundingNetwork floor={floor} exploded={exploded} selectedId={selectedId} onSelect={onSelect} labels={labels} />}
      {system === "hvac" && <HVACNetwork floor={floor} room={room} exploded={exploded} selectedId={selectedId} onSelect={onSelect} labels={labels} />}
      {system === "water" && <WaterNetwork floor={floor} room={room} exploded={exploded} selectedId={selectedId} onSelect={onSelect} flow={flow} labels={labels} />}
      {system === "drainage" && <DrainNetwork floor={floor} room={room} exploded={exploded} selectedId={selectedId} onSelect={onSelect} flow={flow} labels={labels} />}
      <ContactShadows position={[0, -0.02, 0]} opacity={0.22} scale={28} blur={2.8} far={20} resolution={512} color="#64706b" />
    </>
  );
}

function cameraTarget(system: SystemKey, floor: FloorKey, room: RoomId, preset: ViewPreset, selectedNode: NodeInfo | null, exploded: boolean): CameraTarget {
  if (selectedNode) {
    const [x, y, z] = displayNodePosition(selectedNode, exploded);
    return { camera: [x + 4.2, y + 2.8, z + 4.2], target: [x, y, z] };
  }
  const baseY = floor === "ground" ? 1.65 : floor === "first" ? 4.9 : floor === "second" ? 8.15 : floor === "roof" ? 11 : 5.2;
  const target: Vec3 = room === "all" ? [0, baseY, 0] : [rooms[room].x, baseY, rooms[room].z];
  if (preset === "top") return { camera: [target[0] + 0.1, floor === "all" ? 29 : baseY + 15, target[2] + 0.1], target };
  if (preset === "front") return { camera: [target[0], floor === "all" ? 8.2 : baseY + 2.2, 23], target };
  if (preset === "walk") return { camera: [target[0] - 4.6, baseY + 1, target[2] + 5.8], target: [target[0], baseY + 0.45, target[2]] };
  if (room !== "all" && floor !== "all" && floor !== "roof") return { camera: [target[0] + 6.2, baseY + 3.9, target[2] + 6.2], target };
  if (system === "electricity" || system === "grounding") return { camera: [17, 11.5, 17], target: [-2.7, 4.7, 0.8] };
  if (system === "hvac") return { camera: [16, 13, -16], target: [1, 6, -1.4] };
  if (system === "water" || system === "drainage") return { camera: [-15.5, 11.5, 16], target: [-1.2, 5.2, -1.3] };
  return { camera: [19, 13.5, 21], target: [0, 4.8, 0] };
}

function CameraRig({ desired, nonce, controls }: { desired: CameraTarget; nonce: number; controls: MutableRefObject<any> }) {
  const { camera } = useThree();
  const active = useRef(1);
  const p = useMemo(() => new THREE.Vector3(...desired.camera), [desired]);
  const t = useMemo(() => new THREE.Vector3(...desired.target), [desired]);
  useEffect(() => { active.current = 1; }, [nonce, p, t]);
  useFrame(() => {
    if (active.current < 0.008) return;
    camera.position.lerp(p, 0.12);
    controls.current?.target.lerp(t, 0.12);
    controls.current?.update();
    active.current *= 0.83;
  });
  return null;
}

function TwinCanvas({ system, floor, room, preset, cutaway, exploded, selectedNode, onSelect, flow, labels, nonce }: { system: SystemKey; floor: FloorKey; room: RoomId; preset: ViewPreset; cutaway: boolean; exploded: boolean; selectedNode: NodeInfo | null; onSelect: (id: string) => void; flow: boolean; labels: boolean; nonce: number }) {
  const controls = useRef<any>(null);
  const desired = useMemo(() => cameraTarget(system, floor, room, preset, selectedNode, exploded), [system, floor, room, preset, selectedNode, exploded]);
  return (
    <Canvas
      shadows
      dpr={[1, 1.7]}
      camera={{ position: desired.camera, fov: 43, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
      onPointerMissed={() => selectedNode && onSelect("")}
    >
      <BuildingScene system={system} floor={floor} room={room} cutaway={cutaway} exploded={exploded} selectedId={selectedNode?.id ?? null} onSelect={onSelect} flow={flow} labels={labels} />
      <CameraRig desired={desired} nonce={nonce} controls={controls} />
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.085}
        minDistance={3.2}
        maxDistance={42}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI / 2.03}
        rotateSpeed={0.72}
        zoomSpeed={0.85}
        panSpeed={0.72}
        screenSpacePanning={false}
        target={desired.target}
      />
    </Canvas>
  );
}

function IconForRoom({ room }: { room: RoomId }) {
  if (room === "all") return <Home size={15} />;
  if (room === "living") return <Sofa size={15} />;
  if (room === "kitchen") return <UtensilsCrossed size={15} />;
  if (room === "bath") return <ShowerHead size={15} />;
  return <BedDouble size={15} />;
}

function ControlButton({ label, active = false, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={active ? "active" : ""} onClick={onClick} aria-label={label} title={label} data-tip={label}>
      {children}
    </button>
  );
}

function ViewControls({ preset, setPreset, cutaway, setCutaway, exploded, setExploded, labels, setLabels, flow, setFlow, reset }: {
  preset: ViewPreset;
  setPreset: (v: ViewPreset) => void;
  cutaway: boolean;
  setCutaway: (v: boolean) => void;
  exploded: boolean;
  setExploded: (v: boolean) => void;
  labels: boolean;
  setLabels: (v: boolean) => void;
  flow: boolean;
  setFlow: (v: boolean) => void;
  reset: () => void;
}) {
  return (
    <div className="v6-view-controls" aria-label="أدوات التحكم بالمشهد">
      <div className="v6-control-group">
        <ControlButton label="منظور ثلاثي" active={preset === "iso"} onClick={() => setPreset("iso")}><SquareStack size={17} /></ControlButton>
        <ControlButton label="منظر علوي" active={preset === "top"} onClick={() => setPreset("top")}><PanelTop size={17} /></ControlButton>
        <ControlButton label="منظر أمامي" active={preset === "front"} onClick={() => setPreset("front")}><Home size={17} /></ControlButton>
        <ControlButton label="داخل المساحة" active={preset === "walk"} onClick={() => setPreset("walk")}><Focus size={17} /></ControlButton>
      </div>
      <span className="v6-control-sep" />
      <div className="v6-control-group">
        <ControlButton label="قص الواجهة" active={cutaway} onClick={() => setCutaway(!cutaway)}><ScanLine size={17} /></ControlButton>
        <ControlButton label="فصل الأدوار" active={exploded} onClick={() => setExploded(!exploded)}><Layers3 size={17} /></ControlButton>
        <ControlButton label={labels ? "إخفاء التسميات" : "إظهار التسميات"} active={labels} onClick={() => setLabels(!labels)}>{labels ? <Eye size={17} /> : <EyeOff size={17} />}</ControlButton>
        <ControlButton label={flow ? "إيقاف التدفق" : "تشغيل التدفق"} active={flow} onClick={() => setFlow(!flow)}><Waves size={17} /></ControlButton>
        <ControlButton label="إعادة ضبط المشهد" onClick={reset}><RotateCcw size={17} /></ControlButton>
      </div>
    </div>
  );
}

function NodeInspector({ system, selectedNode, floor, room, onFocusNode, onClearNode }: { system: SystemKey; selectedNode: NodeInfo | null; floor: FloorKey; room: RoomId; onFocusNode: (id: string) => void; onClearNode: () => void }) {
  const meta = systemMeta[system];
  const chain = system === "building" ? [] : chainIds[system].map(id => nodeMap.get(id)!).filter(Boolean);
  return (
    <>
      <div className="v6-inspector-head" style={{ "--sys": meta.color } as CSSProperties}>
        <h2>{meta.label}</h2>
        <p>{meta.description}</p>
      </div>
      {selectedNode && (
        <section className="v6-selected-card" style={{ "--sys": meta.color } as CSSProperties}>
          <div className="v6-selected-code">
            <span>{selectedNode.code}</span>
            <button onClick={onClearNode} aria-label="إلغاء تحديد العنصر"><X size={14} /></button>
          </div>
          <h3>{selectedNode.title}</h3>
          <p>{selectedNode.detail}</p>
          <div className="v6-node-meta">
            {selectedNode.floor && <span>{floors.find(f => f.key === selectedNode.floor)?.label}</span>}
            {selectedNode.room && <span>{rooms[selectedNode.room].name}</span>}
          </div>
          <button className="v6-focus-btn" onClick={() => onFocusNode(selectedNode.id)}><Focus size={14} /> تركيز</button>
        </section>
      )}
      {system !== "building" && (
        <section className="v6-inspector-section">
          <div className="v6-section-title"><strong>مسار النظام</strong></div>
          <div className="v6-chain">
            {chain.map((node, index) => (
              <button key={node.id} className={selectedNode?.id === node.id ? "active" : ""} onClick={() => onFocusNode(node.id)}>
                <i style={{ background: meta.color }}>{index + 1}</i>
                <span><b>{node.code}</b><small>{node.title}</small></span>
                <ChevronLeft size={14} />
              </button>
            ))}
          </div>
        </section>
      )}
      <section className="v6-inspector-section v6-view-state">
        <div><span>الدور</span><b>{floors.find(f => f.key === floor)?.label}</b></div>
        <div><span>المساحة</span><b>{room === "all" ? "كل المساحات" : rooms[room].name}</b></div>
      </section>
    </>
  );
}

export function EngineeringTwinStudioV6() {
  const [system, setSystem] = useState<SystemKey>("building");
  const [floor, setFloor] = useState<FloorKey>("all");
  const [room, setRoom] = useState<RoomId>("all");
  const [preset, setPreset] = useState<ViewPreset>("iso");
  const [cutaway, setCutaway] = useState(true);
  const [exploded, setExploded] = useState(false);
  const [labels, setLabels] = useState(true);
  const [flow, setFlow] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [nonce, setNonce] = useState(0);

  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) ?? null : null;
  const meta = systemMeta[system];

  const chooseSystem = (v: SystemKey) => {
    setSystem(v);
    setSelectedNodeId(null);
    if (v !== "building") setCutaway(true);
    setNonce(n => n + 1);
  };

  const chooseFloor = (v: FloorKey) => {
    setFloor(v);
    setSelectedNodeId(null);
    if (v === "roof") setRoom("all");
    setNonce(n => n + 1);
  };

  const chooseRoom = (v: RoomId) => {
    setRoom(v);
    setSelectedNodeId(null);
    if (v !== "all" && (floor === "all" || floor === "roof")) setFloor("ground");
    setPreset(v === "all" ? "iso" : "walk");
    setNonce(n => n + 1);
  };

  const focusNode = (id: string) => {
    const node = nodeMap.get(id);
    if (!node) return;
    setSystem(node.system);
    setSelectedNodeId(id);
    if (node.floor) setFloor(node.floor);
    if (node.room) setRoom(node.room);
    setNonce(n => n + 1);
    setDetailsOpen(true);
  };

  const selectFromScene = (id: string) => {
    if (!id) {
      setSelectedNodeId(null);
      setNonce(n => n + 1);
      return;
    }
    focusNode(id);
  };

  const reset = () => {
    setFloor("all");
    setRoom("all");
    setPreset("iso");
    setSelectedNodeId(null);
    setExploded(false);
    setCutaway(true);
    setNonce(n => n + 1);
  };

  const systemKeys: SystemKey[] = ["building", "electricity", "grounding", "hvac", "water", "drainage"];
  const serviceKeys: SystemKey[] = ["electricity", "grounding", "hvac", "water", "drainage"];
  const roomOptions: RoomId[] = ["all", ...roomIds];

  return (
    <main className="v6-studio" dir="rtl">
      <header className="v6-topbar">
        <div className="v6-brand">
          <Link href="/unit" className="v6-back" aria-label="العودة للوحدة"><ArrowLeft size={18} /></Link>
          <div><small>YUSR · DIGITAL TWIN</small><strong>UNT-407 · المبنى السكني</strong></div>
        </div>
        <div className="v6-top-actions">
          <button className="v6-details-toggle" onClick={() => setDetailsOpen(true)} aria-label="تفاصيل النظام" title="تفاصيل النظام"><CircleDot size={17} /></button>
        </div>
      </header>

      <div className="v6-body">
        <aside className="v6-systems-rail">
          <div className="v6-rail-section base">
            <strong>النموذج</strong>
            <button className={system === "building" ? "active" : ""} style={{ "--sys": C.brand } as CSSProperties} onClick={() => chooseSystem("building")}>
              <Building2 size={19} /><span><b>المبنى</b><small>معماري + أثاث</small></span>
            </button>
          </div>
          <div className="v6-rail-section">
            <strong>الأنظمة</strong>
            {serviceKeys.map(key => {
              const Icon = systemIcons[key];
              const item = systemMeta[key];
              return (
                <button key={key} className={system === key ? "active" : ""} style={{ "--sys": item.color } as CSSProperties} onClick={() => chooseSystem(key)}>
                  <Icon size={19} /><span><b>{item.label}</b></span>
                </button>
              );
            })}
          </div>
          <div className="v6-rail-section floors">
            <strong>الأدوار</strong>
            {floors.map(item => (
              <button key={item.key} className={floor === item.key ? "active" : ""} onClick={() => chooseFloor(item.key)}>
                <em>{item.short}</em><span><b>{item.label}</b></span>
              </button>
            ))}
          </div>
        </aside>

        <section className="v6-viewport">
          <TwinCanvas system={system} floor={floor} room={room} preset={preset} cutaway={cutaway} exploded={exploded} selectedNode={selectedNode} onSelect={selectFromScene} flow={flow} labels={labels} nonce={nonce} />
          <div className="v6-canvas-shade" />

          <div className="v6-mobile-system-strip">
            {systemKeys.map(key => {
              const Icon = systemIcons[key];
              return (
                <button key={key} className={system === key ? "active" : ""} style={{ "--sys": systemMeta[key].color } as CSSProperties} onClick={() => chooseSystem(key)}>
                  <Icon size={16} /><span>{systemMeta[key].label}</span>
                </button>
              );
            })}
          </div>

          <div className="v6-mobile-floor-strip">
            {floors.map(item => <button key={item.key} className={floor === item.key ? "active" : ""} onClick={() => chooseFloor(item.key)}>{item.short}</button>)}
          </div>

          <div className="v6-title" style={{ "--sys": meta.color } as CSSProperties}>
            <small>{meta.en}</small>
            <h1>{meta.label}</h1>
            <p>{floor === "all" ? "المبنى كامل" : floors.find(f => f.key === floor)?.label}{room !== "all" ? ` · ${rooms[room].name}` : ""}</p>
          </div>

          <ViewControls
            preset={preset}
            setPreset={v => { setPreset(v); setSelectedNodeId(null); setNonce(n => n + 1); }}
            cutaway={cutaway}
            setCutaway={setCutaway}
            exploded={exploded}
            setExploded={setExploded}
            labels={labels}
            setLabels={setLabels}
            flow={flow}
            setFlow={setFlow}
            reset={reset}
          />

          <div className="v6-room-strip">
            {roomOptions.map(r => (
              <button key={r} className={room === r ? "active" : ""} onClick={() => chooseRoom(r)}>
                <IconForRoom room={r} /><span>{r === "all" ? "كل الغرف" : rooms[r].name}</span>
              </button>
            ))}
          </div>

          {selectedNode && (
            <button className="v6-mobile-selected" style={{ "--sys": meta.color } as CSSProperties} onClick={() => setDetailsOpen(true)}>
              <span><small>{selectedNode.code}</small><b>{selectedNode.title}</b></span><ChevronLeft size={16} />
            </button>
          )}
        </section>

        <aside className="v6-inspector">
          <NodeInspector system={system} selectedNode={selectedNode} floor={floor} room={room} onFocusNode={focusNode} onClearNode={() => { setSelectedNodeId(null); setNonce(n => n + 1); }} />
        </aside>
      </div>

      <div className={`v6-mobile-sheet ${detailsOpen ? "open" : ""}`}>
        <button className="v6-sheet-backdrop" onClick={() => setDetailsOpen(false)} aria-label="إغلاق" />
        <div className="v6-sheet-card">
          <div className="v6-sheet-handle" />
          <button className="v6-sheet-close" onClick={() => setDetailsOpen(false)} aria-label="إغلاق التفاصيل"><ChevronDown size={19} /></button>
          <NodeInspector system={system} selectedNode={selectedNode} floor={floor} room={room} onFocusNode={focusNode} onClearNode={() => { setSelectedNodeId(null); setNonce(n => n + 1); }} />
        </div>
      </div>
    </main>
  );
}
