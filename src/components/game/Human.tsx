import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useFBX, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { useGameSounds } from "../../hooks/useGameSounds";

interface HumanProps {
  position: [number, number, number];
  rotation: number;
  attached: boolean;
  color: string;
  actionName?: string | null;
  actionId?: number;
  isInvulnerable?: boolean;
}

const Human = ({ position, rotation, attached, color, actionName, actionId = 0, isInvulnerable = false }: HumanProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const { playHumanScream, playHumanStep, playHumanGrunt } = useGameSounds();
  const stepTimer = useRef(0);
  const lastAttached = useRef(attached);
  const lastGruntTime = useRef(0);

  // Sound triggers
  useEffect(() => {
    if (attached && !lastAttached.current) {
      playHumanScream();
    }
    lastAttached.current = attached;
  }, [attached, playHumanScream]);

  // Load models once (cached)
  const idleFbx = useFBX("/models/Idle.fbx") as any;
  const runningFbx = useFBX("/models/Running.fbx") as any;
  const joggingFbx = useFBX("/models/Jogging.fbx") as any;
  const dyingFbx = useFBX("/models/Dying.fbx") as any;
  const entryFbx = useFBX("/models/Entry.fbx") as any;
  const defeatedFbx = useFBX("/models/Defeated.fbx") as any;
  const fallingFbx = useFBX("/models/Falling.fbx") as any;
  const flyingKickFbx = useFBX("/models/Flying Kick.fbx") as any;
  const kneePunchFbx = useFBX("/models/Flying Knee Punch Combo.fbx") as any;
  const hurricaneKickFbx = useFBX("/models/Hurricane Kick.fbx") as any;
  const slashFbx = useFBX("/models/Stable Sword Inward Slash.fbx") as any;
  const dancingTwerkFbx = useFBX("/models/Dancing Twerk.fbx") as any;
  const sillyDancingFbx = useFBX("/models/Silly Dancing.fbx") as any;


  // Use SkeletonUtils to clone to ensure unique skeleton/skinning
  const model = useMemo(() => SkeletonUtils.clone(idleFbx), [idleFbx]);

  // Create unique animation clips for this instance
  const animations = useMemo(() => {
    const clips = [
      idleFbx.animations[0].clone(),
      runningFbx.animations[0].clone(),
      joggingFbx.animations[0].clone(),
      dyingFbx.animations[0].clone(),
      entryFbx.animations[0].clone(),
      defeatedFbx.animations[0].clone(),
      fallingFbx.animations[0].clone(),
      flyingKickFbx.animations[0].clone(),
      kneePunchFbx.animations[0].clone(),
      hurricaneKickFbx.animations[0].clone(),
      slashFbx.animations[0].clone(),
      dancingTwerkFbx.animations[0].clone(),
      sillyDancingFbx.animations[0].clone()
    ];
    clips[0].name = "idle";
    clips[1].name = "running";
    clips[2].name = "jogging";
    clips[3].name = "dying";
    clips[4].name = "entry";
    clips[5].name = "defeated";
    clips[6].name = "falling";
    clips[7].name = "flying kick";
    clips[8].name = "knee punch";
    clips[9].name = "hurricane kick";
    clips[10].name = "slash";
    clips[11].name = "dancing twerk";
    clips[12].name = "silly dancing";
    return clips;
  }, [idleFbx, runningFbx, joggingFbx, dyingFbx, entryFbx, defeatedFbx, fallingFbx, flyingKickFbx, kneePunchFbx, hurricaneKickFbx, slashFbx, dancingTwerkFbx, sillyDancingFbx]);

  const { actions, mixer } = useAnimations(animations, model as any);
  const currentAction = useRef<string>("entry");
  const prevPosition = useRef<[number, number, number]>(position);
  const isOneShotPlaying = useRef(false);
  const lastActionId = useRef<number>(actionId);

  // Apply color to character's clothes/body
  useEffect(() => {
    model.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          // Clone material to avoid affecting other humans
          child.material = child.material.clone();
          const name = child.material.name.toLowerCase();
          if (name.includes("body") || name.includes("shirt") || name.includes("clothes") || name.includes("mat")) {
            child.material.color.set(color);
          }
        }
      }
    });
  }, [model, color]);

  useEffect(() => {
    if (!actions) return;

    // Initial entry animation
    if (actions.entry) {
      actions.entry.setLoop(THREE.LoopOnce, 1);
      actions.entry.clampWhenFinished = true;
      actions.entry.play();

      const onFinish = (e: any) => {
        if (e.action.getClip().name === "entry") {
          currentAction.current = "idle";
        }
      };
      // We don't have direct access to mixer from useAnimations easily for events here
      // But we can approximate with a timeout if it's one-shot
      setTimeout(() => {
        if (currentAction.current === "entry") currentAction.current = "idle";
      }, 2000);
    }
  }, [actions]);

  // Handle custom one-shot actions triggered by user
  useEffect(() => {
    if (!actions || !actionName || actionId === lastActionId.current) return;

    lastActionId.current = actionId;
    isOneShotPlaying.current = true;

    const shot = actions[actionName.toLowerCase()];
    if (!shot) {
      isOneShotPlaying.current = false;
      return;
    }

    try {
      shot.reset();
      shot.setLoop(THREE.LoopOnce, 1);
      // @ts-ignore
      shot.clampWhenFinished = true;

      const prev = actions[currentAction.current];
      if (prev && prev !== shot) {
        prev.fadeOut(0.15);
      }

      shot.fadeIn(0.15).play();
      currentAction.current = actionName.toLowerCase();

      const handler = (e: any) => {
        if (e.action !== shot) return;
        mixer.removeEventListener("finished", handler);
        isOneShotPlaying.current = false;
      };

      mixer.addEventListener("finished", handler);
    } catch (e) {
      console.error("Action error:", e);
      isOneShotPlaying.current = false;
    }
  }, [actionName, actionId, actions, mixer]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Movement detection
    const distChange = Math.sqrt(
      Math.pow(position[0] - prevPosition.current[0], 2) +
      Math.pow(position[2] - prevPosition.current[2], 2)
    );
    const speed = distChange / delta;
    prevPosition.current = position;

    // Determine target animation
    let targetAction = "idle";
    if (attached) {
      targetAction = "dying";
    } else if (speed > 4.5) {
      targetAction = "running";
    } else if (speed > 0.1) {
      targetAction = "jogging";
    }

    // Don't interrupt entry or one-shot actions until they are finished
    if (currentAction.current !== "entry" && !isOneShotPlaying.current && currentAction.current !== targetAction) {
      const prev = actions[currentAction.current];
      const next = actions[targetAction];

      if (prev && next) {
        if (prev !== next) prev.fadeOut(0.2);
        next.reset().fadeIn(0.2).play();
        if (targetAction === "dying") {
          next.setLoop(THREE.LoopOnce, 1);
          next.clampWhenFinished = true;
        }
      }
      currentAction.current = targetAction;
    }

    // Update position/rotation
    meshRef.current.position.set(position[0], position[1], position[2]);
    meshRef.current.rotation.y = rotation; // Face movement direction

    // Sound logic
    if (speed > 0.1 && !attached) {
      stepTimer.current += delta * speed;
      if (stepTimer.current > 3.5) {
        playHumanStep();
        stepTimer.current = 0;
      }

      // Random grunt
      const now = Date.now();
      if (speed > 5 && now - lastGruntTime.current > 4000 && Math.random() < 0.005) {
        playHumanGrunt();
        lastGruntTime.current = now;
      }
    }
    
    // Flashing effect for invulnerability
    if (isInvulnerable) {
      const flash = Math.sin(Date.now() * 0.015) > 0;
      meshRef.current.visible = flash;
    } else {
      meshRef.current.visible = true;
    }
  });

  return (
    <group ref={meshRef}>
      <primitive object={model} scale={[0.016, 0.016, 0.016]} />
    </group>
  );
};

// Preload to avoid pop-in
useFBX.preload("/models/Idle.fbx");
useFBX.preload("/models/Running.fbx");
useFBX.preload("/models/Jogging.fbx");
useFBX.preload("/models/Dying.fbx");
useFBX.preload("/models/Entry.fbx");
useFBX.preload("/models/Defeated.fbx");
useFBX.preload("/models/Falling.fbx");
useFBX.preload("/models/Flying Kick.fbx");
useFBX.preload("/models/Flying Knee Punch Combo.fbx");
useFBX.preload("/models/Hurricane Kick.fbx");
useFBX.preload("/models/Stable Sword Inward Slash.fbx");
useFBX.preload("/models/Dancing Twerk.fbx");
useFBX.preload("/models/Silly Dancing.fbx");


export default Human;
