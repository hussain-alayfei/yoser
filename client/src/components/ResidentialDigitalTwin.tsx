import {
  ContactShadows,
  Edges,
  Grid,
  Html,
  Line,
  OrbitControls,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Box,
  Building2,
  CheckCircle2,
  Construction,
  DoorOpen,
  Droplets,
  Eye,
  EyeOff,
  Focus,
  Gauge,
  Grid3X3,
  Home,
  Layers3,
  Maximize2,
  Paintbrush,
  RotateCcw,
  Sofa,
  Wind,
  Wrench,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { constructionFloors } from "@/constructionData";

export type Vec3 = [number, number, number];
export type RoomId = "living" | "kitchen" | "master" | "bedroom" | "bath";
export type SystemKey = "electricity" | "plumbing" | "air" | "finish" | "doors" | "facilities";
type ViewPreset = "iso" | "top" | "front" | "walk";
type LayerKey = "shell" | "spaces" | "furniture" | "systems";
type CameraTarget = { camera: Vec3; target: Vec3 };

type Props = {
  mode: "construction" | "home";
  selectedFloorKey?: string;
  onSelectFloor?: (key: string) => void;
  selectedRoomId?: RoomId;
  onSelectRoom?: (room: RoomId) => void;
  selectedSystemKey?: SystemKey;
  onSelectSystem?: (system: SystemKey) => void;
  compact?: boolean;
};

const C = {
  brand: "#0b4f46",
  brand2: "#5f9f91",
  concrete: "#c6c1b7",
  concreteDark: "#99958d",
  wall: "#eee9df",
  wall2: "#dfd8cc",
  glass: "#7fa9b2",
  timber: "#9b785c",
  steel: "#65716d",
  brick: "#c89b72",
  scaffold: "#d58b3c",
  electrical: "#d2a33d",
  plumbing: "#3f83a9",
  hvac: "#58a697",
  finish: "#ad846b",
  doors: "#7b624f",
  facilities: "#697b76",
};

const roomDefinitions: Array<{ id: RoomId; name: string; x: number; z: number; w: number; d: number; color: string }> = [
  { id: "living", name: "المجلس والمعيشة", x: -3.05, z: 1.35, w: 5.7, d: 4.8, color: "#d7c3aa" },
  { id: "kitchen", name: "المطبخ", x: 3.35, z: 1.35, w: 4.6, d: 4.8, color: "#b9d1ca" },
  { id: "master", name: "غرفة النوم الرئيسية", x: -3.55, z: -2.35, w: 4.75, d: 2.65, color: "#c9c1d0" },
  { id: "bedroom", name: "غرفة النوم", x: 0.65, z: -2.35, w: 3.25, d: 2.65, color: "#d4c8bd" },
  { id: "bath", name: "دورة المياه", x: 4.35, z: -2.35, w: 2.25, d: 2.65, color: "#b8d2d8" },
];

const roomNames = Object.fromEntries(roomDefinitions.map((r) => [r.id, r.name])) as Record<RoomId, string>;

const systemMeta: Record<SystemKey, { label: string; color: string; icon: typeof Zap }> = {
  electricity: { label: "الكهرباء", color: C.electrical, icon: Zap },
  plumbing: { label: "السباكة", color: C.plumbing, icon: Droplets },
  air: { label: "التكييف والتهوية", color: C.hvac, icon: Wind },
  finish: { label: "التشطيبات", color: C.finish, icon: Paintbrush },
  doors: { label: "الأبواب والنوافذ", color: C.doors, icon: DoorOpen },
  facilities: { label: "المرافق والتجهيزات", color: C.facilities, icon: Gauge },
};

const constructionFocus: Record<string, CameraTarget> = {
  foundation: { camera: [11, 5.2, 12], target: [0, 0.2, 0] },
  ground: { camera: [12, 5.6, 12.5], target: [0, 1.5, 0] },
  first: { camera: [12.5, 7.4, 13], target: [0, 4.15, 0] },
  second: { camera: [13, 9.7, 13.5], target: [0, 6.95, 0] },
  roof: { camera: [12.5, 11.6, 12.5], target: [0, 9.2, 0] },
};

const roomFocus: Record<RoomId, CameraTarget> = {
  living: { camera: [-8.7, 6.1, 8.7], target: [-3.1, 1.0, 1.3] },
  kitchen: { camera: [8.7, 5.9, 8.5], target: [3.4, 1.0, 1.3] },
  master: { camera: [-8.3, 5.5, -7.8], target: [-3.55, 1.0, -2.35] },
  bedroom: { camera: [3.5, 5.4, -8.7], target: [0.65, 1.0, -2.35] },
  bath: { camera: [8.5, 5.0, -6.9], target: [4.35, 1.0, -2.35] },
};

const presets: Record<"construction" | "home", Record<ViewPreset, CameraTarget>> = {
  construction: {
    iso: { camera: [14.5, 10.6, 16], target: [0, 4.5, 0] },
    top: { camera: [0.1, 25.5, 0.1], target: [0, 4.2, 0] },
    front: { camera: [0, 6.5, 21], target: [0, 4.2, 0] },
    walk: { camera: [-7.2, 2.3, 8.4], target: [0, 2.0, 0] },
  },
  home: {
    iso: { camera: [13.8, 10.4, 14.8], target: [0, 0.8, 0] },
    top: { camera: [0.1, 18.5, 0.1], target: [0, 0, 0] },
    front: { camera: [0, 5.0, 17], target: [0, 0.8, 0] },
    walk: { camera: [-4.9, 1.7, 5.6], target: [-1.2, 1.2, 0] },
  },
};

function CameraRig({ mode, preset, focus, nonce, controlsRef }: { mode: "construction" | "home"; preset: ViewPreset; focus?: CameraTarget; nonce: number; controlsRef: MutableRefObject<any> }) {
  const { camera } = useThree();
  const amount = useRef(1);
  const desired = focus ?? presets[mode][preset];
  const p = useMemo(() => new THREE.Vector3(...desired.camera), [desired]);
  const t = useMemo(() => new THREE.Vector3(...desired.target), [desired]);

  useEffect(() => { amount.current = 1; }, [mode, preset, nonce, p, t]);
  useFrame(() => {
    if (amount.current < 0.01) return;
    camera.position.lerp(p, 0.13);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(t, 0.13);
      controlsRef.current.update();
    } else camera.lookAt(t);
    amount.current *= 0.84;
  });
  return null;
}

function Lights() {
  return <>
    <ambientLight intensity={0.56} />
    <hemisphereLight intensity={0.5} color="#f9fbfa" groundColor="#c9bca8" />
    <directionalLight castShadow position={[10, 16, 10]} intensity={2.0} shadow-mapSize-width={1536} shadow-mapSize-height={1536} shadow-camera-near={1} shadow-camera-far={48} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} />
    <directionalLight position={[-10, 9, -8]} intensity={0.5} color="#d1e6e1" />
  </>;
}

function Part({ id, position, size, color, rotation = [0, 0, 0], opacity = 1, selected = false, metalness = 0.02, roughness = 0.78, onClick }: { id: string; position: Vec3; size: Vec3; color: string; rotation?: Vec3; opacity?: number; selected?: boolean; metalness?: number; roughness?: number; onClick?: () => void }) {
  return <mesh name={id} userData={{ id }} position={position} rotation={rotation} castShadow receiveShadow onClick={(e) => { if (!onClick) return; e.stopPropagation(); onClick(); }}>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} metalness={metalness} roughness={roughness} emissive={selected ? C.brand : "#000"} emissiveIntensity={selected ? 0.18 : 0} />
    {selected && <Edges scale={1.008} threshold={10} color={C.brand} />}
  </mesh>;
}

function CylinderPart({ id, position, args, color, selected = false, onClick }: { id: string; position: Vec3; args: [number, number, number, number]; color: string; selected?: boolean; onClick?: () => void }) {
  return <mesh name={id} position={position} castShadow receiveShadow onClick={(e) => { if (!onClick) return; e.stopPropagation(); onClick(); }}>
    <cylinderGeometry args={args} />
    <meshStandardMaterial color={color} roughness={0.55} metalness={0.08} emissive={selected ? C.brand : "#000"} emissiveIntensity={selected ? 0.18 : 0} />
    {selected && <Edges color={C.brand} />}
  </mesh>;
}

function Glass({ position, size, selected = false, onClick }: { position: Vec3; size: Vec3; selected?: boolean; onClick?: () => void }) {
  return <mesh position={position} castShadow receiveShadow onClick={(e) => { if (!onClick) return; e.stopPropagation(); onClick(); }}>
    <boxGeometry args={size} />
    <meshPhysicalMaterial color={C.glass} transparent opacity={selected ? 0.62 : 0.43} transmission={0.26} thickness={0.07} roughness={0.13} emissive={selected ? C.doors : "#000"} emissiveIntensity={selected ? 0.14 : 0} />
    {selected && <Edges color={C.doors} />}
  </mesh>;
}

function WorldLabel({ position, kicker, title, detail }: { position: Vec3; kicker: string; title: string; detail?: string }) {
  return <Html position={position} center distanceFactor={9} zIndexRange={[20, 0]}>
    <div className="twin3d-world-label" dir="rtl"><small>{kicker}</small><strong>{title}</strong>{detail && <span>{detail}</span>}</div>
  </Html>;
}

function ConstructionBuilding({ selectedFloor, onSelectFloor, exploded, layers }: { selectedFloor: string; onSelectFloor: (key: string) => void; exploded: boolean; layers: Record<LayerKey, boolean> }) {
  const gap = exploded ? 1 : 0;
  const finished = (floorKey: "ground" | "first", y: number, offset: number) => {
    const selected = selectedFloor === floorKey;
    const floor = constructionFloors.find((f) => f.key === floorKey)!;
    const yy = y + gap * offset;
    const wallY = yy + 1.32;
    return <group key={floorKey} onClick={(e) => { e.stopPropagation(); onSelectFloor(floorKey); }}>
      <Part id={`${floorKey}-slab`} position={[0, yy, 0]} size={[12.4, .28, 8.3]} color={C.concrete} selected={selected} />
      {layers.shell && <>
        <Part id={`${floorKey}-back`} position={[0, wallY, -4]} size={[12.4, 2.55, .22]} color={C.wall} />
        <Part id={`${floorKey}-left`} position={[-6.08, wallY, 0]} size={[.22, 2.55, 8]} color={C.wall2} />
        <Part id={`${floorKey}-right`} position={[6.08, wallY, 0]} size={[.22, 2.55, 8]} color={C.wall2} />
        <Part id={`${floorKey}-front-left`} position={[-4.8, wallY, 4]} size={[2.55, 2.55, .22]} color={C.wall} />
        <Part id={`${floorKey}-front-center`} position={[0, wallY, 4]} size={[3.1, 2.55, .22]} color={C.wall} />
        <Part id={`${floorKey}-front-right`} position={[4.8, wallY, 4]} size={[2.55, 2.55, .22]} color={C.wall} />
        <Glass position={[-2.92, wallY + .12, 4.02]} size={[1.9, 1.28, .08]} />
        <Glass position={[2.92, wallY + .12, 4.02]} size={[1.9, 1.28, .08]} />
        <Part id={`${floorKey}-balcony`} position={[0, yy + .24, 4.48]} size={[3.4, .14, .85]} color="#b9b2a6" />
        <Part id={`${floorKey}-rail-top`} position={[0, yy + 1.05, 4.86]} size={[3.4, .05, .05]} color={C.steel} metalness={.55} roughness={.35} />
        {[-1.6,-.8,0,.8,1.6].map((x) => <Part key={x} id={`${floorKey}-rail-${x}`} position={[x, yy + .68, 4.86]} size={[.04,.76,.04]} color={C.steel} metalness={.55} />)}
        {floorKey === "ground" && <>
          <Part id="entry-left" position={[-.9, wallY, 4.02]} size={[.22,2.55,.2]} color="#b7b0a5" />
          <Part id="entry-right" position={ [.9, wallY, 4.02]} size={[.22,2.55,.2]} color="#b7b0a5" />
          <Glass position={[0, wallY-.1,4.04]} size={[1.45,2.15,.08]} />
        </>}
      </>}
      {selected && <WorldLabel position={[0, wallY + 2.1, 0]} kicker="الدور المحدد" title={floor.name} detail={`${floor.progress}% مكتمل`} />}
    </group>;
  };

  return <>
    <Lights />
    {layers.shell && <>
      <group onClick={(e) => { e.stopPropagation(); onSelectFloor("foundation"); }}>
        <Part id="foundation-slab" position={[0,.1,0]} size={[12.9,.38,8.9]} color={C.concreteDark} selected={selectedFloor === "foundation"} />
        {[-4.8,0,4.8].flatMap((x) => [-3.1,3.1].map((z) => <Part key={`${x}-${z}`} id={`footing-${x}-${z}`} position={[x,-.22,z]} size={[1.35,.55,1.35]} color="#8f8c85" />))}
        {selectedFloor === "foundation" && <WorldLabel position={[0,1.05,0]} kicker="طبقة البناء" title="الأساسات" detail="100% مكتمل" />}
      </group>
      {finished("ground", .18, .35)}
      {finished("first", 2.95, 1.05)}
      <group onClick={(e) => { e.stopPropagation(); onSelectFloor("second"); }}>
        <Part id="second-slab" position={[0,5.72 + gap*1.75,0]} size={[12.4,.28,8.3]} color={C.concrete} selected={selectedFloor === "second"} />
        {[-5.75,-1.9,1.9,5.75].flatMap((x) => [-3.7,3.7].map((z) => <Part key={`${x}-${z}`} id={`second-col-${x}-${z}`} position={[x,7.07 + gap*1.75,z]} size={[.28,2.7,.28]} color="#a39f97" />))}
        <Part id="second-partial-back" position={[-2.2,7.02 + gap*1.75,-4]} size={[7.9,1.65,.2]} color="#d7d0c5" />
        <Part id="second-brick-a" position={[-4.35,6.45 + gap*1.75,4]} size={[2.65,1.35,.18]} color={C.brick} />
        <Part id="second-brick-b" position={[3.7,6.32 + gap*1.75,4]} size={[2.8,1.08,.18]} color={C.brick} />
        {[-5.9,-3.9,-1.9,0,1.9,3.9,5.9].map((x) => <Part key={x} id={`scaffold-v-${x}`} position={[x,7.05 + gap*1.75,4.5]} size={[.06,2.8,.06]} color={C.scaffold} metalness={.5} />)}
        <Part id="scaffold-mid" position={[0,6.9 + gap*1.75,4.5]} size={[12.8,.06,.06]} color={C.scaffold} metalness={.5} />
        <Part id="scaffold-top" position={[0,8.2 + gap*1.75,4.5]} size={[12.8,.06,.06]} color={C.scaffold} metalness={.5} />
        {selectedFloor === "second" && <WorldLabel position={[0,9.45 + gap*1.75,0]} kicker="قيد البناء الآن" title="الدور الثاني" detail="46% · جدران وفتحات" />}
      </group>
      <group onClick={(e) => { e.stopPropagation(); onSelectFloor("roof"); }}>
        <Part id="roof-ghost" position={[0,8.62 + gap*2.45,0]} size={[12.4,.2,8.3]} color="#c6d4d0" opacity={.23} selected={selectedFloor === "roof"} />
        <Part id="roof-service" position={[3.8,9.12 + gap*2.45,-2.4]} size={[2.2,.9,1.5]} color="#b7c6c1" opacity={.28} />
        {selectedFloor === "roof" && <WorldLabel position={[0,10.25 + gap*2.45,0]} kicker="مرحلة قادمة" title="السطح والخدمات" detail="لم يبدأ" />}
      </group>
    </>}
    {layers.spaces && <>
      <Part id="site-line-left" position={[-7.1,.16,0]} size={[.05,.14,11]} color="#9fb2ac" />
      <Part id="site-line-right" position={[7.1,.16,0]} size={[.05,.14,11]} color="#9fb2ac" />
      <Part id="site-line-back" position={[0,.16,-5.5]} size={[14.2,.14,.05]} color="#9fb2ac" />
    </>}
    {layers.furniture && <>
      <Part id="materials-a" position={[-8.1,.3,2.7]} size={[1.8,.5,1.2]} color="#a67e5c" />
      <Part id="materials-b" position={[8.1,.43,-1.8]} size={[1.2,.86,2.4]} color="#aaa69e" />
    </>}
    {layers.systems && <>
      <Line points={[[-5.1,.12,4.85],[-5.1,.12,-3.7],[5.1,.12,-3.7]]} color={C.plumbing} lineWidth={2.2} transparent opacity={.8} />
      <Line points={[[5.45,.13,4.7],[5.45,.13,-3.6]]} color={C.electrical} lineWidth={2.2} transparent opacity={.82} />
    </>}
    <Grid position={[0,-.52,0]} args={[34,34]} cellSize={.5} cellThickness={.45} cellColor="#b8c7c2" sectionSize={2} sectionThickness={.8} sectionColor="#8ea79f" fadeDistance={28} fadeStrength={1.2} infiniteGrid />
    <ContactShadows position={[0,-.49,0]} opacity={.3} scale={30} blur={2.2} far={18} />
  </>;
}

function RoomZones({ selected, onSelect }: { selected: RoomId; onSelect: (room: RoomId) => void }) {
  return <>{roomDefinitions.map((room) => {
    const line: Vec3[] = [[room.x-room.w/2,.045,room.z-room.d/2],[room.x+room.w/2,.045,room.z-room.d/2],[room.x+room.w/2,.045,room.z+room.d/2],[room.x-room.w/2,.045,room.z+room.d/2],[room.x-room.w/2,.045,room.z-room.d/2]];
    const active = selected === room.id;
    return <group key={room.id}>
      <mesh rotation={[-Math.PI/2,0,0]} position={[room.x,.03,room.z]} receiveShadow onClick={(e) => { e.stopPropagation(); onSelect(room.id); }}>
        <planeGeometry args={[room.w,room.d]} />
        <meshStandardMaterial color={room.color} transparent opacity={active ? .4 : .15} roughness={.9} />
      </mesh>
      <Line points={line} color={active ? C.brand : "#b8c4c0"} lineWidth={active ? 2.5 : 1} transparent opacity={active ? .95 : .4} />
      {active && <WorldLabel position={[room.x,2.5,room.z]} kicker="المساحة المحددة" title={room.name} detail="اختر نظامًا لفحص تفاصيله" />}
    </group>;
  })}</>;
}

function HomeShell({ selectedRoom, onSelectRoom, selectedSystem, onSelectSystem }: { selectedRoom: RoomId; onSelectRoom: (room: RoomId) => void; selectedSystem: SystemKey; onSelectSystem: (key: SystemKey) => void }) {
  const finishActive = selectedSystem === "finish";
  const doorsActive = selectedSystem === "doors";
  return <group>
    <Part id="home-slab" position={[0,-.08,0]} size={[12.7,.22,8.5]} color={finishActive ? "#c1aa91" : "#cfc7ba"} selected={finishActive} onClick={() => onSelectSystem("finish")} />
    <Part id="home-back" position={[0,1.35,-4.05]} size={[12.5,2.7,.2]} color={finishActive ? "#e2d5c5" : C.wall} selected={finishActive} onClick={() => onSelectSystem("finish")} />
    <Part id="home-left" position={[-6.15,1.35,0]} size={[.2,2.7,8.1]} color={C.wall2} selected={finishActive} onClick={() => onSelectSystem("finish")} />
    <Part id="home-right" position={[6.15,1.35,0]} size={[.2,2.7,8.1]} color={C.wall2} selected={finishActive} onClick={() => onSelectSystem("finish")} />
    <Part id="partition-a" position={[.25,1.35,.05]} size={[.18,2.7,7.8]} color="#e6e0d6" selected={finishActive} onClick={() => onSelectSystem("finish")} />
    <Part id="partition-b" position={[-2.05,1.35,-1]} size={[4.4,2.7,.17]} color="#e6e0d6" selected={finishActive} onClick={() => onSelectSystem("finish")} />
    <Part id="partition-c" position={[3,1.35,-1]} size={[5.7,2.7,.17]} color="#e6e0d6" selected={finishActive} onClick={() => onSelectSystem("finish")} />
    <Part id="partition-d" position={[2.65,1.35,-2.35]} size={[.17,2.7,2.65]} color="#e6e0d6" selected={finishActive} onClick={() => onSelectSystem("finish")} />

    <Glass position={[-3.25,1.45,4.02]} size={[2.4,1.6,.07]} selected={doorsActive} onClick={() => onSelectSystem("doors")} />
    <Glass position={[3.25,1.45,4.02]} size={[2.1,1.6,.07]} selected={doorsActive} onClick={() => onSelectSystem("doors")} />
    <Part id="front-window-frame-a" position={[-3.25,1.45,4.06]} size={[2.58,1.78,.055]} color={C.doors} opacity={doorsActive ? .9 : .35} selected={doorsActive} onClick={() => onSelectSystem("doors")} />
    <Part id="front-window-frame-b" position={[3.25,1.45,4.06]} size={[2.28,1.78,.055]} color={C.doors} opacity={doorsActive ? .9 : .35} selected={doorsActive} onClick={() => onSelectSystem("doors")} />

    {[
      { id:"door-living", p:[-.68,1.05,-.7] as Vec3, s:[.08,2.05,.9] as Vec3 },
      { id:"door-master", p:[-1.45,1.05,-1.02] as Vec3, s:[.9,2.05,.08] as Vec3 },
      { id:"door-bedroom", p:[1.15,1.05,-1.02] as Vec3, s:[.9,2.05,.08] as Vec3 },
      { id:"door-bath", p:[2.68,1.05,-2.2] as Vec3, s:[.08,2.05,.9] as Vec3 },
    ].map((door) => <Part key={door.id} id={door.id} position={door.p} size={door.s} color="#866d58" selected={doorsActive} opacity={doorsActive ? 1 : .78} onClick={() => onSelectSystem("doors")} />)}

    <RoomZones selected={selectedRoom} onSelect={onSelectRoom} />
    {finishActive && <WorldLabel position={[-5.3,2.75,-3.7]} kicker="النظام المحدد" title="التشطيبات" detail="أرضيات · دهانات · كسوات" />}
    {doorsActive && <WorldLabel position={[0,3.05,3.6]} kicker="النظام المحدد" title="الأبواب والنوافذ" detail="الفتحات والإطارات والزجاج" />}
  </group>;
}

function Furniture({ onRoom, selectedSystem, onSystem }: { onRoom: (room: RoomId) => void; selectedSystem: SystemKey; onSystem: (key: SystemKey) => void }) {
  return <group>
    <group onClick={(e) => { e.stopPropagation(); onRoom("living"); }}>
      <Part id="sofa-main" position={[-4.55,.47,1.2]} size={[.9,.62,3.1]} color="#9f8f7d" />
      <Part id="sofa-front" position={[-3.35,.36,2.75]} size={[2.8,.45,.88]} color="#ae9e8b" />
      <Part id="coffee-table" position={[-2.65,.35,1.25]} size={[1.65,.28,.95]} color="#8f6b50" />
      <Part id="tv-wall" position={[-1.0,1.05,1.2]} size={[.18,1.35,2.6]} color="#31433f" metalness={.2} roughness={.48} />
    </group>
    <group onClick={(e) => { e.stopPropagation(); onRoom("kitchen"); }}>
      <Part id="kitchen-counter-back" position={[3.45,.48,-.72]} size={[4.2,.9,.68]} color="#d7d0c4" />
      <Part id="kitchen-counter-right" position={[5.22,.48,1.4]} size={[.68,.9,3.75]} color="#d7d0c4" />
      <Part id="kitchen-island" position={[3,.48,1.35]} size={[2.35,.9,.9]} color="#c9bea9" />
      <Part id="fridge" position={[4.75,1.1,-.58]} size={[.95,2.05,.78]} color="#717b78" metalness={.48} roughness={.35} selected={selectedSystem === "facilities"} onClick={() => onSystem("facilities")} />
      <Part id="sink" position={[2.3,.95,-.7]} size={[1.05,.08,.5]} color="#839a96" metalness={.55} roughness={.32} selected={selectedSystem === "plumbing"} onClick={() => onSystem("plumbing")} />
      <Part id="hob" position={[3.55,.96,-.7]} size={[.95,.06,.48]} color="#263b37" selected={selectedSystem === "facilities"} onClick={() => onSystem("facilities")} />
    </group>
    {([[-3.55,-2.4,"master"],[.7,-2.4,"bedroom"]] as Array<[number,number,RoomId]>).map(([x,z,room]) => <group key={room} onClick={(e) => { e.stopPropagation(); onRoom(room); }}>
      <Part id={`${room}-bed-base`} position={[x,.24,z]} size={[2.15,.42,1.65]} color="#8d6f5b" />
      <Part id={`${room}-mattress`} position={[x,.54,z]} size={[2.05,.28,1.58]} color="#e7e1d8" />
      <Part id={`${room}-head`} position={[x,.98,z-.78]} size={[2.15,1.2,.15]} color="#9f8d82" />
      <Part id={`${room}-wardrobe`} position={[x+1.45,1.05,z-.7]} size={[.65,2.05,1.2]} color="#bca78e" />
    </group>)}
    <group onClick={(e) => { e.stopPropagation(); onRoom("bath"); }}>
      <Part id="bath-vanity" position={[3.75,.45,-3.15]} size={[.95,.82,.48]} color="#d7d2c9" />
      <CylinderPart id="bath-wc" position={[4.85,.45,-3.15]} args={[.3,.34,.75,24]} color="#e9e7e0" selected={selectedSystem === "plumbing"} onClick={() => onSystem("plumbing")} />
      <Glass position={[5.1,1,-1.75]} size={[.07,1.9,1]} selected={selectedSystem === "doors"} onClick={() => onSystem("doors")} />
      <Part id="shower-floor" position={[5.15,.08,-1.95]} size={[1.25,.1,1.25]} color="#aebfc0" selected={selectedSystem === "plumbing"} onClick={() => onSystem("plumbing")} />
    </group>
  </group>;
}

function SystemOverlay({ selected, onSelect }: { selected: SystemKey; onSelect: (key: SystemKey) => void }) {
  const opacity = (key: SystemKey) => selected === key ? .98 : .18;
  return <group>
    <group onClick={(e) => { e.stopPropagation(); onSelect("plumbing"); }}>
      <Line points={[[5.1,.15,-3.1],[5.1,.15,.2],[2.2,.15,.2],[2.2,.15,-.7]]} color={C.plumbing} lineWidth={selected === "plumbing" ? 4 : 1.5} transparent opacity={opacity("plumbing")} />
      <Line points={[[4.7,.22,-3],[4.7,.22,-.4],[2.65,.22,-.4]]} color="#6db3d0" lineWidth={selected === "plumbing" ? 3 : 1.3} transparent opacity={opacity("plumbing")} />
    </group>
    <group onClick={(e) => { e.stopPropagation(); onSelect("electricity"); }}>
      <Line points={[[-5.5,2.45,-3.6],[-5.5,2.45,3.4],[5.4,2.45,3.4],[5.4,2.45,-3.6]]} color={C.electrical} lineWidth={selected === "electricity" ? 4 : 1.5} transparent opacity={opacity("electricity")} />
      {[[-5.2,.65,2.5],[-1,.65,2.5],[2.1,.65,2.8],[5.25,.65,1.6],[-4.2,.65,-3.5],[1.2,.65,-3.5]].map((p,index) => <Part key={index} id={`outlet-${index}`} position={p as Vec3} size={[.13,.22,.05]} color={C.electrical} opacity={opacity("electricity")} selected={selected === "electricity"} onClick={() => onSelect("electricity")} />)}
    </group>
    <group onClick={(e) => { e.stopPropagation(); onSelect("air"); }}>
      <Line points={[[0,2.34,-3.6],[0,2.34,2.8],[-3.3,2.34,2.8]]} color={C.hvac} lineWidth={selected === "air" ? 4 : 1.5} transparent opacity={opacity("air")} />
      <Line points={[[0,2.34,.4],[3.55,2.34,.4]]} color={C.hvac} lineWidth={selected === "air" ? 4 : 1.5} transparent opacity={opacity("air")} />
      <Part id="ac-living" position={[-5.95,2.1,1.4]} size={[.18,.48,1.5]} color="#e7ecea" opacity={selected === "air" ? 1 : .35} selected={selected === "air"} onClick={() => onSelect("air")} />
      <Part id="ac-master" position={[-3.4,2.1,-3.92]} size={[1.45,.46,.16]} color="#e7ecea" opacity={selected === "air" ? 1 : .35} selected={selected === "air"} onClick={() => onSelect("air")} />
    </group>

    <group onClick={(e) => { e.stopPropagation(); onSelect("facilities"); }}>
      <Part id="electrical-panel" position={[5.96,1.35,2.7]} size={[.14,1.05,.7]} color="#77837f" opacity={selected === "facilities" ? 1 : .35} selected={selected === "facilities"} onClick={() => onSelect("facilities")} />
      <CylinderPart id="water-heater" position={[5.55,1.7,-3.55]} args={[.34,.34,1.25,24]} color="#aeb8b5" selected={selected === "facilities"} onClick={() => onSelect("facilities")} />
      <CylinderPart id="smoke-detector" position={[-2.6,2.58,1.7]} args={[.17,.17,.06,24]} color="#f0eee8" selected={selected === "facilities"} onClick={() => onSelect("facilities")} />
      <Part id="service-router" position={[-5.65,.78,-3.55]} size={[.5,.42,.18]} color="#687a75" opacity={selected === "facilities" ? 1 : .38} selected={selected === "facilities"} onClick={() => onSelect("facilities")} />
    </group>

    {selected === "electricity" && <WorldLabel position={[-5.2,3.1,2.8]} kicker="النظام المحدد" title="الكهرباء" detail="لوحة · مخارج · مسار التغذية" />}
    {selected === "plumbing" && <WorldLabel position={[4.9,2.55,-2.55]} kicker="النظام المحدد" title="السباكة" detail="مياه · صرف · نقاط الخدمة" />}
    {selected === "air" && <WorldLabel position={[-3.4,3.05,-3.55]} kicker="النظام المحدد" title="التكييف والتهوية" detail="وحدات داخلية · مسارات هواء" />}
    {selected === "facilities" && <WorldLabel position={[5.3,3.25,1.8]} kicker="النظام المحدد" title="المرافق والتجهيزات" detail="لوحة · سخان · حساسات" />}
  </group>;
}

function MaintenanceMarker({ position, title, tone, onClick }: { position: Vec3; title: string; tone: "open" | "planned"; onClick: () => void }) {
  return <Html position={position} center distanceFactor={8.5} zIndexRange={[30,0]}>
    <button type="button" className={`twin3d-maintenance-marker ${tone}`} onClick={(e) => { e.stopPropagation(); onClick(); }}><Wrench size={13} /><span>{title}</span></button>
  </Html>;
}

function HomeScene({ selectedRoom, onRoom, selectedSystem, onSystem, layers }: { selectedRoom: RoomId; onRoom: (r: RoomId) => void; selectedSystem: SystemKey; onSystem: (s: SystemKey) => void; layers: Record<LayerKey, boolean> }) {
  return <>
    <Lights />
    {layers.shell && <HomeShell selectedRoom={selectedRoom} onSelectRoom={onRoom} selectedSystem={selectedSystem} onSelectSystem={onSystem} />}
    {layers.furniture && <Furniture onRoom={onRoom} selectedSystem={selectedSystem} onSystem={onSystem} />}
    {layers.systems && <SystemOverlay selected={selectedSystem} onSelect={onSystem} />}
    {layers.spaces && <>
      <MaintenanceMarker position={[2.3,1.75,-.4]} title="بلاغ تسرب · المطبخ" tone="open" onClick={() => { onRoom("kitchen"); onSystem("plumbing"); }} />
      <MaintenanceMarker position={[-3.4,2.8,-3.65]} title="فحص تكييف · مجدول" tone="planned" onClick={() => { onRoom("master"); onSystem("air"); }} />
    </>}
    <Grid position={[0,-.24,0]} args={[28,28]} cellSize={.5} cellThickness={.42} cellColor="#b8c7c2" sectionSize={2} sectionThickness={.75} sectionColor="#8ea79f" fadeDistance={23} fadeStrength={1.1} infiniteGrid />
    <ContactShadows position={[0,-.21,0]} opacity={.34} scale={25} blur={2.2} far={12} />
  </>;
}

const layerMeta: Array<{ key: LayerKey; label: string; icon: typeof Box }> = [
  { key: "shell", label: "الهيكل", icon: Building2 },
  { key: "spaces", label: "المساحات", icon: Grid3X3 },
  { key: "furniture", label: "التجهيزات", icon: Sofa },
  { key: "systems", label: "الأنظمة", icon: Zap },
];

export function ResidentialDigitalTwin({
  mode,
  selectedFloorKey = "second",
  onSelectFloor = () => undefined,
  selectedRoomId = "kitchen",
  onSelectRoom = () => undefined,
  selectedSystemKey = "plumbing",
  onSelectSystem = () => undefined,
  compact = false,
}: Props) {
  const [preset, setPreset] = useState<ViewPreset>("iso");
  const [nonce, setNonce] = useState(0);
  const [exploded, setExploded] = useState(false);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ shell: true, spaces: true, furniture: true, systems: true });
  const controlsRef = useRef<any>(null);
  const focus = mode === "construction" ? constructionFocus[selectedFloorKey] : roomFocus[selectedRoomId];
  const floor = constructionFloors.find((f) => f.key === selectedFloorKey);
  const SystemIcon = systemMeta[selectedSystemKey].icon;

  return <section className={`twin3d-viewer ${compact ? "compact" : ""}`} aria-label={mode === "construction" ? "مجسم ثلاثي الأبعاد تفاعلي لمتابعة البناء" : "مجسم ثلاثي الأبعاد تفاعلي للوحدة السكنية"}>
    <header className="twin3d-commandbar">
      <div className="twin3d-commandbar-title"><span className="twin3d-live-dot" /><div><small>{mode === "construction" ? "DIGITAL TWIN · CONSTRUCTION" : "DIGITAL TWIN · HOME"}</small><strong>{mode === "construction" ? "المسكن أثناء البناء" : "الوحدة بعد الاستلام"}</strong></div></div>
      <div className="twin3d-view-presets" aria-label="زوايا العرض">
        <button className={preset === "iso" ? "active" : ""} onClick={() => setPreset("iso")}><Maximize2 size={15}/><span>منظور</span></button>
        <button className={preset === "top" ? "active" : ""} onClick={() => setPreset("top")}><Grid3X3 size={15}/><span>علوي</span></button>
        <button className={preset === "front" ? "active" : ""} onClick={() => setPreset("front")}><Box size={15}/><span>أمامي</span></button>
        <button className={preset === "walk" ? "active" : ""} onClick={() => setPreset("walk")}><Home size={15}/><span>قريب</span></button>
      </div>
      <div className="twin3d-command-actions">
        <button onClick={() => setNonce((n) => n+1)}><Focus size={16}/><span>تركيز</span></button>
        {mode === "construction" && <button className={exploded ? "active" : ""} onClick={() => setExploded((v) => !v)}><Layers3 size={16}/><span>تفكيك</span></button>}
        <button onClick={() => { setPreset("iso"); setExploded(false); setNonce((n) => n+1); }}><RotateCcw size={16}/><span>إعادة</span></button>
      </div>
    </header>

    <div className="twin3d-canvas-wrap">
      <Canvas shadows dpr={[1,1.65]} gl={{ antialias: true, powerPreference: "high-performance" }} camera={{ position: presets[mode].iso.camera, fov: mode === "construction" ? 34 : 36, near: .1, far: 120 }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = .98; gl.outputColorSpace = THREE.SRGBColorSpace; }}>
        <color attach="background" args={["#edf2f0"]}/>
        <fog attach="fog" args={["#edf2f0",24,52]}/>
        <CameraRig mode={mode} preset={preset} focus={focus} nonce={nonce} controlsRef={controlsRef} />
        {mode === "construction"
          ? <ConstructionBuilding selectedFloor={selectedFloorKey} onSelectFloor={(key) => { onSelectFloor(key); setNonce((n) => n+1); }} exploded={exploded} layers={layers} />
          : <HomeScene selectedRoom={selectedRoomId} onRoom={(room) => { onSelectRoom(room); setNonce((n) => n+1); }} selectedSystem={selectedSystemKey} onSystem={onSelectSystem} layers={layers} />}
        <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={.08} minDistance={5.3} maxDistance={mode === "construction" ? 32 : 25} minPolarAngle={.15} maxPolarAngle={Math.PI/2.08} enablePan screenSpacePanning />
      </Canvas>

      <div className="twin3d-hud twin3d-hud-status">
        {mode === "construction" ? <><Construction size={15}/><span>{floor?.name ?? "الدور"}</span><strong>{floor?.progress ?? 0}%</strong></> : <><SystemIcon size={15}/><span>{roomNames[selectedRoomId]}</span><strong>{systemMeta[selectedSystemKey].label}</strong></>}
      </div>
      <div className="twin3d-hud twin3d-hud-help"><span>اسحب للدوران</span><i/><span>قرّب بإصبعين</span><i/><span>اضغط على العنصر</span></div>
    </div>

    <footer className="twin3d-layerbar">
      <div className="twin3d-layerbar-label"><Layers3 size={16}/><span>طبقات العرض</span></div>
      <div className="twin3d-layer-buttons">
        {layerMeta.map(({ key,label,icon:Icon }) => <button key={key} className={layers[key] ? "active" : ""} aria-pressed={layers[key]} onClick={() => setLayers((current) => ({ ...current, [key]: !current[key] }))}>{layers[key] ? <Eye size={14}/> : <EyeOff size={14}/>}<Icon size={14}/><span>{label}</span></button>)}
      </div>
      <div className="twin3d-quality"><CheckCircle2 size={14}/><span>WebGL · تفاعل مباشر</span></div>
    </footer>
  </section>;
}
