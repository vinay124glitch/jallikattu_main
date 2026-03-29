const Arena = () => {
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <circleGeometry args={[20, 64]} />
        <meshStandardMaterial color="#c4a265" roughness={1} />
      </mesh>

      {/* Arena border - fence posts */}
      {Array.from({ length: 32 }).map((_, i) => {
        const angle = (i / 32) * Math.PI * 2;
        const x = Math.cos(angle) * 18;
        const z = Math.sin(angle) * 18;
        return (
          <group key={i}>
            <mesh position={[x, 0.75, z]} castShadow>
              <cylinderGeometry args={[0.08, 0.1, 1.5, 8]} />
              <meshStandardMaterial color="#6b4226" roughness={0.9} />
            </mesh>
          </group>
        );
      })}

      {/* Horizontal fence rails */}
      {Array.from({ length: 32 }).map((_, i) => {
        const angle = (i / 32) * Math.PI * 2;
        const nextAngle = ((i + 1) / 32) * Math.PI * 2;
        const x = (Math.cos(angle) + Math.cos(nextAngle)) * 9;
        const z = (Math.sin(angle) + Math.sin(nextAngle)) * 9;
        const rot = Math.atan2(
          Math.sin(nextAngle) - Math.sin(angle),
          Math.cos(nextAngle) - Math.cos(angle)
        );
        return (
          <mesh key={`rail-${i}`} position={[x, 0.5, z]} rotation={[0, -rot, 0]} castShadow>
            <boxGeometry args={[3.6, 0.06, 0.06]} />
            <meshStandardMaterial color="#8b5e3c" roughness={0.9} />
          </mesh>
        );
      })}

      {/* Dust particles - static decorative */}
      {Array.from({ length: 50 }).map((_, i) => {
        const x = (Math.random() - 0.5) * 30;
        const z = (Math.random() - 0.5) * 30;
        return (
          <mesh key={`dust-${i}`} position={[x, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.3 + Math.random() * 0.5, 8]} />
            <meshStandardMaterial
              color="#b89a5a"
              transparent
              opacity={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export default Arena;
