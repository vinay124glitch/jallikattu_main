# 🐂 Jallikattu Survival Game

A 3D survival arena game inspired by the traditional Tamil sport Jallikattu. The player controls a human character trapped inside an arena with an aggressive bull. The objective is simple: survive as long as possible without getting caught.

The game features advanced bull AI behavior, multiple human NPCs trying to escape, realistic animations, and an immersive arena environment.

---

## 🎮 Gameplay

In this survival game, the player must run, dodge, and avoid the charging bull while trying to survive for 60 seconds.

The bull dynamically targets nearby humans and aggressively charges toward them. AI-controlled humans also run inside the arena trying to escape the bull, creating chaotic and unpredictable gameplay.

If the bull catches the player, the game ends.

---

## 🚀 Features

### Core Gameplay
- Player movement using WASD or Arrow Keys
- Sprint mechanic using Shift
- Survival objective (stay alive for 60 seconds)
- Catch detection when the bull gets too close
- Real-time survival scoring system

### Advanced Bull AI
- Dynamic target selection
- Multiple behavior states:
  - Idle
  - Walking
  - Running
  - Charging
  - Attacking
- Special bull actions:
  - Back kick attack
  - Aggressive charge
  - Shake-off maneuver to remove attached humans
- Intelligent target switching between player and NPC humans

### AI Human System
- Autonomous NPC humans inside the arena
- Humans automatically run away from the bull
- NPCs can be caught by the bull and attached

### 3D Environment
- Circular arena with fences
- Ground textures and terrain
- Dust particle effects
- Atmospheric fog
- Dynamic lighting and shadows

### Character Animations

Bull Animations:
- Idle
- Walk
- Run
- Charge
- Attack
- Back Kick
- Shake Off

Human Animations:
- Entry
- Idle
- Jog
- Run
- Caught / Dying

---

## 🖥 UI System

Menu Screen
- Game title
- Controls guide
- Start button

In-Game HUD
- Survival timer
- Humans caught counter

Game Over Screen
- Win or caught result
- Final survival time

---

## 🔊 Audio System

- Ambient arena sounds
- Footstep sounds
- Bull charge sound effects
- Crowd reactions
- Game over sound

---

## ⚙️ Technology Used

- React Three Fiber
- Three.js
- GLB / FBX animated models
- Tailwind CSS
- SkeletonUtils for optimized character cloning

---

## 🎥 Camera System

The game uses a dynamic follow camera that tracks the bull's movement to create a cinematic gameplay experience.

---

## 📈 Future Improvements

- Multiplayer arena mode
- Multiple bull types
- Larger arenas
- Ragdoll physics
- Crowd simulation
- Power-ups and player abilities

---

## 🎯 Objective

Survive the arena, avoid the bull, and stay alive as long as possible.

Can you escape the bull?
