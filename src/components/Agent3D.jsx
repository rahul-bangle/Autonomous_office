import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';

const Agent3D = ({ 
  position = [0, 0, 0], 
  color = "#3b82f6", 
  name = "Agent", 
  emoji = "🤖",
  isMoving = false,
  status = "idle"
}) => {
  const group = useRef();
  const bodyGroup = useRef();
  
  // Voxel segments
  const headSize = 0.35;
  const torsoSize = [0.5, 0.6, 0.3];
  const limbSize = [0.12, 0.4, 0.12];

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (isMoving) {
      // "Walk" animation: Bounce and slight tilt
      group.current.position.y = Math.abs(Math.sin(time * 10)) * 0.15;
      bodyGroup.current.rotation.z = Math.sin(time * 10) * 0.05;
      bodyGroup.current.rotation.x = Math.sin(time * 5) * 0.02;
    } else if (status === 'chatting') {
      // "Chatting" animation: Subtle scale pulse and head nod
      group.current.position.y = Math.sin(time * 4) * 0.05;
      bodyGroup.current.rotation.y = Math.sin(time * 2) * 0.1;
    } else {
      // Idle "breathing"
      group.current.position.y = Math.sin(time * 2) * 0.02;
    }
  });

  return (
    <group ref={group} position={position}>
      {/* Name & Emoji Tag */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <Text
          position={[0, 1.8, 0]}
          fontSize={0.2}
          color="white"
          font="https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8zhpgw95f62nz9S_X3k_V.woff"
          anchorX="center"
          anchorY="middle"
        >
          {`${emoji} ${name}`}
        </Text>
      </Float>

      <group ref={bodyGroup}>
        {/* Head */}
        <mesh position={[0, 1.3, 0]} castShadow>
          <boxGeometry args={[headSize, headSize, headSize]} />
          <meshStandardMaterial color="#fde8c8" />
        </mesh>

        {/* Torso (Shirt) */}
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={torsoSize} />
          <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
        </mesh>

        {/* Arms */}
        <mesh position={[-0.35, 0.9, 0]} castShadow>
          <boxGeometry args={limbSize} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0.35, 0.9, 0]} castShadow>
          <boxGeometry args={limbSize} />
          <meshStandardMaterial color={color} />
        </mesh>

        {/* Legs (Pants) */}
        <mesh position={[-0.15, 0.3, 0]} castShadow>
          <boxGeometry args={[0.18, 0.6, 0.18]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[0.15, 0.3, 0]} castShadow>
          <boxGeometry args={[0.18, 0.6, 0.18]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>

      {/* Shadow Blob */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
        <planeGeometry args={[0.8, 0.8]} />
        <meshBasicMaterial color="black" transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

export default Agent3D;
