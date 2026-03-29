import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 480;
const RADIUS_START = 19.5;
const RADIUS_END = 23;
const HEIGHT_VARIATION = 0.2;

const Audience = () => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const headsRef = useRef<THREE.InstancedMesh>(null);

    // Pre-calculate positions and base colors
    const { positions, colors, phases, heights } = useMemo(() => {
        const pos = [];
        const cols = [];
        const phs = [];
        const hts = [];

        const layers = 4;
        const perLayer = COUNT / layers;

        for (let i = 0; i < COUNT; i++) {
            const layer = Math.floor(i / perLayer);
            const angle = ((i % perLayer) / perLayer) * Math.PI * 2;
            const radius = RADIUS_START + layer * (RADIUS_END - RADIUS_START) / layers;

            // Add slight randomness to position
            const r = radius + (Math.random() - 0.5) * 0.5;
            const a = angle + (Math.random() - 0.5) * 0.05;

            const x = Math.cos(a) * r;
            const z = Math.sin(a) * r;
            const y = layer * 0.4; // Tiered seating effect

            pos.push(new THREE.Vector3(x, y, z));
            phs.push(Math.random() * Math.PI * 2);
            hts.push(0.7 + Math.random() * HEIGHT_VARIATION);

            // Random skin and cloth colors
            const clothColor = new THREE.Color().setHSL(Math.random(), 0.5, 0.5);
            cols.push(clothColor);
        }
        return { positions: pos, colors: cols, phases: phs, heights: hts };
    }, []);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state) => {
        if (!meshRef.current || !headsRef.current) return;

        const time = state.clock.elapsedTime;

        for (let i = 0; i < COUNT; i++) {
            const pos = positions[i];
            const phase = phases[i];
            const height = heights[i];

            // Bobbing animation
            const bob = Math.sin(time * 3 + phase) * 0.1;

            // Update Body
            dummy.position.set(pos.x, pos.y + bob + height / 2, pos.z);
            dummy.scale.set(0.2, height, 0.2);
            dummy.lookAt(0, pos.y, 0); // Face center
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
            meshRef.current.setColorAt(i, colors[i]);

            // Update Head
            dummy.position.set(pos.x, pos.y + bob + height + 0.1, pos.z);
            dummy.scale.set(0.15, 0.15, 0.15);
            dummy.updateMatrix();
            headsRef.current.setMatrixAt(i, dummy.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
        headsRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    return (
        <group>
            {/* Tiered Stands */}
            {Array.from({ length: 4 }).map((_, i) => (
                <mesh key={`stand-${i}`} position={[0, i * 0.4 - 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <ringGeometry args={[RADIUS_START + i * 0.85 - 0.2, RADIUS_START + (i + 1) * 0.85 + 0.2, 64]} />
                    <meshStandardMaterial color="#4a3728" roughness={1} />
                </mesh>
            ))}

            {/* Bodies */}
            <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} castShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial roughness={0.7} />
            </instancedMesh>

            {/* Heads */}
            <instancedMesh ref={headsRef} args={[undefined, undefined, COUNT]} castShadow>
                <sphereGeometry args={[1, 16, 16]} />
                <meshStandardMaterial color="#ffdbac" roughness={0.5} />
            </instancedMesh>
        </group>
    );
};

export default Audience;
