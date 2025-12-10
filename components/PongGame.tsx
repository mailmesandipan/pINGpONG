import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Ball, Paddle, Theme } from '../types';

interface PongGameProps {
  theme: Theme;
}

const PongGame: React.FC<PongGameProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  
  // Game Objects Refs (Mutable for loop performance)
  const ballRef = useRef<Ball>({ x: 0, y: 0, dx: 0, dy: 0, radius: 8, speed: 6 });
  const playerRef = useRef<Paddle>({ x: 0, y: 0, width: 100, height: 12, score: 0 });
  const aiRef = useRef<Paddle>({ x: 0, y: 0, width: 100, height: 12, score: 0 });
  
  const requestRef = useRef<number>();
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  
  // Initialize positions based on canvas size
  const initGame = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    // Set resolution match display size
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Reset Ball
    ballRef.current = {
      x: centerX,
      y: centerY,
      dx: 0, // Start still
      dy: 0,
      radius: 8,
      speed: 7
    };
    
    // Reset Paddles
    // Player at Bottom
    playerRef.current.x = centerX - 50;
    playerRef.current.y = canvas.height - 30;
    playerRef.current.width = 100;
    
    // AI at Top
    aiRef.current.x = centerX - 50;
    aiRef.current.y = 20;
    aiRef.current.width = 100;
    
  }, []);

  const launchBall = useCallback(() => {
    const dirX = Math.random() > 0.5 ? 1 : -1;
    const dirY = Math.random() > 0.5 ? 1 : -1;
    ballRef.current.dx = (Math.random() * 2 + 2) * dirX; // Random X Start
    ballRef.current.dy = 5 * dirY; // Consistent Y Start
  }, []);

  const update = () => {
    if (gameState !== GameState.PLAYING || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ball = ballRef.current;
    const player = playerRef.current;
    const ai = aiRef.current;

    // --- Player Movement (Left / Right Arrow) ---
    const speed = 8;
    if (keysPressed.current['ArrowLeft']) {
      player.x -= speed;
    }
    if (keysPressed.current['ArrowRight']) {
      player.x += speed;
    }
    
    // Clamp Player
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // --- AI Movement ---
    // Simple tracking with delay/error
    const aiCenter = ai.x + ai.width / 2;
    const diff = ball.x - aiCenter;
    const aiSpeed = 5.5; // Slightly slower than player
    
    if (Math.abs(diff) > 10) { // Deadzone
      if (diff > 0) ai.x += aiSpeed;
      else ai.x -= aiSpeed;
    }
    
    // Clamp AI
    if (ai.x < 0) ai.x = 0;
    if (ai.x + ai.width > canvas.width) ai.x = canvas.width - ai.width;

    // --- Ball Movement ---
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall Collisions (Left/Right)
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.dx *= -1;
    }
    if (ball.x + ball.radius > canvas.width) {
      ball.x = canvas.width - ball.radius;
      ball.dx *= -1;
    }

    // Paddle Collisions
    // Player (Bottom)
    if (
      ball.y + ball.radius > player.y &&
      ball.y - ball.radius < player.y + player.height &&
      ball.x > player.x &&
      ball.x < player.x + player.width
    ) {
      // Calculate hit position relative to paddle center to change angle
      let collidePoint = ball.x - (player.x + player.width / 2);
      collidePoint = collidePoint / (player.width / 2);
      
      const angle = collidePoint * (Math.PI / 4); // Max 45 degrees
      
      const direction = -1; // Going Up
      ball.dx = ball.speed * Math.sin(angle);
      ball.dy = direction * ball.speed * Math.cos(angle);
      
      // Speed up slightly
      ball.speed += 0.2;
      ball.y = player.y - ball.radius - 1; // Prevent sticking
    }

    // AI (Top)
    if (
      ball.y - ball.radius < ai.y + ai.height &&
      ball.y + ball.radius > ai.y &&
      ball.x > ai.x &&
      ball.x < ai.x + ai.width
    ) {
      let collidePoint = ball.x - (ai.x + ai.width / 2);
      collidePoint = collidePoint / (ai.width / 2);
      
      const angle = collidePoint * (Math.PI / 4);
      
      const direction = 1; // Going Down
      ball.dx = ball.speed * Math.sin(angle);
      ball.dy = direction * ball.speed * Math.cos(angle);
      
      ball.speed += 0.2;
      ball.y = ai.y + ai.height + ball.radius + 1;
    }

    // --- Scoring ---
    if (ball.y - ball.radius < 0) {
      player.score++;
      resetRound();
    } else if (ball.y + ball.radius > canvas.height) {
      ai.score++;
      resetRound();
    }
  };

  const resetRound = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    ballRef.current.x = canvas.width / 2;
    ballRef.current.y = canvas.height / 2;
    ballRef.current.dx = 0;
    ballRef.current.dy = 0;
    ballRef.current.speed = 7;
    
    // Brief pause before launch
    setTimeout(() => launchBall(), 1000);
  };

  const draw = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Screen (or draw background image)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Default Grid if no background
    if (!theme.backgroundImage) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
    }

    // Draw Score
    ctx.font = '40px "Press Start 2P"';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.textAlign = 'center';
    ctx.fillText(aiRef.current.score.toString(), canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillText(playerRef.current.score.toString(), canvas.width / 2, canvas.height / 2 + 80);

    // Draw Paddles
    ctx.shadowBlur = 10;
    
    // AI Paddle (Red/Pink)
    ctx.fillStyle = '#f43f5e'; 
    ctx.shadowColor = '#f43f5e';
    ctx.fillRect(aiRef.current.x, aiRef.current.y, aiRef.current.width, aiRef.current.height);
    
    // Player Paddle (Cyan/Blue)
    ctx.fillStyle = '#0ea5e9';
    ctx.shadowColor = '#0ea5e9';
    ctx.fillRect(playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);

    // Draw Ball
    ctx.beginPath();
    ctx.arc(ballRef.current.x, ballRef.current.y, ballRef.current.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.closePath();
    
    ctx.shadowBlur = 0; // Reset
  };

  const loop = useCallback(() => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(loop);
  }, [gameState, initGame]); // initGame is stable, but adding to deps for correctness

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [loop]);

  // Handle Resize and Initialization
  useEffect(() => {
    const handleResize = () => {
      initGame();
    };
    window.addEventListener('resize', handleResize);
    initGame(); // Initial setup on mount

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [initGame]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
      // Start game on key press if in menu
      if (gameState === GameState.MENU && (e.key === 'Enter' || e.key === ' ')) {
        setGameState(GameState.PLAYING);
        launchBall();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, launchBall]);


  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Background Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center -z-10 transition-all duration-500"
        style={{ 
          backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : 'none',
          backgroundColor: theme.backgroundImage ? 'transparent' : '#0f172a'
        }} 
      />
      {/* Overlay for grid if no background */}
      {!theme.backgroundImage && (
        <div className="absolute inset-0 -z-10 opacity-10 pointer-events-none" 
             style={{ 
                backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)',
                backgroundSize: '40px 40px'
             }}
        />
      )}

      <canvas ref={canvasRef} className="block w-full h-full touch-none" />

      {gameState === GameState.MENU && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10">
          <h1 className="text-5xl md:text-7xl font-arcade text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 mb-8 animate-pulse">
            NEON PONG
          </h1>
          <p className="text-white text-xl mb-4 font-arcade text-center">Press ENTER to Start</p>
          <div className="flex gap-4 text-slate-400 text-sm">
            <span className="border border-slate-600 px-2 py-1 rounded">← Left</span>
            <span className="border border-slate-600 px-2 py-1 rounded">Right →</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PongGame;