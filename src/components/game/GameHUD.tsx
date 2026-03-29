interface GameHUDProps {
  score: number;
  timeLeft: number;
  attachedCount: number;
  totalHumans: number;
  playerStamina: number;
  bullStamina: number;
  bullMood: "calm" | "alert" | "aggressive" | "furious";
  gameState: "menu" | "playing" | "gameover";
  onStart: () => void;
  onRestart: () => void;
  bullState?: string;
  difficulty: "easy" | "medium" | "hard";
  setDifficulty: (diff: "easy" | "medium" | "hard") => void;
  playerHealth: number;
  playerLives: number;
  bullHealth: number;
}

const GameHUD = ({
  score,
  timeLeft,
  attachedCount,
  totalHumans,
  playerStamina,
  bullStamina,
  bullMood,
  gameState,
  onStart,
  onRestart,
  bullState = "IDLE",
  difficulty,
  setDifficulty,
  playerHealth,
  playerLives,
  bullHealth,
}: GameHUDProps) => {
  const getMoodColor = () => {
    switch (bullMood) {
      case "furious": return "hsl(0, 80%, 50%)";
      case "aggressive": return "hsl(15, 80%, 50%)";
      case "alert": return "hsl(35, 80%, 50%)";
      default: return "hsl(45, 90%, 55%)";
    }
  };

  if (gameState === "menu") {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto">
        <div className="text-center">
          <h1
            className="text-7xl font-black tracking-tight mb-2"
            style={{
              color: "hsl(45, 90%, 55%)",
              textShadow: "0 4px 20px rgba(0,0,0,0.7), 0 0 60px rgba(200,150,50,0.3)",
              fontFamily: "'Georgia', serif",
            }}
          >
            JALLIKATTU
          </h1>
          <p className="text-foreground/70 text-lg mb-8 tracking-widest uppercase">
            The Bull Taming Sport
          </p>
          <div className="flex gap-4 justify-center mb-8">
            {(["easy", "medium", "hard"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setDifficulty(mode)}
                className={`px-6 py-2 rounded-lg text-lg font-bold tracking-wider uppercase transition-all ${difficulty === mode
                  ? "scale-105 border-2 border-white text-white"
                  : "opacity-70 border border-transparent hover:opacity-100"
                  }`}
                style={{
                  background: difficulty === mode
                    ? "linear-gradient(135deg, hsl(18, 72%, 50%), hsl(18, 72%, 38%))"
                    : "rgba(0,0,0,0.5)",
                }}
              >
                {mode}
              </button>
            ))}
          </div>
          <button
            onClick={onStart}
            className="px-10 py-4 rounded-lg text-xl font-bold tracking-wider uppercase transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, hsl(18, 72%, 50%), hsl(18, 72%, 38%))",
              color: "hsl(35, 30%, 95%)",
              boxShadow: "0 4px 20px rgba(180, 80, 30, 0.5)",
            }}
          >
            Start Game
          </button>

          <div className="mt-8 text-muted-foreground text-sm space-y-1">
            <p>🏃 WASD / Arrows — Move Human</p>
            <p>⚡ Shift — Sprint to Escape</p>
            <p>⚔️ Keys 1-4 — Special Attacks</p>
            <p>🎭 Keys 5-8 — Human Emotes</p>
            <p>⚠️ Damage the Bull to win!</p>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "gameover") {
    const playerWon = bullHealth <= 0;
    return (
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto">
        <div className="text-center">
          <h2
            className="text-5xl font-black mb-4"
            style={{
              color: "hsl(45, 90%, 55%)",
              textShadow: "0 4px 20px rgba(0,0,0,0.7)",
              fontFamily: "'Georgia', serif",
            }}
          >
            {playerWon ? "Bull Tamed!" : "Caught!"}
          </h2>
          <p className="text-3xl font-bold text-foreground mb-2">
            Survived: <span style={{ color: "hsl(45, 90%, 55%)" }}>{score}s</span>
          </p>
          <p className="text-muted-foreground mb-8">
            {playerWon ? "You successfully defeated the bull!" : `The bull got you after ${score} seconds.`}
          </p>
          <button
            onClick={onRestart}
            className="px-8 py-3 rounded-lg text-lg font-bold tracking-wider uppercase transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, hsl(18, 72%, 50%), hsl(18, 72%, 38%))",
              color: "hsl(35, 30%, 95%)",
              boxShadow: "0 4px 20px rgba(180, 80, 30, 0.5)",
            }}
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none p-4">
      <div className="flex justify-between items-start max-w-3xl mx-auto">
        {/* Score */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl px-5 py-3 border border-border">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Time</div>
          <div className="text-3xl font-black" style={{ color: "hsl(45, 90%, 55%)" }}>
            {score}s
          </div>
        </div>

        {/* Bull Health Indicator */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl px-5 py-3 border border-border min-w-[140px]">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Bull HP</div>
          <div className="text-3xl font-black" style={{ color: bullHealth < 30 ? "red" : "hsl(18, 72%, 50%)" }}>
            {Math.round(bullHealth)}%
          </div>
        </div>
      </div>

      {/* Health, Stamina & Status Bottom HUD */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col gap-3 w-full max-w-xl px-4">
        {/* Player Health */}
        <div className="space-y-1">
          <div className="flex justify-between items-end text-[10px] uppercase tracking-[0.2em] font-bold text-white/70">
            <div className="flex flex-col gap-1">
              <span>Lives</span>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <span key={i} className={`text-sm ${i < playerLives ? "text-red-500" : "text-white/20"}`}>
                    ❤️
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <span>Human Health</span>
              <div className="text-sm text-white">{Math.round(playerHealth)}%</div>
            </div>
          </div>
          <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${playerHealth}%`,
                background: playerHealth < 30 ? "hsl(0, 80%, 50%)" : playerHealth < 60 ? "hsl(35, 80%, 50%)" : "linear-gradient(90deg, hsl(120, 70%, 45%), hsl(90, 70%, 50%))"
              }}
            />
          </div>
        </div>

        {/* Player Stamina */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] font-bold text-white/70">
            <span>⚡ Sprint Stamina</span>
            <span>{Math.round(playerStamina)}%</span>
          </div>
          <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full transition-all duration-200"
              style={{
                width: `${playerStamina}%`,
                background: playerStamina < 25 ? "hsl(0, 80%, 50%)" : "linear-gradient(90deg, hsl(180, 70%, 50%), hsl(150, 70%, 50%))"
              }}
            />
          </div>
        </div>

        {/* Bull Health bar additionally */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] font-bold text-white/70">
            <span>🐂 Bull Health</span>
            <span>{Math.round(bullHealth)}%</span>
          </div>
          <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${bullHealth}%`,
                background: "linear-gradient(90deg, #991b1b, #ef4444)"
              }}
            />
          </div>
        </div>

        {/* Bull Status */}
        <div className="flex justify-center gap-8 items-center bg-black/40 backdrop-blur-md rounded-full py-2 px-8 border border-white/10 shadow-2xl">
          <div className="text-center">
            <div className="text-[9px] uppercase tracking-[0.3em] text-white/50 mb-0.5">Bull Mood</div>
            <div className="text-sm font-black uppercase tracking-widest" style={{ color: getMoodColor() }}>
              {bullMood}
            </div>
          </div>
          <div className="h-8 w-[1px] bg-white/10" />
          <div className="text-center">
            <div className="text-[9px] uppercase tracking-[0.3em] text-white/50 mb-0.5">Behaviour</div>
            <div className="text-sm font-black uppercase tracking-widest text-white">
              {bullState}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHUD;
