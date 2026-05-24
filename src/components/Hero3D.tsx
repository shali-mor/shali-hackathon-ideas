"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Edges, Environment } from "@react-three/drei";
import { Suspense, useRef } from "react";
import type { Group, Mesh } from "three";

function GeometricOrb() {
  const group = useRef<Group>(null);
  const inner = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.x = t * 0.14;
      group.current.rotation.y = t * 0.22;
    }
    if (inner.current) {
      inner.current.rotation.x = -t * 0.3;
      inner.current.rotation.y = -t * 0.18;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}>
      <group ref={group}>
        {/* outer wireframe shell */}
        <mesh>
          <icosahedronGeometry args={[1.4, 1]} />
          <meshBasicMaterial color="#818cf8" wireframe transparent opacity={0.45} />
        </mesh>
        {/* filled translucent body */}
        <mesh>
          <icosahedronGeometry args={[1.35, 1]} />
          <meshStandardMaterial
            color="#14141f"
            roughness={0.5}
            metalness={0.5}
            transparent
            opacity={0.6}
          />
          <Edges color="#a78bfa" lineWidth={1} threshold={1} />
        </mesh>
        {/* small inner core */}
        <mesh ref={inner}>
          <octahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial
            color="#c4b5fd"
            emissive="#a78bfa"
            emissiveIntensity={0.9}
            toneMapped={false}
          />
        </mesh>
      </group>
    </Float>
  );
}

function OrbitDot({ radius, speed, color, size = 0.06, offset = 0, tilt = 0 }: {
  radius: number;
  speed: number;
  color: string;
  size?: number;
  offset?: number;
  tilt?: number;
}) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() * speed + offset;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.z = Math.sin(t) * radius;
    ref.current.position.y = Math.sin(t * 0.7) * tilt;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2}
        toneMapped={false}
      />
    </mesh>
  );
}

export function Hero3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 4, 5]} intensity={0.8} color="#a78bfa" />
        <directionalLight position={[-5, -3, -2]} intensity={0.5} color="#818cf8" />

        <GeometricOrb />

        <OrbitDot radius={2.2} speed={0.5} color="#818cf8" offset={0} tilt={0.4} />
        <OrbitDot radius={2.4} speed={0.35} color="#a78bfa" offset={2} tilt={-0.5} size={0.08} />
        <OrbitDot radius={2.6} speed={0.6} color="#f0abfc" offset={4} tilt={0.7} size={0.05} />

        <Environment preset="night" />
      </Suspense>
    </Canvas>
  );
}
