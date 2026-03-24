import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import Agent3D from './Agent3D';

// Coordinates mapping: 2D (px) -> 3D (units)
// Center of 900x540 canvas is [450, 270]
const map2Dto3D = (x2D, y2D) => {
  return [
    (x2D - 450) / 40, 
    0, 
    (y2D - 270) / 40
  ];
};

// Voxel Desk Component
const VoxelDesk = ({ position }) => {
  return (
    <group position={position}>
      {/* Table Top */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.1, 0.8]} />
        <meshStandardMaterial color="#8b5a2b" metalness={0.2} roughness={0.8} />
      </mesh>
      {/* Table Legs */}
      <mesh position={[-0.6, 0.35, -0.3]} castShadow>
        <boxGeometry args={[0.1, 0.7, 0.1]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.6, 0.35, -0.3]} castShadow>
        <boxGeometry args={[0.1, 0.7, 0.1]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[-0.6, 0.35, 0.3]} castShadow>
        <boxGeometry args={[0.1, 0.7, 0.1]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.6, 0.35, 0.3]} castShadow>
        <boxGeometry args={[0.1, 0.7, 0.1]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Monitor */}
      <mesh position={[0, 1, -0.2]} castShadow>
        <boxGeometry args={[0.6, 0.4, 0.05]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 0.8, -0.2]}>
        <boxGeometry args={[0.1, 0.2, 0.1]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
};

// Floor Grid Component
const InfiniteFloor = () => {
  return (
    <group position={[0, -0.01, 0]}>
      <Grid
        infiniteGrid
        fadeDistance={50}
        fadeStrength={5}
        cellSize={1}
        sectionSize={5}
        sectionColor="#2a2a2a"
        cellColor="#1a1a1a"
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#050505" />
      </mesh>
    </group>
  );
};

const OfficeCanvas3D = ({ agents = [], onMeeting = false }) => {
  return (
    <div style={{ width: '100%', height: '100%', background: '#000' }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[12, 12, 12]} fov={40} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2.1} 
        />
        
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
        <spotLight position={[-10, 15, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
        
        <Suspense fallback={null}>
          <Environment preset="city" />
          
          <InfiniteFloor />
          
          {/* Render Agents */}
          {agents.map((ag) => (
            <Agent3D 
              key={ag.id || ag.name}
              name={ag.name}
              color={ag.color}
              emoji={ag.status === 'chatting' ? '💬' : (ag.emoji || '👤')}
              position={map2Dto3D(ag.x || 450, ag.y || 270)}
              isMoving={ag.status === 'moving' || (Math.abs((ag.x||0)-(ag.tx||0)) > 5)}
              status={ag.status}
            />
          ))}

          {/* Initial Voxel Setup */}
          <VoxelDesk position={[-4, 0, -4]} />
          <VoxelDesk position={[4, 0, -4]} />
          <VoxelDesk position={[-4, 0, 4]} />
          <VoxelDesk position={[4, 0, 4]} />
          
          {/* Meeting Room Placeholder */}
          <group position={[0, 0, 0]}>
            <mesh receiveShadow position={[0, 1.25, 0]}>
              <boxGeometry args={[6, 2.5, 6]} />
              <meshStandardMaterial 
                color="#0066ff" 
                transparent 
                opacity={0.1} 
                metalness={0.5} 
                roughness={0.1} 
              />
            </mesh>
            {/* Round Table (Cylinder for Voxel look) */}
            <mesh position={[0, 0.7, 0]} castShadow>
              <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} />
              <meshStandardMaterial color="#8b5a2b" />
            </mesh>
          </group>

        </Suspense>

        <ContactShadows 
          position={[0, 0, 0]} 
          opacity={0.4} 
          scale={20} 
          blur={2.4} 
          far={10} 
        />
      </Canvas>
    </div>
  );
};

export default OfficeCanvas3D;
