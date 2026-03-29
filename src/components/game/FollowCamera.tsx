import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface FollowCameraProps {
  target: [number, number, number];
  rotation: number;
  isPlaying: boolean;
  cameraShake?: number;
  isDying?: boolean;
}

const FollowCamera = ({ target, rotation, isPlaying, cameraShake = 0, isDying = false }: FollowCameraProps) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const smoothTarget = useRef(new THREE.Vector3(0, 0, 0));

  // Menu orbit
  useFrame((_, delta) => {
    if (isDying) {
      // Zoom in dynamically on death
      const zoomFactor = 0.4; // Multiplier for camera distance
      camera.position.lerp(new THREE.Vector3(target[0], target[1] + 2.5, target[2]).add(new THREE.Vector3(0, 2, 4)), delta * 3);
      camera.lookAt(target[0], target[1] + 1, target[2]);
      if (controlsRef.current) controlsRef.current.enabled = false;
      return;
    }

    if (!isPlaying) {
      const t = Date.now() * 0.0003;
      camera.position.set(Math.sin(t) * 20, 14, Math.cos(t) * 20);
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) controlsRef.current.enabled = false;
      return;
    }

    if (controlsRef.current) {
      controlsRef.current.enabled = true;
      // Smoothly move the orbit target to follow the human
      const targetVec = new THREE.Vector3(target[0], target[1] + 1, target[2]);
      smoothTarget.current.lerp(targetVec, delta * 5);
      controlsRef.current.target.copy(smoothTarget.current);
    }

    // Camera shake
    if (cameraShake && cameraShake > 0) {
      camera.position.x += (Math.random() - 0.5) * cameraShake * 1.5;
      camera.position.y += (Math.random() - 0.5) * cameraShake * 1.5;
      camera.position.z += (Math.random() - 0.5) * cameraShake * 1.5;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      enableRotate={true}
      minDistance={5}
      maxDistance={30}
      minPolarAngle={0.3}
      maxPolarAngle={Math.PI / 2.2}
      zoomSpeed={0.8}
      rotateSpeed={0.6}
    />
  );
};

export default FollowCamera;
