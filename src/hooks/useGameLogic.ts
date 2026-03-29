import { useState, useEffect, useCallback, useRef } from "react";
import { useGameSounds } from "./useGameSounds";
import { HandGestureState } from "./useHandTracking";

interface HumanData {
  id: number;
  position: [number, number, number];
  attached: boolean;
  color: string;
  speed: number;
  rotation: number;
  actionName?: string | null;
  actionId?: number;
  isInvulnerable?: boolean;
}

const HUMAN_COLORS = ["#c0392b", "#2980b9", "#27ae60", "#f39c12"];
const ARENA_RADIUS = 16;
const HUMAN_SPEED = 10;
const BULL_WALK_SPEED = 4;
const BULL_CHARGE_SPEED = 18;
const ATTACH_DISTANCE = 1.8;
const GAME_DURATION = 999; // Essentially infinite or very long for this mode
const NUM_HUMANS = 1; 
const PLAYER_MAX_STAMINA = 100;
const PLAYER_MAX_HEALTH = 100;
const BULL_MAX_STAMINA = 100;

type BullState = "IDLE" | "PATROL" | "ALERT" | "CHARGE" | "RECOVER";

export const useGameLogic = (gestureState?: HandGestureState) => {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [bullPosition, setBullPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [bullRotation, setBullRotation] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const [humans, setHumans] = useState<HumanData[]>([]);
  const [bullSpeed, setBullSpeed] = useState(0);
  const [actionName, setActionName] = useState<string | null>(null);
  const [actionId, setActionId] = useState(0);

  // Game stats
  const [playerStamina, setPlayerStamina] = useState(PLAYER_MAX_STAMINA);
  const [playerHealth, setPlayerHealth] = useState(PLAYER_MAX_HEALTH);
  const [bullHealth, setBullHealth] = useState(100);
  const [bullMood, setBullMood] = useState<"calm" | "alert" | "aggressive" | "furious">("calm");
  const [bullStamina, setBullStamina] = useState(BULL_MAX_STAMINA);
  const [cameraShake, setCameraShake] = useState(0);
  const [timeScale, setTimeScale] = useState(1.0);
  const [playerLives, setPlayerLives] = useState(3);
  const [bullState, setBullState] = useState<BullState>("IDLE");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const keysRef = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef(0);
  const bullPosRef = useRef<[number, number, number]>([0, 0, 0]);
  const humanPosRef = useRef<[number, number, number]>([0, 0, 8]);
  const humanRotationRef = useRef<number>(0);
  const humanActionRef = useRef<string | null>(null);
  const humanActionIdRef = useRef<number>(0);
  const attackCooldownRef = useRef(0);
  const stepCooldownRef = useRef(0);
  const aiStateTimerRef = useRef(0);
  const bullTargetRef = useRef<[number, number, number] | null>(null);
  const invulnerableTimerRef = useRef(0);
  const aiHumansRef = useRef<{id: number, pos: [number, number, number], rot: number, target: [number, number, number], attached: boolean}[]>([]);

  const sounds = useGameSounds();

  const initHumans = useCallback(() => {
    const initialHumans: HumanData[] = [{
      id: 0,
      position: [0, 0, 8] as [number, number, number],
      attached: false,
      color: HUMAN_COLORS[0],
      speed: HUMAN_SPEED,
      rotation: 0,
      actionName: null,
      actionId: 0,
      isInvulnerable: false
    }];

    aiHumansRef.current = [];
    for (let i = 1; i < NUM_HUMANS; i++) {
      const angle = (i / (NUM_HUMANS - 1)) * Math.PI * 2;
      const x = Math.sin(angle) * 10;
      const z = Math.cos(angle) * 10;
      initialHumans.push({
        id: i,
        position: [x, 0, z],
        attached: false,
        color: HUMAN_COLORS[i % HUMAN_COLORS.length],
        speed: HUMAN_SPEED * 0.7,
        rotation: 0,
        actionName: null,
        actionId: 0,
        isInvulnerable: false
      });
      aiHumansRef.current.push({
        id: i,
        pos: [x, 0, z],
        rot: 0,
        target: [x, 0, z],
        attached: false
      });
    }
    return initialHumans;
  }, []);

  const startGame = useCallback(() => {
    setGameState("playing");
    setScore(0);
    setTimeLeft(GAME_DURATION);
    const initialBullPos: [number, number, number] = [0, 0, -8];
    setBullPosition(initialBullPos);
    bullPosRef.current = initialBullPos;
    
    const initialHumanPos: [number, number, number] = [0, 0, 8];
    humanPosRef.current = initialHumanPos;
    humanRotationRef.current = 0;
    humanActionRef.current = null;
    humanActionIdRef.current = 0;
    
    setBullRotation(0);
    setBullSpeed(0);
    setHumans(initHumans());
    setPlayerStamina(PLAYER_MAX_STAMINA);
    setPlayerHealth(PLAYER_MAX_HEALTH);
    setBullHealth(100);
    setPlayerLives(3);
    setBullStamina(BULL_MAX_STAMINA);
    setCameraShake(0);
    setTimeScale(1.0);
    setBullState("IDLE");
    aiStateTimerRef.current = 2;
    sounds.startGame();
  }, [initHumans, sounds]);

  // Key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameState !== "playing") return;

    const loop = (time: number) => {
      let delta = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = time;
      
      // Limit large deltas
      if (delta > 0.1) delta = 0.1;

      if (invulnerableTimerRef.current > 0) {
        invulnerableTimerRef.current -= delta;
      }

      const keys = keysRef.current;
      let moveX = 0, moveZ = 0;

      // Human Keyboard input
      if (keys.has("arrowup") || keys.has("w")) moveZ -= 1;
      if (keys.has("arrowdown") || keys.has("s")) moveZ += 1;
      if (keys.has("arrowleft") || keys.has("a")) moveX -= 1;
      if (keys.has("arrowright") || keys.has("d")) moveX += 1;

      // Gesture input (Overrides if active)
      if (gestureState) {
        if (Math.abs(gestureState.moveZ) > 0.05) moveZ = gestureState.moveZ;
        if (Math.abs(gestureState.moveX) > 0.05) moveX = gestureState.moveX;
      }

      // Update AI Humans
      aiHumansRef.current.forEach((ai, i) => {
        // Move towards target or flee bull
        const distToBull = Math.sqrt(Math.pow(ai.pos[0] - bullX, 2) + Math.pow(ai.pos[2] - bullZ, 2));
        
        if (distToBull < 6) {
          // Flee!
          const fleeX = ai.pos[0] - bullX;
          const fleeZ = ai.pos[2] - bullZ;
          const len = Math.sqrt(fleeX * fleeX + fleeZ * fleeZ);
          ai.target = [
            ai.pos[0] + (fleeX / len) * 5,
            0,
            ai.pos[2] + (fleeZ / len) * 5
          ];
        } else if (Math.random() < 0.01) {
          // Random new target
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * (ARENA_RADIUS - 4);
          ai.target = [Math.cos(angle) * dist, 0, Math.sin(angle) * dist];
        }

        const dx = ai.target[0] - ai.pos[0];
        const dz = ai.target[2] - ai.pos[2];
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d > 0.1) {
          const moveSpeed = HUMAN_SPEED * 0.6;
          ai.pos[0] += (dx / d) * moveSpeed * delta;
          ai.pos[2] += (dz / d) * moveSpeed * delta;
          ai.rot = Math.atan2(dx, dz);
        }

        // Keep in bounds
        const aiDist = Math.sqrt(ai.pos[0] * ai.pos[0] + ai.pos[2] * ai.pos[2]);
        if (aiDist > ARENA_RADIUS - 1.5) {
          const angle = Math.atan2(ai.pos[0], ai.pos[2]);
          ai.pos = [Math.sin(angle) * (ARENA_RADIUS - 1.6), 0, Math.cos(angle) * (ARENA_RADIUS - 1.6)];
        }
      });

      // Attack Logic
      attackCooldownRef.current -= delta;
      if (attackCooldownRef.current <= 0) {
        let attackType: string | null = null;
        let damage = 0;

        if (keys.has("1")) { attackType = "flying kick"; damage = 15; }
        else if (keys.has("2")) { attackType = "knee punch"; damage = 12; }
        else if (keys.has("3")) { attackType = "hurricane kick"; damage = 20; }
        else if (keys.has("4")) { attackType = "slash"; damage = 25; }
        else if (keys.has("5")) { attackType = "defeated"; damage = 0; }
        else if (keys.has("6")) { attackType = "falling"; damage = 0; }
        else if (keys.has("7")) { attackType = "dancing twerk"; damage = 0; }
        else if (keys.has("8")) { attackType = "silly dancing"; damage = 0; }

        if (attackType) {
          humanActionRef.current = attackType;
          humanActionIdRef.current += 1;
          attackCooldownRef.current = 0.8; // Cooldown for attacks
          sounds.playHumanGrunt();

          // Check hit
          const bullX = bullPosRef.current[0];
          const bullZ = bullPosRef.current[2];
          const humX = humanPosRef.current[0];
          const humZ = humanPosRef.current[2];
          const distToBull = Math.sqrt(Math.pow(bullX - humX, 2) + Math.pow(bullZ - humZ, 2));

          if (distToBull < 2.5) {
            setBullHealth(prev => Math.max(0, prev - damage));
            setCameraShake(0.5);
            sounds.playBullSnort();
            // Tiny knockback on bull
            const kx = (bullX - humX) / distToBull;
            const kz = (bullZ - humZ) / distToBull;
            bullPosRef.current = [bullX + kx * 0.5, 0, bullZ + kz * 0.5];
          }
        }
      }

      // Human Movement
      const currentHumanPos = [...humanPosRef.current] as [number, number, number];
      const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
      
      // Sprint multiplier if fist is detected or Shift is held
      let isSprinting = (gestureState?.isFist || keys.has("shift")) && playerStamina > 0;
      
      if (isSprinting) {
        setPlayerStamina(prev => Math.max(0, prev - delta * 25)); // Consume stamina
      } else {
        setPlayerStamina(prev => Math.min(PLAYER_MAX_STAMINA, prev + delta * 15)); // Regenerate
      }

      if (len > 0.1) {
        const currentSpeed = HUMAN_SPEED * (isSprinting ? 1.8 : 1.0);
        
        const targetRotation = Math.atan2(moveX, moveZ);
        humanRotationRef.current = targetRotation;

        const speedScale = Math.min(1, len);
        currentHumanPos[0] += (moveX / len) * currentSpeed * speedScale * delta;
        currentHumanPos[2] += (moveZ / len) * currentSpeed * speedScale * delta;
      }

      // Keep Human in Arena bounds
      const distFromCenter = Math.sqrt(currentHumanPos[0] * currentHumanPos[0] + currentHumanPos[2] * currentHumanPos[2]);
      if (distFromCenter < ARENA_RADIUS - 1) {
        humanPosRef.current = currentHumanPos;
      } else {
        const angle = Math.atan2(currentHumanPos[0], currentHumanPos[2]);
        humanPosRef.current = [Math.sin(angle) * (ARENA_RADIUS - 1.1), 0, Math.cos(angle) * (ARENA_RADIUS - 1.1)];
      }

      // BULL AI LOGIC
      aiStateTimerRef.current -= delta;
      
      const bullX = bullPosRef.current[0];
      const bullZ = bullPosRef.current[2];
      const humX = humanPosRef.current[0];
      const humZ = humanPosRef.current[2];
      
      const distToHuman = Math.sqrt(Math.pow(bullX - humX, 2) + Math.pow(bullZ - humZ, 2));
      
      // Find nearest human
      let nearestDist = distToHuman;
      let nearestPos: [number, number, number] = [humX, 0, humZ];
      
      aiHumansRef.current.forEach(ai => {
        if (ai.attached) return;
        const d = Math.sqrt(Math.pow(bullX - ai.pos[0], 2) + Math.pow(bullZ - ai.pos[2], 2));
        if (d < nearestDist) {
          nearestDist = d;
          nearestPos = ai.pos;
        }
      });

      if (aiStateTimerRef.current <= 0) {
        if (bullState === "IDLE" || bullState === "PATROL") {
          // Chance to charge nearest human
          if (nearestDist < 12 || Math.random() < 0.3) {
            setBullState("ALERT");
            setBullMood("alert");
            setIsShaking(true);
            aiStateTimerRef.current = 1.0;
            sounds.playShakeOff(); // Bull snort
          } else {
            // Patrol to random spot
            setBullState("PATROL");
            setBullMood("calm");
            setIsShaking(false);
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * (ARENA_RADIUS - 4);
            bullTargetRef.current = [Math.cos(angle) * dist, 0, Math.sin(angle) * dist];
            aiStateTimerRef.current = 2 + Math.random() * 3;
          }
        } else if (bullState === "ALERT") {
          setBullState("CHARGE");
          setBullMood("furious");
          setIsShaking(false);
          setIsCharging(true);
          bullTargetRef.current = [nearestPos[0], 0, nearestPos[2]];
          aiStateTimerRef.current = 2.0;
          sounds.playBullRoar();
        } else if (bullState === "CHARGE") {
          setBullState("RECOVER");
          setBullMood("aggressive");
          setIsShaking(true);
          setIsCharging(false);
          aiStateTimerRef.current = 1.5;
        } else if (bullState === "RECOVER") {
          setBullState("IDLE");
          setBullMood("calm");
          setIsShaking(false);
          aiStateTimerRef.current = 1.0;
        }
      }

      // Move Bull based on state
      let currentBullSpeed = 0;
      let nextBullX = bullX;
      let nextBullZ = bullZ;

      if (bullState === "PATROL" && bullTargetRef.current) {
        currentBullSpeed = BULL_WALK_SPEED;
        const dx = bullTargetRef.current[0] - bullX;
        const dz = bullTargetRef.current[2] - bullZ;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d > 0.5) {
          nextBullX += (dx / d) * BULL_WALK_SPEED * delta;
          nextBullZ += (dz / d) * BULL_WALK_SPEED * delta;
          const targetRot = Math.atan2(dx, dz);
          setBullRotation(prev => {
            let diff = targetRot - prev;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            return prev + diff * 0.1;
          });
        }
      } else if (bullState === "CHARGE" && bullTargetRef.current) {
        currentBullSpeed = BULL_CHARGE_SPEED;
        // Bull charges in the direction of the human at the start of charge
        const dx = bullTargetRef.current[0] - bullX;
        const dz = bullTargetRef.current[2] - bullZ;
        const d = Math.sqrt(dx * dx + dz * dz);
        
        // Slightly track human during charge? No, let's keep it "charge in direction" for fairness
        nextBullX += (dx / d) * BULL_CHARGE_SPEED * delta;
        nextBullZ += (dz / d) * BULL_CHARGE_SPEED * delta;
        
        const targetRot = Math.atan2(dx, dz);
        setBullRotation(prev => {
          let diff = targetRot - prev;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          return prev + diff * 0.05; // Slower turn during charge
        });

        if (d < 0.5) {
          aiStateTimerRef.current = 0; // End charge early if reached target
        }
      } else if (bullState === "ALERT") {
        // Face nearest human
        const dx = nearestPos[0] - bullX;
        const dz = nearestPos[2] - bullZ;
        const targetRot = Math.atan2(dx, dz);
        setBullRotation(prev => {
          let diff = targetRot - prev;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          return prev + diff * 0.2;
        });
      }

      setBullSpeed(currentBullSpeed);

      // Keep Bull in Arena bounds
      const bullDist = Math.sqrt(nextBullX * nextBullX + nextBullZ * nextBullZ);
      if (bullDist < ARENA_RADIUS - 0.5) {
        bullPosRef.current = [nextBullX, 0, nextBullZ];
        setBullPosition([nextBullX, 0, nextBullZ]);
      } else {
        const angle = Math.atan2(nextBullX, nextBullZ);
        bullPosRef.current = [Math.sin(angle) * (ARENA_RADIUS - 0.6), 0, Math.cos(angle) * (ARENA_RADIUS - 0.6)];
        setBullPosition([...bullPosRef.current]);
        if (bullState === "CHARGE") aiStateTimerRef.current = 0; // Hit wall, stop charge
      }

      // Update Human state
      const allHumans: HumanData[] = [{
        id: 0,
        position: humanPosRef.current,
        rotation: humanRotationRef.current,
        attached: playerHealth <= 0,
        color: HUMAN_COLORS[0],
        speed: len > 0.1 ? HUMAN_SPEED : 0,
        actionName: humanActionRef.current,
        actionId: humanActionIdRef.current,
        isInvulnerable: invulnerableTimerRef.current > 0
      }];

      let currentAttachedCount = playerHealth <= 0 ? 1 : 0;

      aiHumansRef.current.forEach((ai, i) => {
        if (ai.attached) currentAttachedCount++;
        
        allHumans.push({
          id: i + 1,
          position: ai.pos,
          rotation: ai.rot,
          attached: ai.attached,
          color: HUMAN_COLORS[(i + 1) % HUMAN_COLORS.length],
          speed: ai.attached ? 0 : (HUMAN_SPEED * 0.6),
          actionName: ai.attached ? "dying" : null,
          actionId: 0,
          isInvulnerable: false
        });
      });

      setHumans(allHumans);

      // Collision: Bull hits human
      if (distToHuman < ATTACH_DISTANCE && playerHealth > 0 && invulnerableTimerRef.current <= 0) {
        setPlayerHealth(prev => Math.max(0, prev - (bullState === "CHARGE" ? 50 : 10)));
        setCameraShake(1.5);
        sounds.playHumanScream();
        setActionName("horn");
        setActionId(prev => prev + 1);
        
        // Knockback human
        const kx = (humX - bullX) / distToHuman;
        const kz = (humZ - bullZ) / distToHuman;
        humanPosRef.current = [
          humanPosRef.current[0] + kx * 3,
          0,
          humanPosRef.current[2] + kz * 3
        ];
        
        if (bullState === "CHARGE") {
          aiStateTimerRef.current = 0; // End charge on hit
        }
      }

      // Collision: Bull hits AI humans
      aiHumansRef.current.forEach(ai => {
        if (ai.attached) return;
        const d = Math.sqrt(Math.pow(bullX - ai.pos[0], 2) + Math.pow(bullZ - ai.pos[2], 2));
        if (d < ATTACH_DISTANCE) {
          ai.attached = true;
          sounds.playHumanScream();
          if (bullState === "CHARGE") aiStateTimerRef.current = 0;
        }
      });

      if (playerHealth <= 0 && gameState === "playing") {
        if (playerLives > 1) {
          setPlayerLives(prev => prev - 1);
          setPlayerHealth(100);
          humanPosRef.current = [0, 0, 8]; // Reset to start position
          invulnerableTimerRef.current = 3.0; // 3 seconds of invulnerability
          sounds.playShakeOff(); // Re-use a sound for respawn feedback
        } else {
          setPlayerLives(0);
          setGameState("gameover");
          sounds.playGameOver();
        }
      }

      if (bullHealth <= 0 && gameState === "playing") {
        setGameState("gameover");
        sounds.playGameOver(); // Could be a victory sound if available
      }

      setCameraShake(s => Math.max(0, s - delta * 2));
      frameRef.current = requestAnimationFrame(loop);
    };

    const frameRef = { current: requestAnimationFrame(loop) };
    return () => cancelAnimationFrame(frameRef.current);
  }, [gameState, sounds, gestureState, bullState, playerHealth]);

  // Timer
  useEffect(() => {
    if (gameState !== "playing") return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          // In this mode, maybe we don't end by time? Or keep it.
          return 999;
        }
        return t - 1;
      });
      // Score increases by just surviving
      setScore(s => s + 10);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, sounds]);

  const attachedCount = humans.filter(h => h.attached).length;

  return {
    gameState, score, timeLeft, bullPosition, bullRotation, isShaking,
    isCharging, bullSpeed, actionName, actionId, humans, attachedCount,
    playerStamina, playerHealth, bullHealth, bullMood, bullStamina, cameraShake,
    isDodging: false, timeScale, playerLives, bullState, difficulty, setDifficulty, startGame,
  };
};
