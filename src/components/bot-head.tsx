import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';
import { Environment } from '@react-three/drei';

function HeadModel({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  const meshRef = useRef<THREE.Group>(null);
  const [obj, setObj] = useState<THREE.Group | null>(null);
  const [error, setError] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  useEffect(() => {
    const loader = new OBJLoader();
    loader.load(
      '/head.obj',
      (loadedObj) => {
        const materials: THREE.MeshStandardMaterial[] = [];

        // Apply vertex colors material to all meshes (same as the original viewer)
        loadedObj.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const material = new THREE.MeshStandardMaterial({
              vertexColors: true,
              roughness: 0.8,
              opacity: 0, // Start invisible
              transparent: true,
            });
            mesh.material = material;
            materials.push(material);
          }
        });

        materialsRef.current = materials;

        // Center the model
        const box = new THREE.Box3().setFromObject(loadedObj);
        const center = box.getCenter(new THREE.Vector3());
        loadedObj.position.set(-center.x, -center.y, -center.z);

        setObj(loadedObj);

        // Trigger fade-in after model is set
        requestAnimationFrame(() => {
          setOpacity(1);
        });
      },
      undefined,
      (err) => {
        console.warn("Failed to load head.obj, falling back to sphere.", err);
        setError(true);
      }
    );
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Animate opacity fade-in
    materialsRef.current.forEach((material) => {
      if (material.opacity < opacity) {
        material.opacity = Math.min(material.opacity + 0.02, opacity); // Smooth fade
        if (material.opacity >= 1) {
          material.transparent = false; // Disable transparency once fully visible for performance
        }
      }
    });

    // Idle animation: Gentle bobbing
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.1;

    // Gaze tracking: Look at target
    const targetX = mouse.current[0] * 0.5;
    const targetY = mouse.current[1] * 0.5;

    // Smoothly interpolate rotation (slower factor for gradual movement)
    meshRef.current.rotation.y += (targetX - meshRef.current.rotation.y) * 0.03;
    meshRef.current.rotation.x += (-targetY - meshRef.current.rotation.x) * 0.05;
  });

  if (error) {
    return (
      <mesh ref={meshRef as React.Ref<THREE.Mesh>}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial color="#e4e4e7" roughness={0.3} metalness={0.8} />
      </mesh>
    );
  }

  if (!obj) return null;

  return (
    <primitive
      object={obj}
      ref={meshRef}
      scale={0.25}
    />
  );
}

// Default offset: looking slightly down and to the head's left
export const DEFAULT_GAZE: [number, number] = [-0.3, -0.25];

interface BotHeadProps {
  className?: string;
  style?: React.CSSProperties;
  gazeTarget?: [number, number];
}

export function BotHead({ className, style, gazeTarget }: BotHeadProps) {
  const gaze = useRef<[number, number]>(gazeTarget ?? DEFAULT_GAZE);

  // Update gaze ref when gazeTarget prop changes
  useEffect(() => {
    gaze.current = gazeTarget ?? DEFAULT_GAZE;
  }, [gazeTarget]);

  return (
    <div className={className} style={{ width: "100%", height: "100%", ...style }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50, near: 0.1, far: 1000 }} dpr={[1, 3]} gl={{ antialias: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={0.8} />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
        <HeadModel mouse={gaze} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}

