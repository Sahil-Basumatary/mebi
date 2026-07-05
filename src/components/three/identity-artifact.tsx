"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, ASCII } from "@react-three/postprocessing";
import { MathUtils, type Group } from "three";

export type ArtifactSignal = {
  skills: number;
  interests: number;
  activeProjects: number;
  completedProjects: number;
};

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// The knot is a deterministic function of the profile, so the same signal
// always renders the same artifact and growth visibly reshapes it.
function knotParams(signal: ArtifactSignal) {
  const p = 2 + (signal.skills % 3);
  let q = 3 + (signal.interests % 4);
  if (gcd(p, q) > 1) q += 1;
  return {
    p,
    q,
    tube: 0.26 + Math.min(signal.completedProjects, 6) * 0.03,
    speed: signal.activeProjects > 0 ? 0.34 : 0.16,
  };
}

function Artifact({ signal, animate }: { signal: ArtifactSignal; animate: boolean }) {
  const group = useRef<Group>(null);
  const { p, q, tube, speed } = knotParams(signal);
  useFrame(({ clock, pointer }) => {
    const holder = group.current;
    if (!holder) return;
    const t = animate ? clock.getElapsedTime() : 0;
    holder.rotation.y = t * speed + (animate ? pointer.x * 0.4 : 0);
    holder.rotation.x = MathUtils.lerp(holder.rotation.x, 0.35 + (animate ? pointer.y * -0.25 : 0), 0.05);
  });
  return (
    <group ref={group}>
      <mesh>
        <torusKnotGeometry args={[1.05, tube, 220, 24, p, q]} />
        <meshStandardMaterial color="#ffffff" roughness={0.35} />
      </mesh>
    </group>
  );
}

type IdentityArtifactProps = {
  signal: ArtifactSignal;
  className?: string;
};

export function IdentityArtifact({ signal, className }: IdentityArtifactProps) {
  const [ready, setReady] = useState(false);
  const [animate, setAnimate] = useState(true);
  useEffect(() => {
    // Canvas is browser-only; mounting late also lets us respect the visitor's
    // motion preference before the loop starts.
    setReady(true);
    setAnimate(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return (
    <div
      className={className}
      role="img"
      aria-label="Generative ASCII artifact rendered from your live profile signal"
    >
      {ready ? (
        <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 4.2], fov: 42 }} gl={{ antialias: true }}>
          <color attach="background" args={["#000000"]} />
          <ambientLight intensity={0.55} />
          <directionalLight position={[4, 6, 5]} intensity={1.4} />
          <Artifact signal={signal} animate={animate} />
          <EffectComposer>
            {/* Drawn with the letters of "mebi" ordered into the density ramp. */}
            <ASCII characters=" .:ibem*#%@" fontSize={46} cellSize={9} color="#e8e8e8" invert={false} />
          </EffectComposer>
        </Canvas>
      ) : null}
    </div>
  );
}
