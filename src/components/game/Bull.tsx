import { useRef, useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameSounds } from "../../hooks/useGameSounds";

interface BullProps {
  position: [number, number, number];
  rotation: number;
  isShaking: boolean;
  isCharging?: boolean;
  speed?: number;
  actionName?: string | null;
  actionId?: number;
  bullState?: string;
}

const Bull = ({ position, rotation, isShaking, isCharging = false, speed = 0, actionName = null, actionId = 0, bullState = "IDLE" }: BullProps) => {
  const { scene, animations } = useGLTF("/models/bull.glb");
  const { playStep, playBullRoar, playBullSnort } = useGameSounds();
  const groupRef = useRef<THREE.Group>(null);
  const shakeRef = useRef(0);

  const isOneShotPlaying = useRef(false);
  const lastChargeRef = useRef(false);
  const stepTimer = useRef(0);

  // Sound triggers
  useEffect(() => {
    if (isCharging && !lastChargeRef.current) {
      playBullRoar();
    }
    lastChargeRef.current = isCharging;
  }, [isCharging, playBullRoar]);

  useEffect(() => {
    if (isShaking) {
      const interval = setInterval(() => playBullSnort(), 1000);
      return () => clearInterval(interval);
    }
  }, [isShaking, playBullSnort]);

  // animation handling
  const { actions, mixer } = useAnimations(animations, groupRef as any);
  const currentAction = useRef<THREE.AnimationAction | null>(null);
  const lastActionId = useRef<number>(actionId);

  const findAction = (names: string[]) => {
    if (!actions) return undefined;
    const keys = Object.keys(actions);
    for (const name of names) {
      for (const key of keys) {
        if (key.toLowerCase().includes(name.toLowerCase())) return actions[key];
      }
    }
    return undefined;
  };

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child: any) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0 || isOneShotPlaying.current) return;

    const playLocomotion = () => {
      let desiredAction = findAction(["Bull_game_rig|Bull_game_Idle", "Bull_game_Idle", "idle", "Idle"]);

      if (bullState === "CHARGE" || isCharging) {
        desiredAction = findAction(["CHARGE", "Charge", "bull_game_charge", "charge"]) || desiredAction;
      } else if (bullState === "ALERT") {
        desiredAction = findAction(["ALERT", "Alert", "Bull_game_rig|Bull_game_Idle", "Idle"]) || desiredAction;
      } else if (bullState === "RECOVER") {
        desiredAction = findAction(["RECOVER", "Recover", "Bull_game_rig|Bull_game_walk", "walk", "Walk"]) || desiredAction;
      } else if (speed > 6) {
        desiredAction = findAction(["Bull_game_rig|Bull_game_Trot", "Trot", "Run", "run"]) || desiredAction;
      } else if (speed > 0.1) {
        desiredAction = findAction(["Bull_game_rig|Bull_game_walk", "Bull_game_walk", "Walk", "walk"]) || desiredAction;
      }

      if (!desiredAction) desiredAction = Object.values(actions)[0];
      if (!desiredAction) return;

      if (currentAction.current === desiredAction) return;

      if (currentAction.current) {
        currentAction.current.fadeOut(0.15);
      }

      desiredAction.reset().fadeIn(0.15).play();

      // Adjust animation speed so it physically matches game speed (prevents sliding)
      if (speed > 6.1) {
        desiredAction.setEffectiveTimeScale(speed / 8);
      } else if (speed > 0.1) {
        desiredAction.setEffectiveTimeScale(speed / 3.2);
      } else {
        desiredAction.setEffectiveTimeScale(1);
      }

      currentAction.current = desiredAction;
    };

    playLocomotion();
  }, [actions, speed, isCharging, bullState]);

  // One-shot actions (Back Kick, Action, etc.) triggered externally
  useEffect(() => {
    if (!actions || !actionName || actionId === lastActionId.current) return;

    lastActionId.current = actionId;
    isOneShotPlaying.current = true;

    const shot = findAction([actionName, "horn", "HORN", "attack", "ATTACK", "BACK KICK", "BackKick", "Back_Kick", "Action"]);
    if (!shot) {
      isOneShotPlaying.current = false;
      return;
    }

    try {
      shot.reset();
      shot.setLoop(THREE.LoopOnce, 1);
      // @ts-ignore clampWhenFinished exists at runtime
      shot.clampWhenFinished = true;

      if (currentAction.current && currentAction.current !== shot) {
        currentAction.current.fadeOut(0.08);
      }

      shot.fadeIn(0.08).play();
      currentAction.current = shot;

      const handler = (e: any) => {
        if (e.action !== shot) return;
        mixer.removeEventListener("finished", handler);
        isOneShotPlaying.current = false;

        // Resume locomotion
        const locomotionAction = (speed > 6)
          ? findAction(["Bull_game_rig|Bull_game_Trot", "Trot"])
          : (speed > 0)
            ? findAction(["Bull_game_rig|Bull_game_walk", "Walk"])
            : findAction(["Bull_game_rig|Bull_game_Idle", "Idle"]);

        const nextAction = locomotionAction || Object.values(actions)[0];
        if (nextAction && !isOneShotPlaying.current) {
          nextAction.reset().fadeIn(0.12).play();
          currentAction.current = nextAction;
        }
      };

      mixer.addEventListener("finished", handler);
    } catch (e) {
      console.error("Action error:", e);
      isOneShotPlaying.current = false;
    }
  }, [actionName, actionId, actions, mixer, speed]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    groupRef.current.position.set(position[0], position[1], position[2]);
    groupRef.current.rotation.y = rotation;

    // Step sounds
    if (speed > 0.1) {
      stepTimer.current += delta * speed * (isCharging ? 1.5 : 1);
      if (stepTimer.current > 4) {
        playStep();
        stepTimer.current = 0;
      }
    }

    if (isShaking) {
      shakeRef.current += delta * 25;
      groupRef.current.rotation.z = Math.sin(shakeRef.current) * 0.15;
      groupRef.current.rotation.x = Math.cos(shakeRef.current * 1.3) * 0.1;
    } else {
      shakeRef.current = 0;
      groupRef.current.rotation.z = 0;
      groupRef.current.rotation.x = 0;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={[1.5, 1.5, 1.5]} />
    </group>
  );
};

useGLTF.preload("/models/bull.glb");

export default Bull;
