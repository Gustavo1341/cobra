import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

// --- CONSTANTS ---
const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const MIN_SPEED = 30;
const SPEED_INCREMENT_PER_SEGMENT = 8;
const PARTICLE_COUNT = 15;
const COMBO_TIMEOUT = 3000;
const FOODS_AFTER_TWO = 3; // Número de maçãs após comer 2

type GameState = "IDLE" | "PLAYING" | "PAUSED" | "GAME_OVER";
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Position = { x: number; y: number };
type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

// --- HELPER FUNCTIONS ---
const getRandomCoordinate = (): Position => ({
  x: Math.floor(Math.random() * GRID_SIZE),
  y: Math.floor(Math.random() * GRID_SIZE),
});

const isSamePosition = (pos1: Position, pos2: Position): boolean => {
  return pos1.x === pos2.x && pos1.y === pos2.y;
};

// --- UI COMPONENTS ---

interface GameOverlayProps {
  title: string;
  buttonText: string;
  onButtonClick: () => void;
  children?: React.ReactNode;
}

const GameOverlay: React.FC<GameOverlayProps> = ({
  title,
  buttonText,
  onButtonClick,
  children,
}) => (
  <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/85 to-black/90 flex flex-col justify-center items-center backdrop-blur-md z-[500] animate-fadeIn">
    <div className="text-center bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-2 border-teal-400/60 rounded-2xl p-10 shadow-[0_0_40px_rgba(45,212,191,0.4),inset_0_0_20px_rgba(45,212,191,0.1)] transform animate-scaleIn">
      <h2
        className="font-pixel text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 uppercase tracking-widest mb-6 animate-glow"
        style={{ 
          textShadow: "0 0 20px rgba(45,212,191,0.8), 0 0 40px rgba(45,212,191,0.4)",
          filter: "drop-shadow(0 0 10px rgba(45,212,191,0.6))"
        }}
      >
        {title}
      </h2>
      {children}
      <button
        onClick={onButtonClick}
        className="mt-8 font-pixel bg-gradient-to-r from-teal-500 to-cyan-500 text-black px-10 py-4 rounded-xl hover:from-teal-400 hover:to-cyan-400 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-[0_0_25px_rgba(45,212,191,0.8),0_10px_30px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-4 focus:ring-teal-300/50 active:scale-95 uppercase tracking-wider"
      >
        {buttonText}
      </button>
    </div>
  </div>
);

const ScoreBoard: React.FC<{ score: number; highScore: number; speed: number }> = ({
  score,
  highScore,
  speed,
}) => {
  const speedPercent = Math.round(((INITIAL_SPEED - speed) / (INITIAL_SPEED - MIN_SPEED)) * 100);
  
  return (
    <div className="flex justify-between items-center w-full text-white font-pixel text-xs md:text-sm gap-2 md:gap-3">
      <div className="flex-1 bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-teal-500/40 px-2 md:px-4 py-2 md:py-3 rounded-xl shadow-[0_0_15px_rgba(45,212,191,0.3)] backdrop-blur-sm">
        <div className="text-gray-400 text-[8px] md:text-[10px] mb-1">PONTOS</div>
        <div className="text-teal-400 text-base md:text-lg lg:text-xl font-bold animate-pulse">{score}</div>
      </div>
      <div className="flex-1 bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-purple-500/40 px-2 md:px-4 py-2 md:py-3 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] backdrop-blur-sm">
        <div className="text-gray-400 text-[8px] md:text-[10px] mb-1">RECORDE</div>
        <div className="text-purple-400 text-base md:text-lg lg:text-xl font-bold">{highScore}</div>
      </div>
      <div className="flex-1 bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-orange-500/40 px-2 md:px-4 py-2 md:py-3 rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.3)] backdrop-blur-sm">
        <div className="text-gray-400 text-[8px] md:text-[10px] mb-1 hidden sm:block">VELOCIDADE</div>
        <div className="text-gray-400 text-[8px] md:text-[10px] mb-1 sm:hidden">VEL</div>
        <div className="text-orange-400 text-base md:text-lg lg:text-xl font-bold">{speedPercent}%</div>
      </div>
    </div>
  );
};

const SnakeHead: React.FC<{ direction: Direction }> = ({ direction }) => {
  const rotationRef = useRef(0);

  const eyeBaseStyle: React.CSSProperties = {
    position: "absolute",
    width: "32%",
    height: "32%",
    backgroundColor: "white",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 3px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.5)",
  };

  let targetRotation = 0;
  switch (direction) {
    case "UP":
      targetRotation = 0;
      break;
    case "DOWN":
      targetRotation = 180;
      break;
    case "LEFT":
      targetRotation = 270;
      break;
    case "RIGHT":
      targetRotation = 90;
      break;
  }

  let currentRotation = rotationRef.current;
  let diff = targetRotation - currentRotation;

  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;

  const newRotation = currentRotation + diff;
  rotationRef.current = newRotation;

  const pupilStyle: React.CSSProperties = {
    width: "60%",
    height: "60%",
    backgroundColor: "#0a0a0a",
    borderRadius: "50%",
    boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
  };

  const eye1Style: React.CSSProperties = {
    ...eyeBaseStyle,
    top: "18%",
    left: "18%",
  };
  const eye2Style: React.CSSProperties = {
    ...eyeBaseStyle,
    top: "18%",
    right: "18%",
  };

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #a5d6a7 0%, #81c784 50%, #66bb6a 100%)",
        borderRadius: "50% 50% 0 0",
        transform: `rotate(${newRotation}deg)`,
        transition: "transform 0.08s ease-out",
        boxShadow: "0 0 20px rgba(129,199,132,0.9), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)",
      }}
    >
      <div style={eye1Style}>
        <div style={pupilStyle} />
      </div>
      <div style={eye2Style}>
        <div style={pupilStyle} />
      </div>
      <div
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
        style={{
          width: "40%",
          height: "15%",
          background: "rgba(0,0,0,0.15)",
          borderRadius: "50% 50% 0 0",
        }}
      />
    </div>
  );
};

const ParticleEffect: React.FC<{ particles: Particle[] }> = ({ particles }) => (
  <>
    {particles.map((particle) => (
      <div
        key={particle.id}
        className="absolute pointer-events-none"
        style={{
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: particle.color,
          opacity: particle.life,
          boxShadow: `0 0 ${8 * particle.life}px ${particle.color}`,
          transform: "translate(-50%, -50%)",
          transition: "opacity 0.1s linear",
        }}
      />
    ))}
  </>
);

interface MobileControlsProps {
  onDirectionChange: (direction: Direction) => void;
  currentDirection: Direction;
  disabled: boolean;
}

const MobileControls: React.FC<MobileControlsProps> = ({
  onDirectionChange,
  currentDirection,
  disabled,
}) => {
  const handleDirection = (newDirection: Direction) => {
    if (disabled) return;
    
    const isOppositeDirection =
      (newDirection === "UP" && currentDirection === "DOWN") ||
      (newDirection === "DOWN" && currentDirection === "UP") ||
      (newDirection === "LEFT" && currentDirection === "RIGHT") ||
      (newDirection === "RIGHT" && currentDirection === "LEFT");
    
    if (!isOppositeDirection) {
      onDirectionChange(newDirection);
    }
  };

  const buttonClass = "w-14 h-14 bg-gradient-to-br from-teal-500/90 to-cyan-500/90 backdrop-blur-sm border-2 border-teal-400/70 rounded-xl shadow-[0_0_20px_rgba(45,212,191,0.6)] active:scale-95 active:shadow-[0_0_30px_rgba(45,212,191,0.9)] transition-all duration-150 flex items-center justify-center text-white text-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[600] md:hidden">
      <div className="relative w-44 h-44">
        {/* Up */}
        <button
          onClick={() => handleDirection("UP")}
          disabled={disabled}
          className={`${buttonClass} absolute top-0 left-1/2 transform -translate-x-1/2`}
          aria-label="Mover para cima"
        >
          ▲
        </button>
        
        {/* Down */}
        <button
          onClick={() => handleDirection("DOWN")}
          disabled={disabled}
          className={`${buttonClass} absolute bottom-0 left-1/2 transform -translate-x-1/2`}
          aria-label="Mover para baixo"
        >
          ▼
        </button>
        
        {/* Left */}
        <button
          onClick={() => handleDirection("LEFT")}
          disabled={disabled}
          className={`${buttonClass} absolute left-0 top-1/2 transform -translate-y-1/2`}
          aria-label="Mover para esquerda"
        >
          ◀
        </button>
        
        {/* Right */}
        <button
          onClick={() => handleDirection("RIGHT")}
          disabled={disabled}
          className={`${buttonClass} absolute right-0 top-1/2 transform -translate-y-1/2`}
          aria-label="Mover para direita"
        >
          ▶
        </button>
        
        {/* Center indicator */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-purple-500/60 to-pink-500/60 backdrop-blur-sm border-2 border-purple-400/50 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center pointer-events-none">
          <div className="w-6 h-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-full border border-purple-300/20" />
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>("IDLE");
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [foods, setFoods] = useState<Position[]>([getRandomCoordinate()]);
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const directionRef = useRef<Direction>("RIGHT");
  const [score, setScore] = useState<number>(0);
  const [foodsEaten, setFoodsEaten] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const savedScore = localStorage.getItem("snakeHighScore");
    return savedScore ? parseInt(savedScore, 10) : 0;
  });
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);
  const [combo, setCombo] = useState<number>(0);
  const comboTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Pré-carregar áudios para reprodução instantânea
  const gameOverAudioRef = useRef<HTMLAudioElement | null>(null);
  const eatSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    gameOverAudioRef.current = new Audio("/kl-peach-game-over-iii-142453.mp3");
    gameOverAudioRef.current.load();
    eatSoundRef.current = new Audio("/one_beep-99630 (1).mp3");
    eatSoundRef.current.load();
  }, []);

  const initialSnakePosition = useMemo(() => [{ x: 10, y: 10 }], []);

  const gameSpeed = useMemo(() => {
    const speedReduction = (snake.length - 1) * SPEED_INCREMENT_PER_SEGMENT;
    return Math.max(MIN_SPEED, INITIAL_SPEED - speedReduction);
  }, [snake.length]);

  const resetGame = useCallback(() => {
    setSnake(initialSnakePosition);
    setFoods([getRandomCoordinate()]);
    setDirection("RIGHT");
    directionRef.current = "RIGHT";
    setScore(0);
    setFoodsEaten(0);
    setCombo(0);
    setParticles([]);
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    setGameState("PLAYING");
  }, [initialSnakePosition]);

  const generateFoods = useCallback((currentSnake: Position[], count: number, existingFoods: Position[] = []) => {
    const newFoods: Position[] = [...existingFoods];
    const occupiedPositions = [...currentSnake, ...newFoods];
    
    while (newFoods.length < count) {
      let newFoodPosition: Position;
      let attempts = 0;
      do {
        newFoodPosition = getRandomCoordinate();
        attempts++;
      } while (
        attempts < 100 &&
        occupiedPositions.some((pos) => isSamePosition(pos, newFoodPosition))
      );
      
      if (attempts < 100) {
        newFoods.push(newFoodPosition);
        occupiedPositions.push(newFoodPosition);
      }
    }
    
    setFoods(newFoods);
  }, []);

  const createParticles = useCallback((x: number, y: number) => {
    const newParticles: Particle[] = [];
    const colors = ["#ff6b6b", "#ffd93d", "#6bcf7f", "#4ecdc4", "#a78bfa"];
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT;
      const speed = 2 + Math.random() * 3;
      newParticles.push({
        id: particleIdRef.current++,
        x: (x + 0.5) * (100 / GRID_SIZE),
        y: (y + 0.5) * (100 / GRID_SIZE),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    
    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  const handleDirectionChange = useCallback((newDirection: Direction) => {
    if (gameState !== "PLAYING") return;
    setDirection(newDirection);
    directionRef.current = newDirection;
  }, [gameState]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      if (gameState === "IDLE" || gameState === "GAME_OVER") {
        if (e.key === "Enter" || e.key === " ") resetGame();
        return;
      }

      if (e.key === " " || e.key === "p") {
        setGameState((prev) => (prev === "PLAYING" ? "PAUSED" : "PLAYING"));
        return;
      }

      if (gameState !== "PLAYING") return;

      const keyMap: { [key: string]: Direction } = {
        ArrowUp: "UP",
        w: "UP",
        W: "UP",
        ArrowDown: "DOWN",
        s: "DOWN",
        S: "DOWN",
        ArrowLeft: "LEFT",
        a: "LEFT",
        A: "LEFT",
        ArrowRight: "RIGHT",
        d: "RIGHT",
        D: "RIGHT",
      };
      const newDirection = keyMap[e.key];

      if (newDirection) {
        handleDirectionChange(newDirection);
      }
    },
    [gameState, resetGame, handleDirectionChange]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Touch/Swipe support
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipe();
    };

    const handleSwipe = () => {
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const minSwipeDistance = 30;

      if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
        return;
      }

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          handleDirectionChange("RIGHT");
        } else {
          handleDirectionChange("LEFT");
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          handleDirectionChange("DOWN");
        } else {
          handleDirectionChange("UP");
        }
      }
    };

    if (gameContainerRef.current) {
      const container = gameContainerRef.current;
      container.addEventListener("touchstart", handleTouchStart);
      container.addEventListener("touchend", handleTouchEnd);

      return () => {
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [handleDirectionChange]);

  const moveSnake = useCallback(() => {
    setSnake((prevSnake) => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };

      switch (directionRef.current) {
        case "UP":
          head.y -= 1;
          break;
        case "DOWN":
          head.y += 1;
          break;
        case "LEFT":
          head.x -= 1;
          break;
        case "RIGHT":
          head.x += 1;
          break;
      }

      // Wrap around - atravessar paredes
      if (head.x < 0) {
        head.x = GRID_SIZE - 1;
      } else if (head.x >= GRID_SIZE) {
        head.x = 0;
      }
      
      if (head.y < 0) {
        head.y = GRID_SIZE - 1;
      } else if (head.y >= GRID_SIZE) {
        head.y = 0;
      }

      // Colisão com o próprio corpo
      for (const segment of newSnake.slice(1)) {
        // slice(1) to avoid checking collision with the old head position
        if (isSamePosition(head, segment)) {
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 500);
          setGameState("GAME_OVER");
          return prevSnake;
        }
      }

      newSnake.unshift(head);

      // Verificar se comeu alguma comida
      const eatenFoodIndex = foods.findIndex((food) => isSamePosition(head, food));
      
      if (eatenFoodIndex !== -1) {
        setCombo((prev) => prev + 1);
        const comboMultiplier = Math.min(Math.floor(combo / 3) + 1, 5);
        setScore((prevScore) => prevScore + comboMultiplier);
        createParticles(head.x, head.y);
        
        // Remover comida comida e atualizar contador
        setFoodsEaten((prev) => {
          const newCount = prev + 1;
          
          // Após comer 2, adicionar mais maçãs
          if (newCount >= 2 && newCount % 2 === 0) {
            const remainingFoods = foods.filter((_, i) => i !== eatenFoodIndex);
            generateFoods(newSnake, FOODS_AFTER_TWO, remainingFoods);
          } else {
            // Apenas remover a comida comida e adicionar uma nova
            const remainingFoods = foods.filter((_, i) => i !== eatenFoodIndex);
            generateFoods(newSnake, remainingFoods.length + 1, remainingFoods);
          }
          
          return newCount;
        });
        
        if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
        comboTimerRef.current = setTimeout(() => setCombo(0), COMBO_TIMEOUT);
        
        if (eatSoundRef.current) {
          eatSoundRef.current.currentTime = 0;
          eatSoundRef.current.playbackRate = 1 + (comboMultiplier - 1) * 0.1;
          eatSoundRef.current
            .play()
            .catch((error) => console.error("Audio playback failed:", error));
        }
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [foods, generateFoods, combo, createParticles]);

  useEffect(() => {
    if (gameState !== "PLAYING") return;

    const gameInterval = setInterval(moveSnake, gameSpeed);
    return () => clearInterval(gameInterval);
  }, [gameState, moveSnake, gameSpeed]);

  useEffect(() => {
    const particleInterval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 0.05,
          }))
          .filter((p) => p.life > 0)
      );
    }, 50);

    return () => clearInterval(particleInterval);
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("snakeHighScore", score.toString());
    }
  }, [score, highScore]);

  useEffect(() => {
    if (gameState === "GAME_OVER" && gameOverAudioRef.current) {
      gameOverAudioRef.current.currentTime = 0;
      gameOverAudioRef.current
        .play()
        .catch((error) => console.error("Audio playback failed:", error));
    }
  }, [gameState]);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex flex-col items-center justify-start md:justify-center p-2 md:p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(45,212,191,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(45,212,191,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(45,212,191,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      <div className="w-full max-w-lg md:max-w-xl lg:max-w-2xl relative z-10 flex flex-col h-full md:h-auto">
        <header className="flex flex-col items-center mb-2 md:mb-6 mt-2 md:mt-0">
          <h1
            className="font-pixel text-3xl md:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-300 uppercase tracking-widest mb-1 md:mb-2 animate-glow"
            style={{ 
              textShadow: "0 0 30px rgba(45,212,191,0.8), 0 0 60px rgba(45,212,191,0.4)",
              filter: "drop-shadow(0 0 15px rgba(45,212,191,0.6))"
            }}
          >
            COBRA
          </h1>
          <div className="h-0.5 md:h-1 w-24 md:w-32 bg-gradient-to-r from-transparent via-teal-400 to-transparent rounded-full shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
        </header>

        <main className="relative flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2 md:mb-4">
            <div className="flex-1">
              <ScoreBoard score={score} highScore={highScore} speed={gameSpeed} />
            </div>
            {gameState === "PLAYING" && (
              <button
                onClick={() => setGameState("PAUSED")}
                className="md:hidden ml-2 w-10 h-10 bg-gradient-to-br from-purple-500/80 to-pink-500/80 backdrop-blur-sm border-2 border-purple-400/60 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.5)] active:scale-95 transition-all duration-150 flex items-center justify-center text-white text-lg flex-shrink-0"
                aria-label="Pausar jogo"
              >
                ⏸
              </button>
            )}
          </div>

          <div
            ref={gameContainerRef}
            className={`relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 md:border-4 border-teal-500/40 shadow-2xl rounded-xl md:rounded-2xl overflow-visible flex-shrink-0 ${isShaking ? 'shake' : ''}`}
            style={{
              aspectRatio: "1 / 1",
              maxHeight: "calc(100vh - 280px)",
              maxWidth: "100%",
              backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`,
              backgroundImage: `linear-gradient(to right, rgba(45, 212, 191, 0.08) 1px, transparent 1px),
                         linear-gradient(to bottom, rgba(45, 212, 191, 0.08) 1px, transparent 1px)`,
              boxShadow: "0 0 60px rgba(45,212,191,0.3), inset 0 0 40px rgba(0,0,0,0.5)",
            }}
          >
            {/* Portal effect borders */}
            <div className="absolute inset-0 pointer-events-none" style={{ clipPath: "inset(0 round 0.75rem)" }}>
              {/* Top border glow */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-cyan-400/30 to-transparent animate-pulse" />
              {/* Bottom border glow */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-t from-cyan-400/30 to-transparent animate-pulse" />
              {/* Left border glow */}
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-r from-cyan-400/30 to-transparent animate-pulse" />
              {/* Right border glow */}
              <div className="absolute top-0 bottom-0 right-0 w-1 bg-gradient-to-l from-cyan-400/30 to-transparent animate-pulse" />
            </div>
            
            <ParticleEffect particles={particles} />
            
            {combo > 2 && gameState === "PLAYING" && (
              <div className="absolute top-2 md:top-4 left-1/2 transform -translate-x-1/2 z-[400] animate-bounce">
                <div className="font-pixel text-yellow-400 text-sm md:text-xl lg:text-2xl px-3 md:px-4 py-1 md:py-2 bg-black/70 rounded-lg border-2 border-yellow-400/60 shadow-[0_0_20px_rgba(250,204,21,0.6)]">
                  COMBO x{Math.min(Math.floor(combo / 3) + 1, 5)}!
                </div>
              </div>
            )}
            {gameState === "IDLE" && (
              <GameOverlay
                title="COBRA NEON"
                buttonText="▶ Iniciar"
                onButtonClick={resetGame}
              >
                <div className="text-gray-300 mt-6 max-w-md space-y-3 text-sm px-4">
                  <p className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="hidden md:inline">
                      <span className="text-teal-400 font-bold">↑ ↓ ← →</span> ou
                      <span className="text-teal-400 font-bold"> W A S D</span> para mover
                    </span>
                    <span className="md:hidden text-teal-400 font-bold">
                      Use os botões na tela para mover
                    </span>
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <span className="text-teal-400 font-bold hidden md:inline">ESPAÇO</span>
                    <span className="md:hidden text-teal-400 font-bold">Toque na tela</span>
                    <span className="hidden md:inline">para pausar</span>
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-600 space-y-2">
                    <div>
                      <p className="text-yellow-400 font-bold">🔥 Sistema de Combo!</p>
                      <p className="text-xs text-gray-400 mt-1">Colete maçãs rapidamente para multiplicar pontos</p>
                    </div>
                    <div>
                      <p className="text-cyan-400 font-bold">🌀 Atravesse Paredes!</p>
                      <p className="text-xs text-gray-400 mt-1">Saia por um lado e apareça do outro - sem colisões!</p>
                    </div>
                  </div>
                </div>
              </GameOverlay>
            )}

            {gameState === "PAUSED" && (
              <GameOverlay
                title="⏸ PAUSADO"
                buttonText="▶ Continuar"
                onButtonClick={() => setGameState("PLAYING")}
              >
                <p className="text-gray-400 text-sm mt-4">Pressione ESPAÇO para continuar</p>
              </GameOverlay>
            )}

            {gameState === "GAME_OVER" && (
              <GameOverlay
                title="💀 GAME OVER"
                buttonText="🔄 Jogar Novamente"
                onButtonClick={resetGame}
              >
                <div className="mt-6 space-y-4">
                  <div className="font-pixel text-2xl text-white">
                    Pontuação: <span className="text-teal-400">{score}</span>
                  </div>
                  {score === highScore && score > 0 && (
                    <div className="text-yellow-400 font-pixel text-sm animate-bounce">
                      🏆 NOVO RECORDE! 🏆
                    </div>
                  )}
                  <div className="text-gray-400 text-sm">
                    Tamanho da cobra: <span className="text-cyan-400">{snake.length}</span>
                  </div>
                </div>
              </GameOverlay>
            )}

            {/* Render Snake */}
            {snake.map((segment, index) => {
              const isHead = index === 0;
              const isTail = index === snake.length - 1;

              let tailRotation = 0;
              if (isTail && snake.length > 1) {
                const prevSegment = snake[index - 1];
                if (prevSegment.y < segment.y) tailRotation = 0;
                else if (prevSegment.y > segment.y) tailRotation = 180;
                else if (prevSegment.x < segment.x) tailRotation = -90;
                else if (prevSegment.x > segment.x) tailRotation = 90;
              }

              // Detectar wrap around para animação suave
              const wrapSegments = [];
              if (index > 0) {
                const prevSegment = snake[index - 1];
                const distX = Math.abs(segment.x - prevSegment.x);
                const distY = Math.abs(segment.y - prevSegment.y);
                
                // Se a distância é muito grande, está atravessando parede
                if (distX > GRID_SIZE / 2) {
                  // Atravessando horizontalmente
                  const wrapX = segment.x < GRID_SIZE / 2 ? segment.x + GRID_SIZE : segment.x - GRID_SIZE;
                  wrapSegments.push({
                    x: wrapX,
                    y: segment.y,
                    key: `wrap-h-${index}`,
                  });
                }
                
                if (distY > GRID_SIZE / 2) {
                  // Atravessando verticalmente
                  const wrapY = segment.y < GRID_SIZE / 2 ? segment.y + GRID_SIZE : segment.y - GRID_SIZE;
                  wrapSegments.push({
                    x: segment.x,
                    y: wrapY,
                    key: `wrap-v-${index}`,
                  });
                }
              }

              // Detectar curvas para preenchimento
              const fillers = [];
              if (index > 1 && index < snake.length - 1) {
                const prev = snake[index - 1];
                const next = snake[index + 1];

                const fromHorizontal = prev.y === segment.y;
                const toVertical = next.x === segment.x;
                const fromVertical = prev.x === segment.x;
                const toHorizontal = next.y === segment.y;

                if (
                  (fromHorizontal && toVertical) ||
                  (fromVertical && toHorizontal)
                ) {
                  const fillX = fromHorizontal ? prev.x : segment.x;
                  const fillY = fromVertical ? prev.y : segment.y;

                  fillers.push(
                    <div
                      key={`filler-${index}`}
                      className="absolute"
                      style={{
                        width: `${100 / GRID_SIZE}%`,
                        height: `${100 / GRID_SIZE}%`,
                        left: `${fillX * (100 / GRID_SIZE)}%`,
                        top: `${fillY * (100 / GRID_SIZE)}%`,
                        background: "#9ccc65",
                        zIndex: snake.length - index - 1,
                      }}
                    />
                  );
                }
              }

              const renderSegment = (x: number, y: number, opacity: number = 1) => {
                return (
                  <div
                    className="absolute"
                    style={{
                      width: `${100 / GRID_SIZE}%`,
                      height: `${100 / GRID_SIZE}%`,
                      left: `${x * (100 / GRID_SIZE)}%`,
                      top: `${y * (100 / GRID_SIZE)}%`,
                      zIndex: snake.length - index,
                      opacity,
                    }}
                  >
                    {isHead ? (
                      <SnakeHead direction={direction} />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          background: isTail 
                            ? "linear-gradient(135deg, #81c784 0%, #66bb6a 50%, #4caf50 100%)"
                            : "linear-gradient(135deg, #a5d6a7 0%, #81c784 50%, #66bb6a 100%)",
                          borderRadius: isTail ? "0 0 50% 50%" : "0px",
                          transform: isTail ? `rotate(${tailRotation}deg)` : "none",
                          transition: "transform 0.08s ease-out",
                          boxShadow: "0 0 10px rgba(129,199,132,0.6), inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.2)",
                        }}
                      />
                    )}
                  </div>
                );
              };

              return (
                <React.Fragment key={index}>
                  {renderSegment(segment.x, segment.y, 1)}
                  {wrapSegments.map((wrap) => (
                    <React.Fragment key={wrap.key}>
                      {renderSegment(wrap.x, wrap.y, 0.6)}
                    </React.Fragment>
                  ))}
                  {fillers}
                </React.Fragment>
              );
            })}

            {/* Render Foods */}
            {foods.map((food, index) => (
              <div
                key={`food-${index}-${food.x}-${food.y}`}
                className="absolute flex items-center justify-center"
                style={{
                  width: `${100 / GRID_SIZE}%`,
                  height: `${100 / GRID_SIZE}%`,
                  left: `${food.x * (100 / GRID_SIZE)}%`,
                  top: `${food.y * (100 / GRID_SIZE)}%`,
                  zIndex: 1,
                }}
              >
                <div className="relative w-full h-full animate-bounce">
                  <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl animate-pulse" />
                  <img
                    src="/noto--red-apple.svg"
                    alt="Apple"
                    className="relative w-full h-full object-contain drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                    style={{
                      filter: "brightness(1.2) contrast(1.1)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </main>

        <footer className="text-center text-gray-500 text-[10px] md:text-xs mt-2 md:mt-8 space-y-1 md:space-y-2 mb-2 md:mb-0">
          <p className="text-gray-400 hidden md:block">Pressione <span className="text-teal-400 font-bold">ESPAÇO</span> para pausar/continuar</p>
          <div className="flex justify-center gap-2 md:gap-4 text-[9px] md:text-[10px] flex-wrap px-2 md:px-4">
            <span className="hidden md:inline">🎮 Controles: ↑↓←→ ou WASD</span>
            <span className="md:hidden">🎮 Use os botões abaixo</span>
            <span>🍎 Colete maçãs</span>
          </div>
        </footer>
      </div>

      {/* Mobile Controls */}
      <MobileControls
        onDirectionChange={handleDirectionChange}
        currentDirection={direction}
        disabled={gameState !== "PLAYING"}
      />
    </div>
  );
};

export default App;
