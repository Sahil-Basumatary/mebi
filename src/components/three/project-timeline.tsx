"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, useCursor } from "@react-three/drei";
import { animated, useSprings } from "@react-spring/three";
import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  MathUtils,
  Vector3,
  type Group,
  type MeshStandardMaterial,
} from "three";

export type TimelineProject = {
  id: string;
  name: string;
  status: "ACTIVE" | "COMPLETED";
  progress: number;
};

type TimelineNode = {
  id: string;
  x: number;
  y: number;
  radius: number;
  kind: "origin" | "active" | "completed";
  name: string;
  detail: string;
  progress: number | null;
};

const SPACING = 1.3;
const FADE_LENGTH = 1.5;
// Positive camera offset pushes the chain toward the left edge of the card,
// leaving the top-right corner free for the pinned detail panel.
const CHAIN_SHIFT = 1.0;
const ORIGIN_BASE = new Color("#c4c4c4");
const ORIGIN_HOVER = new Color("#8f8f8f");
const EDGE_BASE = new Color("#c9c9c9");
const EDGE_ACTIVE = new Color("#111111");
const WHITE = new Color("#ffffff");

function buildNodes(projects: TimelineProject[]): TimelineNode[] {
  return [
    {
      id: "origin",
      x: 0,
      y: 0,
      radius: 0.15,
      kind: "origin",
      name: projects.length ? "Where your pipeline started" : "No projects yet",
      detail: projects.length
        ? `${projects.length} project${projects.length === 1 ? "" : "s"} grown from here`
        : "Brief your first project to grow the chain",
      progress: null,
    },
    ...projects.map((project, index) => ({
      id: project.id,
      x: ((index % 3) - 1) * 0.14,
      y: -(index + 1) * SPACING,
      radius: 0.16 + (Math.min(project.progress, 100) / 100) * 0.05,
      kind: project.status === "COMPLETED" ? ("completed" as const) : ("active" as const),
      name: project.name,
      detail:
        project.status === "COMPLETED"
          ? "Completed · proof captured"
          : `Active · ${project.progress}% built`,
      progress: Math.min(project.progress, 100),
    })),
  ];
}

type SceneProps = {
  nodes: TimelineNode[];
  animate: boolean;
  glide: boolean;
  hovered: number | null;
  panelIndex: number;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onHover: (index: number | null) => void;
  focusRef: React.MutableRefObject<number>;
  dragDistanceRef: React.MutableRefObject<number>;
};

function Scene({
  nodes,
  animate,
  glide,
  hovered,
  panelIndex,
  panelRef,
  onHover,
  focusRef,
  dragDistanceRef,
}: SceneProps) {
  const router = useRouter();
  const nodeRefs = useRef<(Group | null)[]>([]);
  const matRefs = useRef<(MeshStandardMaterial | null)[]>([]);
  const screenPoint = useMemo(() => new Vector3(), []);
  useCursor(hovered !== null);
  const lineGeometry = useMemo(() => {
    // One segment per link plus the trailing line that dissolves into the
    // white background — the "future" the user hasn't briefed yet.
    const segments = nodes.length;
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(segments * 6), 3));
    geometry.setAttribute("color", new BufferAttribute(new Float32Array(segments * 6), 3));
    return geometry;
  }, [nodes]);
  const springs = useSprings(
    nodes.length,
    nodes.map((_, index) => ({
      from: { s: 0 },
      to: { s: 1 },
      delay: 200 + index * 110,
      immediate: !animate,
      config: { mass: 1, tension: 300, friction: 18 },
    })),
  );
  useFrame(({ clock, camera, size }) => {
    const t = animate ? clock.getElapsedTime() : 0;
    // Sideways sway keeps the vertical rhythm intact while still feeling alive.
    const sways = nodes.map((_, index) =>
      animate ? Math.sin(t * 1.15 + index * 0.9) * 0.04 : 0,
    );
    nodes.forEach((node, index) => {
      const holder = nodeRefs.current[index];
      if (!holder) return;
      const lift = hovered === index ? 0.14 : 0;
      holder.position.set(node.x + sways[index], node.y, lift);
      const material = matRefs.current[index];
      if (material && node.kind === "origin") {
        material.color.lerp(hovered === index ? ORIGIN_HOVER : ORIGIN_BASE, 0.15);
      }
    });
    const positions = lineGeometry.getAttribute("position") as BufferAttribute;
    const colors = lineGeometry.getAttribute("color") as BufferAttribute;
    for (let index = 0; index < nodes.length - 1; index += 1) {
      const from = nodes[index];
      const to = nodes[index + 1];
      positions.setXYZ(index * 2, from.x + sways[index], from.y, 0);
      positions.setXYZ(index * 2 + 1, to.x + sways[index + 1], to.y, 0);
      const active = hovered === index || hovered === index + 1;
      const shade = active ? EDGE_ACTIVE : EDGE_BASE;
      colors.setXYZ(index * 2, shade.r, shade.g, shade.b);
      colors.setXYZ(index * 2 + 1, shade.r, shade.g, shade.b);
    }
    const tail = nodes.length - 1;
    const last = nodes[tail];
    positions.setXYZ(tail * 2, last.x + sways[tail], last.y, 0);
    positions.setXYZ(tail * 2 + 1, last.x + sways[tail], last.y - FADE_LENGTH, 0);
    colors.setXYZ(tail * 2, EDGE_BASE.r, EDGE_BASE.g, EDGE_BASE.b);
    colors.setXYZ(tail * 2 + 1, WHITE.r, WHITE.g, WHITE.b);
    positions.needsUpdate = true;
    colors.needsUpdate = true;
    const lastY = nodes[nodes.length - 1].y;
    const focus = glide ? MathUtils.clamp(focusRef.current, lastY, 0) : lastY / 2;
    focusRef.current = focus;
    camera.position.y = MathUtils.lerp(camera.position.y, focus, 0.08);
    camera.lookAt(CHAIN_SHIFT, camera.position.y, 0);
    // Project the described node into screen space so the HTML panel rides at
    // exactly the same height, staying in sync while the camera glides.
    const panelEl = panelRef.current;
    if (panelEl) {
      const target = nodes[panelIndex];
      screenPoint.set(target.x, target.y, 0).project(camera);
      const pixelY = ((1 - screenPoint.y) / 2) * size.height;
      panelEl.style.top = `${MathUtils.clamp(pixelY, 56, size.height - 56)}px`;
    }
  });
  return (
    <group>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial vertexColors transparent opacity={0.95} />
      </lineSegments>
      {nodes.map((node, index) => (
        <animated.group
          key={node.id}
          ref={(ref: Group | null) => {
            nodeRefs.current[index] = ref;
          }}
          scale={springs[index].s}
        >
          <mesh
            onPointerOver={(event) => {
              event.stopPropagation();
              onHover(index);
            }}
            onPointerOut={() => {
              if (hovered === index) onHover(null);
            }}
            onClick={(event) => {
              event.stopPropagation();
              if (dragDistanceRef.current > 6) return;
              focusRef.current = node.y;
              if (node.kind !== "origin") router.push(`/projects/${node.id}`);
            }}
          >
            <sphereGeometry args={[node.radius, 32, 32]} />
            <meshStandardMaterial
              ref={(ref: MeshStandardMaterial | null) => {
                matRefs.current[index] = ref;
              }}
              color={node.kind === "origin" ? "#c4c4c4" : "#111111"}
              roughness={0.45}
            />
          </mesh>
          <mesh scale={1.14} raycast={() => null}>
            <sphereGeometry args={[node.radius, 32, 32]} />
            <meshBasicMaterial color="#111111" side={BackSide} />
          </mesh>
          {node.kind === "completed" ? (
            <mesh raycast={() => null}>
              <torusGeometry args={[node.radius + 0.1, 0.013, 12, 48]} />
              <meshBasicMaterial color="#111111" />
            </mesh>
          ) : null}
          {node.progress !== null ? (
            <Html
              position={[node.radius + 0.24, 0, 0]}
              center
              distanceFactor={5.5}
              zIndexRange={[30, 0]}
              style={{ pointerEvents: "none" }}
            >
              <span className="block translate-x-1/2 font-mono text-[11px] tracking-[0.08em] text-[#8f8f8f]">
                {node.progress}%
              </span>
            </Html>
          ) : null}
        </animated.group>
      ))}
    </group>
  );
}

type ProjectTimelineProps = {
  projects: TimelineProject[];
  className?: string;
};

export function ProjectTimeline({ projects, className }: ProjectTimelineProps) {
  const [ready, setReady] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [hovered, setHovered] = useState<number | null>(null);
  const nodes = useMemo(() => buildNodes(projects), [projects]);
  const [activeDot, setActiveDot] = useState(nodes.length - 1);
  const lastY = nodes[nodes.length - 1].y;
  // Camera glide only earns its keep once the chain outgrows the card.
  const glide = -lastY > 2.4;
  const focusRef = useRef(lastY);
  const dragRef = useRef<{ pointerY: number; focus: number; height: number } | null>(null);
  const dragDistanceRef = useRef(0);
  useEffect(() => {
    // Canvas is browser-only; mounting late also lets us respect the visitor's
    // motion preference before the loop starts.
    setReady(true);
    setAnimate(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  useEffect(() => {
    if (!glide) return;
    const interval = window.setInterval(() => {
      const nearest = MathUtils.clamp(
        Math.round(-focusRef.current / SPACING),
        0,
        nodes.length - 1,
      );
      setActiveDot((current) => (current === nearest ? current : nearest));
    }, 180);
    return () => window.clearInterval(interval);
  }, [glide, nodes.length]);
  const panelIndex = hovered !== null ? hovered : Math.min(activeDot, nodes.length - 1);
  const panelNode = nodes[panelIndex];
  const panelRef = useRef<HTMLDivElement | null>(null);
  return (
    <div
      className={className}
      style={{ touchAction: glide ? "pan-x" : undefined, cursor: glide ? "grab" : undefined }}
      onPointerDown={(event) => {
        if (!glide) return;
        dragDistanceRef.current = 0;
        dragRef.current = {
          pointerY: event.clientY,
          focus: focusRef.current,
          height: event.currentTarget.getBoundingClientRect().height,
        };
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag) return;
        const dy = event.clientY - drag.pointerY;
        dragDistanceRef.current = Math.max(dragDistanceRef.current, Math.abs(dy));
        focusRef.current = drag.focus + (dy / drag.height) * (-lastY + FADE_LENGTH);
      }}
      onPointerUp={() => {
        dragRef.current = null;
      }}
      onPointerLeave={() => {
        dragRef.current = null;
      }}
    >
      {ready ? (
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [CHAIN_SHIFT, lastY, 4.6], fov: 38, near: 0.1, far: 30 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={1.1} />
          <directionalLight position={[4, 8, 6]} intensity={0.8} />
          <Scene
            nodes={nodes}
            animate={animate}
            glide={glide}
            hovered={hovered}
            panelIndex={panelIndex}
            panelRef={panelRef}
            onHover={setHovered}
            focusRef={focusRef}
            dragDistanceRef={dragDistanceRef}
          />
        </Canvas>
      ) : null}
      <div
        ref={panelRef}
        className="pointer-events-none absolute right-0 w-44 -translate-y-1/2 text-right"
        style={{ top: "50%" }}
      >
        <div key={panelNode.id} className="panel-fade">
          <p className="text-[10px] font-semibold tracking-[0.22em] text-[#8f8f8f] uppercase">
            {panelNode.kind === "origin" ? "Origin" : panelNode.kind === "completed" ? "Completed" : "Active"}
          </p>
          <p className="mt-2 font-serif text-xl leading-snug font-light text-[#000000]">
            {panelNode.name}
          </p>
          <p className="mt-2 text-[12px] leading-5 text-[#555555]">{panelNode.detail}</p>
          {panelNode.progress !== null ? (
            <div className="mt-3">
              <div className="h-1 w-full bg-[#e4e4e4]">
                <div className="h-full bg-[#000000]" style={{ width: `${panelNode.progress}%` }} />
              </div>
              <p className="mt-2 font-mono text-[10px] tracking-[0.08em] text-[#8f8f8f]">
                Click node to open brief
              </p>
            </div>
          ) : null}
        </div>
      </div>
      {glide ? (
        <div className="pointer-events-auto absolute top-1/2 left-1 flex -translate-y-1/2 flex-col items-center gap-1.5">
          {nodes.map((node, index) => (
            <button
              key={node.id}
              type="button"
              aria-label={`Focus ${node.name}`}
              onClick={() => {
                focusRef.current = node.y;
              }}
              className={
                activeDot === index
                  ? "h-4 w-1.5 rounded-full bg-[#000000] transition-all"
                  : "h-1.5 w-1.5 rounded-full bg-[#c4c4c4] transition-all hover:bg-[#8f8f8f]"
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
