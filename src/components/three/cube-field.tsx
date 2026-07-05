"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges, useCursor } from "@react-three/drei";
import { Color, MathUtils, type Group, type Mesh, type MeshStandardMaterial } from "three";

const GRID_SIZE = 4;
const SPACING = 1.12;
// Mostly paper-whites with a single black accent cube, mirroring the site's
// monochrome editorial palette.
const SHADES = ["#ffffff", "#f4f4f4", "#e8e8e8", "#ffffff", "#f0f0f0", "#e4e4e4"];
const ACCENT_INDEX = 9;
const HOVER_COLOR = new Color("#111111");

type CubeSpec = {
  x: number;
  z: number;
  phase: number;
  shade: string;
  baseColor: Color;
};

const CUBES: CubeSpec[] = [];
for (let x = 0; x < GRID_SIZE; x += 1) {
  for (let z = 0; z < GRID_SIZE; z += 1) {
    const index = x * GRID_SIZE + z;
    const shade = index === ACCENT_INDEX ? "#111111" : SHADES[index % SHADES.length];
    CUBES.push({
      x: (x - (GRID_SIZE - 1) / 2) * SPACING,
      z: (z - (GRID_SIZE - 1) / 2) * SPACING,
      phase: (x + z) * 0.7,
      shade,
      baseColor: new Color(shade),
    });
  }
}

// How many cubes can be "staged" black at once before clicks are ignored.
const COMMIT_CAP = 4;

function CubeWave({ animate }: { animate: boolean }) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [committed, setCommitted] = useState<Set<number>>(new Set());
  useCursor(hovered !== null);
  useFrame(({ clock, pointer }) => {
    const field = group.current;
    if (!field) return;
    const t = animate ? clock.getElapsedTime() : 0;
    const scroll = animate ? window.scrollY : 0;
    field.children.forEach((cube, index) => {
      const wave = Math.sin(t * 1.1 + CUBES[index].phase) * 0.22;
      const lift = hovered === index ? 0.42 : committed.has(index) ? 0.18 : 0;
      cube.position.y = MathUtils.lerp(cube.position.y, wave + lift, 0.18);
      const isBlack = hovered === index || committed.has(index);
      const material = (cube as Mesh).material as MeshStandardMaterial;
      material.color.lerp(isBlack ? HOVER_COLOR : CUBES[index].baseColor, 0.16);
    });
    field.rotation.y = MathUtils.lerp(field.rotation.y, pointer.x * 0.12 + scroll * 0.0014, 0.06);
    field.rotation.x = MathUtils.lerp(field.rotation.x, pointer.y * -0.05, 0.04);
  });
  return (
    <group ref={group}>
      {CUBES.map((cube, index) => (
        <mesh
          key={index}
          position={[cube.x, 0, cube.z]}
          onPointerOver={(event) => {
            event.stopPropagation();
            setHovered(index);
          }}
          onPointerOut={() => setHovered((current) => (current === index ? null : current))}
          onClick={(event) => {
            event.stopPropagation();
            setCommitted((current) => {
              const next = new Set(current);
              if (next.has(index)) {
                next.delete(index);
              } else if (next.size < COMMIT_CAP) {
                next.add(index);
              }
              return next;
            });
          }}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={cube.shade} />
          <Edges color="#111111" threshold={15} />
        </mesh>
      ))}
    </group>
  );
}

type CubeFieldProps = {
  className?: string;
};

export function CubeField({ className }: CubeFieldProps) {
  const [ready, setReady] = useState(false);
  const [animate, setAnimate] = useState(true);
  useEffect(() => {
    // Canvas can only render in the browser, and mounting late also lets us
    // read the visitor's motion preference before the loop starts.
    setReady(true);
    setAnimate(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return (
    <div className={className} aria-hidden>
      {ready ? (
        <Canvas
          orthographic
          dpr={[1, 2]}
          camera={{ position: [8, 7, 8], zoom: 48, near: 0.1, far: 60 }}
          gl={{ antialias: true, alpha: true }}
          onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
        >
          <ambientLight intensity={1.15} />
          <directionalLight position={[6, 10, 4]} intensity={0.9} />
          <CubeWave animate={animate} />
        </Canvas>
      ) : null}
    </div>
  );
}
