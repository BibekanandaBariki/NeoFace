import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const DataPoint = ({ position, color, size = 0.3 }) => {
  return (
    <Sphere position={position} args={[size, 16, 16]}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </Sphere>
  );
};

const DataLine = ({ start, end, color }) => {
  const points = useMemo(() => [start, end].map(p => new THREE.Vector3(...p)), [start, end]);
  
  return (
    <Line
      points={points}
      color={color}
      lineWidth={2}
      transparent
      opacity={0.6}
    />
  );
};

const AttendanceGlobe = ({ data }) => {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.elapsedTime * 0.2;
    }
  });

  // Generate 3D positions for attendance data
  const dataPoints = useMemo(() => {
    if (!data || !data.subjects) return [];
    
    return data.subjects.map((subject, index) => {
      const angle = (index / data.subjects.length) * Math.PI * 2;
      const radius = 3 + (subject.attendance || 0) / 100;
      const height = (subject.attendance || 0) / 50;
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = height;
      
      // Color based on attendance percentage
      const attendance = subject.attendance || 0;
      const color = attendance >= 75 ? '#4ade80' : attendance >= 50 ? '#fbbf24' : '#f87171';
      
      return {
        position: [x, y, z],
        color,
        attendance,
        name: subject.subjectName || 'Subject'
      };
    });
  }, [data]);

  return (
    <group ref={meshRef}>
      {dataPoints.map((point, index) => (
        <DataPoint
          key={index}
          position={point.position}
          color={point.color}
          size={0.4}
        />
      ))}
      
      {/* Connect points to center */}
      {dataPoints.map((point, index) => (
        <DataLine
          key={`line-${index}`}
          start={[0, 0, 0]}
          end={point.position}
          color={point.color}
        />
      ))}
    </group>
  );
};

const Analytics3D = ({ data }) => {
  return (
    <div style={{ width: '100%', height: '500px', borderRadius: '15px', overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <pointLight position={[-10, -10, -10]} color="#667eea" />
        
        <AttendanceGlobe data={data} />
        
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={5}
          maxDistance={20}
        />
      </Canvas>
    </div>
  );
};

export default Analytics3D;

