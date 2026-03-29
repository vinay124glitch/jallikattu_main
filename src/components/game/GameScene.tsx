import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import Bull from "./Bull";
import Human from "./Human";
import Arena from "./Arena";
import Audience from "./Audience";
import FollowCamera from "./FollowCamera";

interface HumanData {
  id: number;
  position: [number, number, number];
  attached: boolean;
  color: string;
  rotation: number;
  actionName?: string | null;
  actionId?: number;
  isInvulnerable?: boolean;
}

interface GameSceneProps {
  bullPosition: [number, number, number];
  bullRotation: number;
  isShaking: boolean;
  humans: HumanData[];
  gameState: "menu" | "playing" | "gameover";
  isCharging: boolean;
  bullSpeed: number;
  actionName?: string | null;
  actionId?: number;
  cameraShake?: number;
  bullMood?: "calm" | "alert" | "aggressive" | "furious";
  bullState?: string;
  isDying?: boolean;
}

const GameScene = ({
  bullPosition,
  bullRotation,
  isShaking,
  humans,
  gameState,
  isCharging,
  bullSpeed,
  actionName,
  actionId,
  cameraShake = 0,
  bullMood = "calm",
  bullState = "IDLE",
  isDying = false
}: GameSceneProps) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 15, 15], fov: 50, near: 0.1, far: 100 }}
      style={{ background: "linear-gradient(180deg, hsl(30, 20%, 25%) 0%, hsl(30, 15%, 12%) 100%)" }}
    >
      <ambientLight intensity={0.4} color="#ffe0b0" />
      <directionalLight
        position={[10, 15, 5]}
        intensity={1.2}
        color="#ffd090"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[-8, 8, -8]} intensity={0.3} color="#ff8040" />

      <fog attach="fog" args={["hsl(30, 15%, 12%)", 25, 45]} />

      <FollowCamera
        target={humans.length > 0 ? humans[0].position : [0, 0, 0]}
        rotation={humans.length > 0 ? humans[0].rotation : 0}
        isPlaying={gameState === "playing"}
        cameraShake={cameraShake}
        isDying={isDying}
      />

      <Suspense fallback={null}>
        <Arena />
        <Audience />
        {gameState !== "menu" && (
          <>
            <Bull
              position={bullPosition}
              rotation={bullRotation}
              isShaking={isShaking}
              isCharging={isCharging}
              speed={bullSpeed}
              actionName={actionName}
              actionId={actionId}
              bullState={bullState}
            />
            {humans.map((human) => (
              <Human
                key={human.id}
                position={human.position}
                rotation={human.rotation}
                attached={human.attached}
                color={human.color}
                // @ts-ignore
                actionName={human.actionName}
                // @ts-ignore
                actionId={human.actionId}
                isInvulnerable={human.isInvulnerable}
              />
            ))}
          </>
        )}
      </Suspense>
    </Canvas>
  );
};

export default GameScene;
