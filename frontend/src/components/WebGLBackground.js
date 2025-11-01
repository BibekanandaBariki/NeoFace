import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

const ParticleField = () => {
  const meshRef = useRef();

  useEffect(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];

    for (let i = 0; i < 5000; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      vertices.push(x, y, z);

      const color = new THREE.Color();
      color.setHSL(0.6 + Math.random() * 0.2, 0.8, 0.5 + Math.random() * 0.3);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    if (meshRef.current) {
      meshRef.current.geometry = geometry;
      meshRef.current.material = material;
    }
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.elapsedTime * 0.05;
      meshRef.current.rotation.y = clock.elapsedTime * 0.1;
    }
  });

  return <points ref={meshRef} />;
};

const WebGLBackground = ({ children }) => {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
      >
        <Stars radius={100} depth={50} count={5000} factor={4} fade speed={1} />
        <ParticleField />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default WebGLBackground;

