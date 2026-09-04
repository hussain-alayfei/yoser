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
  Grid3X3,
  Hammer,
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
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { constructionFloors } from "@/constructionData";

type Vec3 = [number, number, number];
type ViewPreset = "iso" | "top" | "front" | "walk";
type LayerName = "shell" | "rooms" | "furniture" | "mep";
export type SystemKey = "electricity" | "plumbing" | "air" | "finish" | "doors" | "facilities";
export type RoomId = "living" | "kitchen" | "master" | "bedroom" | "bath";

type CameraTarget = { camera: Vec3; target: Vec3 };

type ResidentialTwin3DProps = {
  mode: "construction" | "home";
  selectedFloorKey?: string;
  onSelectFloor?: (key: string) => void;
  selectedRoomId?: RoomId;
  onSelectRoom?: (room: RoomId) => void;
  selectedSystemKey?: SystemKey;
  onSelectSystem?: (system: SystemKey) => void;
  compact?: boolean;
};

const palette = {
  ink: "#173f38",
  brand: "#0b4f46",
  brandLight: "#90bdb2",
  concrete: "#d9d5ca",
  concreteDark: "#aaa59a",
  wall: "#eee9df",
  wallWarm: "#e4ded2",
  glass: "#88aeb5",
  timber: "#98745a",
  floor: "#d8cbb8",
  metal: "#65716d",
  steel: "#76827e",
  active: "#d99242",
  warning: "#c65a43",
  electricity: "#d2a33d",
  plumbing: "#3f83a9",
  air: "#57a599",
};

const constructionTargets: Record<string, CameraTarget> = {
  foundation: { camera: [11, 5.1, 12], target: [0, 0.35, 0] },
  ground: { camera: [11.8, 5.5, 12.5], target: [0, 1.65, 0] },
  first: { camera: [12.2, 7.1, 12.8], target: [0, 4.35, 0] },
  second: { camera: [12.8, 9.3, 13], target: [0, 7.05, 0] },
  roof: { camera: [12.4, 11.1, 12.2], target: [0, 9.4, 0] },
};

const homeRoomTargets: Record<RoomId, CameraTarget> = {
  living: { camera: [-8.5, 6.2, 8.8], target: [-3.2, 1.0, 1.3] },
  kitchen: { camera: [8.4, 5.7, 8.4], target: [3.5, 1.0, 1.35] },
  master: { camera: [-8.1, 5.6, -7.5], target: [-3.45, 1.0, -2.3] },
  bedroom: { camera: [3.5, 5.4, -8.7], target: [0.65, 1.0, -2.3] },
  bath: { camera: [8.5, 5.0, -6.8], target: [4.3, 1.0, -2.25] },
};

const presetTargets: Record<"construction" | "home", Record<ViewPreset, CameraTarget>> = {
  construction: {
    iso: { camera: [14.5, 10.5, 16], target: [0, 4.5, 0] },
    top: { camera: [0.1, 25, 0.1], target: [0, 4.2, 0] },
    front: { camera: [0, 6.6, 21], target: [0, 4.2, 0] },
    walk: { camera: [-7.2, 2.25, 8.4], target: [0, 2.0, 0] },
  },
  home: {
    iso: { camera: [13.8, 10.4, 14.8], target: [0, 0.8, 0] },
    top: { camera: [0.1, 18.5, 0.1], target: [0, 0, 0] },
    front: { camera: [0, 5.0, 17], target: [0, 0.8, 0] },
    walk: { camera: [-4.9, 1.7, 5.6], target: [-1.2, 1.2, 0] },
  },
};

function CameraRig({
  mode,
  preset,
  focusTarget,
  focusNonce,
  controlsRef,
}: {
  mode: "construction" | "home";
  preset: ViewPreset;
  focusTarget?: CameraTarget;
  focusNonce: number;
  controlsRef: React.MutableRefObject<any>;
}) {
  const { camera } = useThree();
  const blend = useRef(1);
  const desired = focusTarget ?? presetTargets[mode][preset];
  const position = useMemo(() => new THREE.Vector3(...desired.camera), [desired.camera]);
  const target = useMemo(() => new THREE.Vector3(...desired.target), [desired.target]);

  useEffect(() => {
    blend.current = 1;
  }, [mode, preset, focusNonce, position, target]);

  useFrame(() => {
    if (blend.current < 0.012) return;
    camera.position.lerp(position, 0.13);
    const controls = controlsRef.current;
    if (controls) {
      controls.target.lerp(target, 0.13);
      controls.update();
    } else {
      camera.lookAt(target);
    }
    blend.current *= 0.84;
  });

  return null;
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.58} />
      <hemisphereLight intensity={0.5} color="#f8fbfa" groundColor="#cbbda7" />
      <directionalLight
        castShadow
        position={[10, 16, 10]}
        intensity={2.05}
        shadow-mapSize-width={1536}
        shadow-mapSize-height={1536}
        shadow-camera-near={1}
        shadow-camera-far={48}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <directionalLight position={[-10, 9, -8]} intensity={0.54} color="#cde4df" />
    </>
  );
}

function Part({
  id,
  position,
  size,
  color,
  rotation = [0, 0, 0],
  opacity = 1,
  metalness = 0.03,
  roughness = 0.78,
  selected = false,
  onSelect,
  castShadow = true,
  receiveShadow = true,
}: {
  id: string;
  position: Vec3;
  size: Vec3;
  color: string;
  rotation?: Vec3;
  opacity?: number;
  metalness?: number;
  roughness?: number;
  selected?: boolean;
  onSelect?: (id: string) => void;
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  return (
    <mesh
      name={id}
      userData={{ id }}
      position={position}
      rotation={rotation}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      onClick={(event) => {
        if (!onSelect) return;
        event.stopPropagation();
        onSelect(id);
      }}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        metalness={metalness}
        roughness={roughness}
        emissive={selected ? palette.brand : "#000000"}
        emissiveIntensity={selected ? 0.18 : 0}
      />
      {selected && <Edges scale={1.008} threshold={10} color="#0b4f46" />}
    </mesh>
  );
}

function Glass({ position, size, rotation = [0, 0, 0] }: { position: Vec3; size: Vec3; rotation?: Vec3 }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshPhysicalMaterial
        color={palette.glass}
        transparent
        opacity={0.46}
        transmission={0.28}
        thickness={0.08}
        roughness={0.14}
        metalness={0}
      />
    </mesh>
  );
}

function SelectedLabel({ position, eyebrow, title, value }: { position: Vec3; eyebrow: string; title: string; value?: string }) {
  return (
    <Html position={position} center distanceFactor={9} zIndexRange={[10, 0]}>
      <div className="twin3d-world-label" dir="rtl">
        <small>{eyebrow}</small>
        <strong>{title}</strong>
        {value && <span>{value}</span>}
      </div>
    </Html>
  );
}

function Foundation({ selected, onSelect, yOffset }: { selected: boolean; onSelect: (key: string) => void; yOffset: number }) {
  return (
    <group position={[0, yOffset, 0]} onClick={(event) => { event.stopPropagation(); onSelect("foundation"); }}>
      <Part id="FOUNDATION-SLAB" position={[0, 0.12, 0]} size={[12.9, 0.38, 8.9]} color="#aaa69d" selected={selected} />
      {[-4.8, 0, 4.8].flatMap((x) => [-3.1, 3.1].map((z) => (
        <Part key={`${x}-${z}`} id={`FOOTING-${x}-${z}`} position={[x, -0.22, z]} size={[1.35, 0.55, 1.35]} color="#98948c" />
      )))}
      {selected && <SelectedLabel position={[0, 1.0, 0]} eyebrow="طبقة البناء" title="الأساسات" value="100% مكتمل" />}
    </group>
  );
}

function FinishedFloor({
  floorKey,
  y,
  selected,
  onSelect,
  yOffset,
}: {
  floorKey: "ground" | "first";
  y: number;
  selected: boolean;
  onSelect: (key: string) => void;
  yOffset: number;
}) {
  const floor = constructionFloors.find((item) => item.key === floorKey)!;
  const wallY = y + yOffset + 1.32;
  const slabY = y + yOffset;
  const windowY = wallY + 0.15;
  return (
    <group onClick={(event) => { event.stopPropagation(); onSelect(floorKey); }}>
      <Part id={`${floorKey}-SLAB`} position={[0, slabY, 0]} size={[12.4, 0.28, 8.3]} color="#c9c3b7" selected={selected} />
      <Part id={`${floorKey}-BACK`} position={[0, wallY, -4.0]} size={[12.4, 2.55, 0.22]} color={palette.wall} />
      <Part id={`${floorKey}-LEFT`} position={[-6.08, wallY, 0]} size={[0.22, 2.55, 8]} color={palette.wallWarm} />
      <Part id={`${floorKey}-RIGHT`} position={[6.08, wallY, 0]} size={[0.22, 2.55, 8]} color={palette.wallWarm} />
      <Part id={`${floorKey}-FRONT-L`} position={[-4.75, wallY, 4.0]} size={[2.65, 2.55, 0.22]} color={palette.wall} />
      <Part id={`${floorKey}-FRONT-M`} position={[0, wallY, 4.0]} size={[3.15, 2.55, 0.22]} color={palette.wall} />
      <Part id={`${floorKey}-FRONT-R`} position={[4.75, wallY, 4.0]} size={[2.65, 2.55, 0.22]} color={palette.wall} />
      <Glass position={[-2.9, windowY, 4.02]} size={[1.9, 1.25, 0.08]} />
      <Glass position={[2.9, windowY, 4.02]} size={[1.9, 1.25, 0.08]} />
      <Part id={`${floorKey}-BALCONY`} position={[0, y + yOffset + 0.22, 4.45]} size={[3.4, 0.14, 0.85]} color="#b9b2a6" />
      <Part id={`${floorKey}-RAIL`} position={[0, y + yOffset + 1.0, 4.84]} size={[3.4, 0.06, 0.06]} color={palette.metal} metalness={0.55} roughness={0.4} />
      {[-1.6, -0.8, 0, 0.8, 1.6].map((x) => (
        <Part key={x} id={`${floorKey}-RAIL-${x}`} position={[x, y + yOffset + 0.65, 4.84]} size={[0.045, 0.72, 0.045]} color={palette.metal} metalness={0.55} roughness={0.4} />
      ))}
      {floorKey === "ground" && (
        <>
          <Part id="GROUND-ENTRY-L" position={[-0.9, wallY, 4.02]} size={[0.25, 2.55, 0.2]} color="#b8b2a6" />
          <Part id="GROUND-ENTRY-R" position={[0.9, wallY, 4.02]} size={[0.25, 2.55, 0.2]} color="#b8b2a6" />
          <Glass position={[0, wallY - 0.1, 4.04]} size={[1.45, 2.15, 0.08]} />
        </>
      )}
      {selected && <SelectedLabel position={[0, wallY + 2.15, 0]} eyebrow="الدور المحدد" title={floor.name} value={`${floor.progress}% مكتمل`} />}
    </group>
  );
}

function ActiveConstructionFloor({ selected, onSelect, yOffset }: { selected: boolean; onSelect: (key: string) => void; yOffset: number }) {
  const floor = constructionFloors.find((item) => item.key === "second")!;
  const baseY = 5.72 + yOffset;
  const columnY = baseY + 1.35;
  return (
    <group onClick={(event) => { event.stopPropagation(); onSelect("second"); }}>
      <Part id="SECOND-SLAB" position={[0, baseY, 0]} size={[12.4, 0.28, 8.3]} color="#c6c1b7" selected={selected} />
      {[-5.75, -1.9, 1.9, 5.75].flatMap((x) => [-3.7, 3.7].map((z) => (
        <Part key={`${x}-${z}`} id={`SECOND-COLUMN-${x}-${z}`} position={[x, columnY, z]} size={[0.28, 2.7, 0.28]} color="#a7a39a" />
      )))}
      <Part id="SECOND-BACK-PARTIAL" position={[-2.25, columnY, -4]} size={[7.8, 1.7, 0.2]} color="#d8d2c7" />
      <Part id="SECOND-SIDE-PARTIAL" position={[6.08, columnY - 0.35, -1.2]} size={[0.2, 1.95, 5.6]} color="#d8d2c7" />
      <Part id="SECOND-BRICK-01" position={[-4.4, baseY + 0.75, 4.0]} size={[2.6, 1.45, 0.18]} color="#c49a70" />
      <Part id="SECOND-BRICK-02" position={[3.7, baseY + 0.6, 4.0]} size={[2.8, 1.15, 0.18]} color="#c49a70" />
      {[-6.55, 6.55].map((x) => (
        <group key={x}>
          <Part id={`SCAFFOLD-V-${x}-1`} position={[x, baseY + 1.35, 3.95]} size={[0.07, 2.9, 0.07]} color={palette.active} metalness={0.5} />
          <Part id={`SCAFFOLD-V-${x}-2`} position={[x, baseY + 1.35, -3.95]} size={[0.07, 2.9, 0.07]} color={palette.active} metalness={0.5} />
          <Part id={`SCAFFOLD-H-${x}`} position={[x, baseY + 1.25, 0]} size={[0.07, 0.07, 7.9]} color={palette.active} metalness={0.5} />
        </group>
      ))}
      <Part id="SCAFFOLD-FRONT-TOP" position={[0, baseY + 2.5, 4.5]} size={[12.8, 0.07, 0.07]} color={palette.active} metalness={0.5} />
      <Part id="SCAFFOLD-FRONT-MID" position={[0, baseY + 1.2, 4.5]} size={[12.8, 0.07, 0.07]} color={palette.active} metalness={0.5} />
      {[-5.9, -3.9, -1.9, 0, 1.9, 3.9, 5.9].map((x) => (
        <Part key={x} id={`SCAFFOLD-FRONT-${x}`} position={[x, baseY + 1.35, 4.5]} size={[0.06, 2.8, 0.06]} color={palette.active} metalness={0.5} />
      ))}
      {selected && <SelectedLabel position={[0, baseY + 3.75, 0]} eyebrow="قيد البناء الآن" title={floor.name} value={`${floor.progress}% · جدران وفتحات`} />}
    </group>
  );
}

function RoofGhost({ selected, onSelect, yOffset }: { selected: boolean; onSelect: (key: string) => void; yOffset: number }) {
  return (
    <group onClick={(event) => { event.stopPropagation(); onSelect("roof"); }}>
      <Part id="ROOF-GHOST" position={[0, 8.62 + yOffset, 0]} size={[12.4, 0.2, 8.3]} color="#cbd7d3" opacity={0.22} selected={selected} />
      <Part id="ROOF-SERVICE-01" position={[3.8, 9.15 + yOffset, -2.4]} size={[2.3, 0.95, 1.6]} color="#bac8c4" opacity={0.22} />
      <Part id="ROOF-SERVICE-02" position={[-3.8, 9.05 + yOffset, -2.8]} size={[1.5, 0.75, 1.2]} color="#bac8c4" opacity={0.22} />
      {selected && <SelectedLabel position={[0, 10.25 + yOffset, 0]} eyebrow="مرحلة قادمة" title="السطح والخدمات" value="لم يبدأ" />}
    </group>
  );
}

function ConstructionScene({
  selectedFloorKey,
  onSelectFloor,
  exploded,
  layers,
}: {
  selectedFloorKey: string;
  onSelectFloor: (key: string) => void;
  exploded: boolean;
  layers: Record<LayerName, boolean>;
}) {
  const gap = exploded ? 1.0 : 0;
  return (
    <>
      <SceneLights />
      {layers.shell && (
        <group>
          <Foundation selected={selectedFloorKey === "foundation"} onSelect={onSelectFloor} yOffset={0} />
          <FinishedFloor floorKey="ground" y={0.18} selected={selectedFloorKey === "ground"} onSelect={onSelectFloor} yOffset={gap * 0.35} />
          <FinishedFloor floorKey="first" y={2.95} selected={selectedFloorKey === "first"} onSelect={onSelectFloor} yOffset={gap * 1.05} />
          <ActiveConstructionFloor selected={selectedFloorKey === "second"} onSelect={onSelectFloor} yOffset={gap * 1.75} />
          <RoofGhost selected={selectedFloorKey === "roof"} onSelect={onSelectFloor} yOffset={gap * 2.45} />
        </group>
      )}
      {layers.rooms && (
        <>
          <Part id="SITE-BOUNDARY-L" position={[-7.1, 0.18, 0]} size={[0.05, 0.18, 11]} color="#a8b9b4" />
          <Part id="SITE-BOUNDARY-R" position={[7.1, 0.18, 0]} size={[0.05, 0.18, 11]} color="#a8b9b4" />
          <Part id="SITE-BOUNDARY-B" position={[0, 0.18, -5.5]} size={[14.2, 0.18, 0.05]} color="#a8b9b4" />
        </>
      )}
      {layers.furniture && (
        <group>
          <Part id="SITE-PALLET-01" position={[-8.1, 0.25, 2.7]} size={[1.8, 0.35, 1.2]} color="#9a7251" />
          <Part id="SITE-PALLET-02" position={[-8.1, 0.65, 2.7]} size={[1.6, 0.35, 1]} color="#b58c68" />
          <Part id="SITE-MATERIAL" position={[8.1, 0.4, -1.8]} size={[1.2, 0.8, 2.4]} color="#b2aea4" />
        </group>
      )}
      {layers.mep && (
        <group>
          <Line points={[[-5.1, 0.12, 4.85], [-5.1, 0.12, -3.7], [5.1, 0.12, -3.7]]} color={palette.plumbing} lineWidth={2.2} transparent opacity={0.8} />
          <Line points={[[5.45, 0.13, 4.7], [5.45, 0.13, -3.6]]} color={palette.electricity} lineWidth={2.2} transparent opacity={0.82} />
        </group>
      )}
      <Grid position={[0, -0.52, 0]} args={[34, 34]} cellSize={0.5} cellThickness={0.45} cellColor="#b8c7c2" sectionSize={2} sectionThickness={0.8} sectionColor="#8ea79f" fadeDistance={28} fadeStrength={1.2} infiniteGrid />
      <ContactShadows position={[0, -0.49, 0]} opacity={0.3} scale={30} blur={2.2} far={18} />
    </>
  );
}

const roomDefinitions: Array<{ id: RoomId; name: string; position: [number, number]; size: [number, number]; color: string }> = [
  { id: "living", name: "المجلس والمعيشة", position: [-3.1, 1.35], size: [5.6, 4.8], color: "#d8c3a8" },
  { id: "kitchen", name: "المطبخ", position: [3.35, 1.35], size: [4.6, 4.8], color: "#b9d1ca" },
  { id: "master", name: "غرفة النوم الرئيسية", position: [-3.55, -2.35], size: [4.75, 2.65], color: "#c7c1d0" },
  { id: "bedroom", name: "غرفة النوم", position: [0.65, -2.35], size: [3.25, 2.65], color: "#d2c7bc" },
  { id: "bath", name: "دورة المياه", position: [4.35, -2.35], size: [2.25, 2.65], color: "#b8d2d8" },
];

function RoomZone({ room, selected, onSelect }: { room: typeof roomDefinitions[number]; selected: boolean; onSelect: (room: RoomId) => void }) {
  const [x, z] = room.position;
  const [w, d] = room.size;
  const line: Vec3[] = [
    [x - w / 2, 0.055, z - d / 2],
    [x + w / 2, 0.055, z - d / 2],
    [x + w / 2, 0.055, z + d / 2],
    [x - w / 2, 0.055, z + d / 2],
    [x - w / 2, 0.055, z - d / 2],
  ];
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[x, 0.035, z]}
        receiveShadow
        onClick={(event) => { event.stopPropagation(); onSelect(room.id); }}
      >
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={room.color} transparent opacity={selected ? 0.42 : 0.18} roughness={0.9} />
      </mesh>
      <Line points={line} color={selected ? palette.brand : "#b7c3bf"} lineWidth={selected ? 2.5 : 1} transparent opacity={selected ? 0.95 : 0.45} />
      {selected && <SelectedLabel position={[x, 2.35, z]} eyebrow="المساحة المحددة" title={room.name} value="اضغط على الأنظمة لرؤية حالتها" />}
    </group>
  );
}

function SofaSet({ onSelectRoom }: { onSelectRoom: (room: RoomId) => void }) {
  return (
    <group onClick={(event) => { event.stopPropagation(); onSelectRoom("living"); }}>
      <Part id="SOFA-MAIN" position={[-4.55, 0.47, 1.2]} size={[0.9, 0.62, 3.1]} color="#9f8f7d" />
      <Part id="SOFA-SEAT" position={[-3.35, 0.36, 2.75]} size={[2.8, 0.45, 0.88]} color="#ae9e8b" />
      <Part id="COFFEE-TABLE" position={[-2.65, 0.35, 1.25]} size={[1.65, 0.28, 0.95]} color="#8f6b50" />
      <Part id="TV-WALL" position={[-1.0, 1.05, 1.2]} size={[0.18, 1.35, 2.6]} color="#31433f" metalness={0.2} roughness={0.48} />
    </group>
  );
}

function KitchenFitout({ onSelectRoom, onSelectSystem, selectedSystem }: { onSelectRoom: (room: RoomId) => void; onSelectSystem: (key: SystemKey) => void; selectedSystem?: SystemKey }) {
  return (
    <group onClick={(event) => { event.stopPropagation(); onSelectRoom("kitchen"); }}>
      <Part id="KITCHEN-COUNTER-BACK" position={[3.45, 0.48, -0.72]} size={[4.2, 0.9, 0.68]} color="#d7d0c4" />
      <Part id="KITCHEN-COUNTER-RIGHT" position={[5.22, 0.48, 1.4]} size={[0.68, 0.9, 3.75]} color="#d7d0c4" />
      <Part id="KITCHEN-ISLAND" position={[3.0, 0.48, 1.35]} size={[2.35, 0.9, 0.9]} color="#c9bea9" />
      <Part id="FRIDGE" position={[4.75, 1.1, -0.58]} size={[0.95, 2.05, 0.78]} color="#717b78" metalness={0.48} roughness={0.35} />
      <mesh position={[2.3, 0.94, -0.7]} onClick={(event) => { event.stopPropagation(); onSelectSystem("plumbing"); }}>
        <boxGeometry args={[1.05, 0.08, 0.5]} />
        <meshStandardMaterial color="#839a96" metalness={0.55} roughness={0.32} emissive={selectedSystem === "plumbing" ? palette.plumbing : "#000"} emissiveIntensity={0.22} />
        {selectedSystem === "plumbing" && <Edges color={palette.plumbing} />}
      </mesh>
      <Part id="KITCHEN-HOB" position={[3.55, 0.96, -0.7]} size={[0.95, 0.06, 0.48]} color="#263b37" />
    </group>
  );
}

function Bed({ room, position, onSelectRoom }: { room: RoomId; position: Vec3; onSelectRoom: (room: RoomId) => void }) {
  return (
    <group position={position} onClick={(event) => { event.stopPropagation(); onSelectRoom(room); }}>
      <Part id={`${room}-BED-BASE`} position={[0, 0.24, 0]} size={[2.15, 0.42, 1.65]} color="#8d6f5b" />
      <Part id={`${room}-MATTRESS`} position={[0, 0.54, 0]} size={[2.05, 0.28, 1.58]} color="#e7e1d8" />
      <Part id={`${room}-HEAD`} position={[0, 0.98, -0.78]} size={[2.15, 1.2, 0.15]} color="#9f8d82" />
      <Part id={`${room}-WARDROBE`} position={[1.45, 1.05, -0.7]} size={[0.65, 2.05, 1.2]} color="#bca78e" />
    </group>
  );
}

function BathroomFitout({ onSelectRoom, onSelectSystem, selectedSystem }: { onSelectRoom: (room: RoomId) => void; onSelectSystem: (key: SystemKey) => void; selectedSystem?: SystemKey }) {
  return (
    <group onClick={(event) => { event.stopPropagation(); onSelectRoom("bath"); }}>
      <Part id="BATH-VANITY" position={[3.75, 0.45, -3.15]} size={[0.95, 0.82, 0.48]} color="#d7d2c9" />
      <mesh position={[4.85, 0.45, -3.15]} rotation={[0, 0, 0]} onClick={(event) => { event.stopPropagation(); onSelectSystem("plumbing"); }}>
        <cylinderGeometry args={[0.3, 0.34, 0.75, 24]} />
        <meshStandardMaterial color="#e9e7e0" roughness={0.46} emissive={selectedSystem === "plumbing" ? palette.plumbing : "#000"} emissiveIntensity={0.2} />
      </mesh>
      <Glass position={[5.1, 1.0, -1.75]} size={[0.07, 1.9, 1.0]} />
      <Part id="BATH-SHOWER-FLOOR" position={[5.15, 0.08, -1.95]} size={[1.25, 0.1, 1.25]} color="#aebfc0" />
    </group>
  );
}

function HomeShell({ selectedRoomId, onSelectRoom }: { selectedRoomId: RoomId; onSelectRoom: (room: RoomId) => void }) {
  return (
    <group>
      <Part id="HOME-SLAB" position={[0, -0.08, 0]} size={[12.7, 0.22, 8.5]} color="#cfc7ba" receiveShadow />
      <Part id="HOME-BACK" position={[0, 1.35, -4.05]} size={[12.5, 2.7, 0.2]} color={palette.wall} />
      <Part id="HOME-LEFT" position={[-6.15, 1.35, 0]} size={[0.2, 2.7, 8.1]} color={palette.wallWarm} />
      <Part id="HOME-RIGHT" position={[6.15, 1.35, 0]} size={[0.2, 2.7, 8.1]} color={palette.wallWarm} />
      <Part id="PARTITION-A" position={[0.25, 1.35, 0.05]} size={[0.18, 2.7, 7.8]} color="#e6e0d6" />
      <Part id="PARTITION-B" position={[-2.05, 1.35, -1.0]} size={[4.4, 2.7, 0.17]} color="#e6e0d6" />
      <Part id="PARTITION-C" position={[3.0, 1.35, -1.0]} size={[5.7, 2.7, 0.17]} color="#e6e0d6" />
      <Part id="PARTITION-D" position={[2.65, 1.35, -2.35]} size={[0.17, 2.7, 2.65]} color="#e6e0d6" />
      <Glass position={[-3.25, 1.45, 4.02]} size={[2.4, 1.6, 0.07]} />
      <Glass position={[3.25, 1.45, 4.02]} size={[2.1, 1.6, 0.07]} />
      {roomDefinitions.map((room) => <RoomZone key={room.id} room={room} selected={selectedRoomId === room.id} onSelect={onSelectRoom} />)}
    </group>
  );
}

function HomeMep({ selectedSystem, onSelectSystem }: { selectedSystem: SystemKey; onSelectSystem: (key: SystemKey) => void }) {
  const dimOthers = (key: SystemKey) => selectedSystem !== key ? 0.22 : 0.95;
  return (
    <group>
      <group onClick={(event) => { event.stopPropagation(); onSelectSystem("plumbing"); }}>
        <Line points={[[5.1, 0.15, -3.1], [5.1, 0.15, 0.2], [2.2, 0.15, 0.2], [2.2, 0.15, -0.7]]} color={palette.plumbing} lineWidth={selectedSystem === "plumbing" ? 4 : 2} transparent opacity={dimOthers("plumbing")} />
        <Line points={[[4.7, 0.22, -3.0], [4.7, 0.22, -0.4], [2.65, 0.22, -0.4]]} color="#6db3d0" lineWidth={selectedSystem === "plumbing" ? 3 : 1.5} transparent opacity={dimOthers("plumbing")} />
      </group>
      <group onClick={(event) => { event.stopPropagation(); onSelectSystem("electricity"); }}>
        <Line points={[[-5.5, 2.45, -3.6], [-5.5, 2.45, 3.4], [5.4, 2.45, 3.4], [5.4, 2.45, -3.6]]} color={palette.electricity} lineWidth={selectedSystem === "electricity" ? 4 : 1.6} transparent opacity={dimOthers("electricity")} />
        {[[-5.2, 0.65, 2.5], [-1.0, 0.65, 2.5], [2.1, 0.65, 2.8], [5.25, 0.65, 1.6], [-4.2, 0.65, -3.5], [1.2, 0.65, -3.5]].map((p, index) => (
          <Part key={index} id={`OUTLET-${index}`} position={p as Vec3} size={[0.12, 0.22, 0.05]} color={palette.electricity} opacity={dimOthers("electricity")} />
        ))}
      </group>
      <group onClick={(event) => { event.stopPropagation(); onSelectSystem("air"); }}>
        <Line points={[[0, 2.34, -3.6], [0, 2.34, 2.8], [-3.3, 2.34, 2.8]]} color={palette.air} lineWidth={selectedSystem === "air" ? 4 : 1.8} transparent opacity={dimOthers("air")} />
        <Line points={[[0, 2.34, 0.4], [3.55, 2.34, 0.4]]} color={palette.air} lineWidth={selectedSystem === "air" ? 4 : 1.8} transparent opacity={dimOthers("air")} />
        <Part id="AC-LIVING" position={[-5.95, 2.1, 1.4]} size={[0.18, 0.48, 1.5]} color="#e7ecea" opacity={dimOthers("air")} />
        <Part id="AC-MASTER" position={[-3.4, 2.1, -3.92]} size={[1.45, 0.46, 0.16]} color="#e7ecea" opacity={dimOthers("air")} />
      </group>
    </group>
  );
}

function MaintenanceMarker({ position, title, status, onClick }: { position: Vec3; title: string; status: "open" | "planned"; onClick: () => void }) {
  return (
    <Html position={position} center distanceFactor={8.5} zIndexRange={[20, 0]}>
      <button type="button" className={`twin3d-maintenance-marker ${status}`} onClick={(event) => { event.stopPropagation(); onClick(); }}>
        <Wrench size={13} />
        <span>{title}</span>
      </button>
    </Html>
  );
}

function HomeScene({
  selectedRoomId,
  onSelectRoom,
  selectedSystem,
  onSelectSystem,
  layers,
}: {
  selectedRoomId: RoomId;
  onSelectRoom: (room: RoomId) => void;
  selectedSystem: SystemKey;
  onSelectSystem: (key: SystemKey) => void;
  layers: Record<LayerName, boolean>;
}) {
  return (
    <>
      <SceneLights />
      {layers.shell && <HomeShell selectedRoomId={selectedRoomId} onSelectRoom={onSelectRoom} />}
      {layers.furniture && (
        <group>
          <SofaSet onSelectRoom={onSelectRoom} />
          <KitchenFitout onSelectRoom={onSelectRoom} onSelectSystem={onSelectSystem} selectedSystem={selectedSystem} />
          <Bed room="master" position={[-3.55, 0, -2.4]} onSelectRoom={onSelectRoom} />
          <Bed room="bedroom" position={[0.7, 0, -2.4]} onSelectRoom={onSelectRoom} />
          <BathroomFitout onSelectRoom={onSelectRoom} onSelectSystem={onSelectSystem} selectedSystem={selectedSystem} />
        </group>
      )}
      {layers.mep && <HomeMep selectedSystem={selectedSystem} onSelectSystem={onSelectSystem} />}
      {layers.rooms && (
        <>
          <MaintenanceMarker position={[2.3, 1.75, -0.4]} title="بلاغ تسرب · المطبخ" status="open" onClick={() => { onSelectRoom("kitchen"); onSelectSystem("plumbing"); }} />
          <MaintenanceMarker position={[-3.4, 2.8, -3.65]} title="فحص تكييف · مجدول" status="planned" onClick={() => { onSelectRoom("master"); onSelectSystem("air"); }} />
        </>
      )}
      <Grid position={[0, -0.24, 0]} args={[28, 28]} cellSize={0.5} cellThickness={0.42} cellColor="#b8c7c2" sectionSize={2} sectionThickness={0.75} sectionColor="#8ea79f" fadeDistance={23} fadeStrength={1.1} infiniteGrid />
      <ContactShadows position={[0, -0.21, 0]} opacity={0.34} scale={25} blur={2.2} far={12} />
    </>
  );
}

const layerMeta: Array<{ key: LayerName; label: string; icon: typeof Box }> = [
  { key: "shell", label: "الهيكل", icon: Building2 },
  { key: "rooms", label: "المساحات", icon: Grid3X3 },
  { key: "furniture", label: "التجهيزات", icon: Sofa },
  { key: "mep", label: "الخدمات", icon: Zap },
];

const roomLabel: Record<RoomId, string> = {
  living: "المجلس والمعيشة",
  kitchen: "المطبخ",
  master: "غرفة النوم الرئيسية",
  bedroom: "غرفة النوم",
  bath: "دورة المياه",
};

const systemMeta: Record<SystemKey, { label: string; icon: typeof Zap }> = {
  electricity: { label: "الكهرباء", icon: Zap },
  plumbing: { label: "السباكة", icon: Droplets },
  air: { label: "التكييف", icon: Wind },
  finish: { label: "التشطيبات", icon: Paintbrush },
  doors: { label: "الأبواب والنوافذ", icon: DoorOpen },
  facilities: { label: "المرافق", icon: Home },
};

export function ResidentialTwin3D({
  mode,
  selectedFloorKey = "second",
  onSelectFloor = () => undefined,
  selectedRoomId = "kitchen",
  onSelectRoom = () => undefined,
  selectedSystemKey = "plumbing",
  onSelectSystem = () => undefined,
  compact = false,
}: ResidentialTwin3DProps) {
  const [preset, setPreset] = useState<ViewPreset>("iso");
  const [focusNonce, setFocusNonce] = useState(0);
  const [exploded, setExploded] = useState(false);
  const [layers, setLayers] = useState<Record<LayerName, boolean>>({ shell: true, rooms: true, furniture: true, mep: true });
  const controlsRef = useRef<any>(null);

  const focusTarget = mode === "construction"
    ? constructionTargets[selectedFloorKey]
    : homeRoomTargets[selectedRoomId];

  const selectedFloor = constructionFloors.find((floor) => floor.key === selectedFloorKey);
  const SystemIcon = systemMeta[selectedSystemKey].icon;

  const toggleLayer = (layer: LayerName) => setLayers((current) => ({ ...current, [layer]: !current[layer] }));

  return (
    <section className={`twin3d-viewer ${compact ? "compact" : ""}`} aria-label={mode === "construction" ? "مجسم ثلاثي الأبعاد تفاعلي لمتابعة البناء" : "مجسم ثلاثي الأبعاد تفاعلي للوحدة السكنية"}>
      <header className="twin3d-commandbar">
        <div className="twin3d-commandbar-title">
          <span className="twin3d-live-dot" />
          <div>
            <small>{mode === "construction" ? "DIGITAL TWIN · CONSTRUCTION" : "DIGITAL TWIN · HOME"}</small>
            <strong>{mode === "construction" ? "المسكن أثناء البناء" : "الوحدة بعد الاستلام"}</strong>
          </div>
        </div>

        <div className="twin3d-view-presets" aria-label="زوايا العرض">
          <button className={preset === "iso" ? "active" : ""} onClick={() => setPreset("iso")} title="منظور"><Maximize2 size={15} /><span>منظور</span></button>
          <button className={preset === "top" ? "active" : ""} onClick={() => setPreset("top")} title="علوي"><Grid3X3 size={15} /><span>علوي</span></button>
          <button className={preset === "front" ? "active" : ""} onClick={() => setPreset("front")} title="أمامي"><Box size={15} /><span>أمامي</span></button>
          <button className={preset === "walk" ? "active" : ""} onClick={() => setPreset("walk")} title="قريب"><Home size={15} /><span>قريب</span></button>
        </div>

        <div className="twin3d-command-actions">
          <button onClick={() => setFocusNonce((value) => value + 1)} title="تركيز على العنصر المحدد"><Focus size={16} /><span>تركيز</span></button>
          {mode === "construction" && <button className={exploded ? "active" : ""} onClick={() => setExploded((value) => !value)} title="فصل طبقات المبنى"><Layers3 size={16} /><span>تفكيك</span></button>}
          <button onClick={() => { setPreset("iso"); setExploded(false); setFocusNonce((value) => value + 1); }} title="إعادة ضبط العرض"><RotateCcw size={16} /><span>إعادة</span></button>
        </div>
      </header>

      <div className="twin3d-canvas-wrap">
        <Canvas
          shadows
          dpr={[1, 1.65]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          camera={{ position: presetTargets[mode].iso.camera, fov: mode === "construction" ? 34 : 36, near: 0.1, far: 120 }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 0.98;
            gl.outputColorSpace = THREE.SRGBColorSpace;
          }}
        >
          <color attach="background" args={["#edf2f0"]} />
          <fog attach="fog" args={["#edf2f0", 24, 52]} />
          <CameraRig mode={mode} preset={preset} focusTarget={focusTarget} focusNonce={focusNonce} controlsRef={controlsRef} />
          {mode === "construction" ? (
            <ConstructionScene selectedFloorKey={selectedFloorKey} onSelectFloor={(key) => { onSelectFloor(key); setFocusNonce((value) => value + 1); }} exploded={exploded} layers={layers} />
          ) : (
            <HomeScene selectedRoomId={selectedRoomId} onSelectRoom={(room) => { onSelectRoom(room); setFocusNonce((value) => value + 1); }} selectedSystem={selectedSystemKey} onSelectSystem={onSelectSystem} layers={layers} />
          )}
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping
            dampingFactor={0.08}
            minDistance={5.5}
            maxDistance={mode === "construction" ? 32 : 25}
            minPolarAngle={0.15}
            maxPolarAngle={Math.PI / 2.08}
            enablePan
            screenSpacePanning
          />
        </Canvas>

        <div className="twin3d-hud twin3d-hud-status">
          {mode === "construction" ? (
            <>
              <Construction size={15} />
              <span>{selectedFloor?.name ?? "الدور"}</span>
              <strong>{selectedFloor?.progress ?? 0}%</strong>
            </>
          ) : (
            <>
              <SystemIcon size={15} />
              <span>{roomLabel[selectedRoomId]}</span>
              <strong>{systemMeta[selectedSystemKey].label}</strong>
            </>
          )}
        </div>

        <div className="twin3d-hud twin3d-hud-help">
          <span>اسحب للدوران</span><i />
          <span>قرّب بإصبعين</span><i />
          <span>اضغط على العنصر</span>
        </div>
      </div>

      <footer className="twin3d-layerbar">
        <div className="twin3d-layerbar-label"><Layers3 size={16} /><span>طبقات العرض</span></div>
        <div className="twin3d-layer-buttons">
          {layerMeta.map(({ key, label, icon: Icon }) => (
            <button key={key} className={layers[key] ? "active" : ""} onClick={() => toggleLayer(key)} aria-pressed={layers[key]}>
              {layers[key] ? <Eye size={14} /> : <EyeOff size={14} />}
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="twin3d-quality"><CheckCircle2 size={14} /><span>WebGL · تفاعل مباشر</span></div>
      </footer>
    </section>
  );
}
