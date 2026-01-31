import { useState, useCallback, useRef, useEffect } from 'react';
import { Zap, Pause, Play, RotateCcw } from 'lucide-react';
import Player from './Player';
import Enemy from './Enemy';
import { useGameLoop, useKeyboardControls } from '../hooks/useGameLoop';
import {
  checkCollision,
  getNormalizedDirection,
  getDistance,
  calculateLevel,
  getExpForNextLevel,
  getSpawnPosition,
  getSpawnInterval,
  getPlayerStats
} from '../utils/gameLogic';

export default function GameCanvas() {
  const [gameState, setGameState] = useState('menu'); // menu, playing, paused, gameOver
  const [player, setPlayer] = useState({
    x: 400,
    y: 300,
    size: 40,
    health: 100,
    maxHealth: 100,
    exp: 0,
    level: 1
  });
  const [enemies, setEnemies] = useState([]);
  const [projectiles, setProjectiles] = useState([]);
  const [score, setScore] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  
  const lastAttackTime = useRef(0);
  const lastSpawnTime = useRef(0);
  const enemyIdCounter = useRef(0);
  const { getMovementInput } = useKeyboardControls();
  
  const gameWidth = 800;
  const gameHeight = 600;
  
  // 게임 초기화
  const initGame = useCallback(() => {
    setPlayer({
      x: gameWidth / 2,
      y: gameHeight / 2,
      size: 40,
      health: 100,
      maxHealth: 100,
      exp: 0,
      level: 1
    });
    setEnemies([]);
    setProjectiles([]);
    setScore(0);
    setGameTime(0);
    lastAttackTime.current = 0;
    lastSpawnTime.current = 0;
    enemyIdCounter.current = 0;
    setGameState('playing');
  }, []);
  
  // 게임 루프 콜백
  const gameLoop = useCallback((deltaTime) => {
    const dt = deltaTime / 1000; // 초 단위로 변환
    const currentTime = performance.now();
    
    setGameTime(prev => prev + dt);
    
    // 플레이어 이동
    const movement = getMovementInput();
    const stats = getPlayerStats(player.level);
    const speed = stats.speed * dt;
    
    setPlayer(prev => {
      let newX = prev.x;
      let newY = prev.y;
      
      if (movement.up) newY -= speed;
      if (movement.down) newY += speed;
      if (movement.left) newX -= speed;
      if (movement.right) newX += speed;
      
      // 화면 경계 제한
      newX = Math.max(prev.size / 2, Math.min(gameWidth - prev.size / 2, newX));
      newY = Math.max(prev.size / 2, Math.min(gameHeight - prev.size / 2, newY));
      
      return { ...prev, x: newX, y: newY };
    });
    
    // 적 생성
    const spawnInterval = getSpawnInterval(player.level);
    if (currentTime - lastSpawnTime.current > spawnInterval) {
      const spawnPos = getSpawnPosition(gameWidth, gameHeight);
      const newEnemy = {
        id: enemyIdCounter.current++,
        x: spawnPos.x,
        y: spawnPos.y,
        size: 30,
        health: 30,
        maxHealth: 30,
        speed: 50 + player.level * 5
      };
      setEnemies(prev => [...prev, newEnemy]);
      lastSpawnTime.current = currentTime;
    }
    
    // 적 이동 (플레이어 추적)
    setEnemies(prev => 
      prev.map(enemy => {
        const direction = getNormalizedDirection(enemy.x, enemy.y, player.x, player.y);
        return {
          ...enemy,
          x: enemy.x + direction.x * enemy.speed * dt,
          y: enemy.y + direction.y * enemy.speed * dt
        };
      })
    );
    
    // 자동 공격
    if (currentTime - lastAttackTime.current > stats.attackCooldown) {
      const nearestEnemy = enemies.reduce((nearest, enemy) => {
        const dist = getDistance(player.x, player.y, enemy.x, enemy.y);
        if (dist < stats.attackRange && (!nearest || dist < nearest.dist)) {
          return { enemy, dist };
        }
        return nearest;
      }, null);
      
      if (nearestEnemy) {
        const direction = getNormalizedDirection(
          player.x,
          player.y,
          nearestEnemy.enemy.x,
          nearestEnemy.enemy.y
        );
        
        setProjectiles(prev => [...prev, {
          id: Date.now(),
          x: player.x,
          y: player.y,
          vx: direction.x * 400,
          vy: direction.y * 400,
          damage: stats.damage,
          size: 8
        }]);
        
        lastAttackTime.current = currentTime;
      }
    }
    
    // 발사체 이동
    setProjectiles(prev =>
      prev
        .map(proj => ({
          ...proj,
          x: proj.x + proj.vx * dt,
          y: proj.y + proj.vy * dt
        }))
        .filter(proj =>
          proj.x >= 0 && proj.x <= gameWidth &&
          proj.y >= 0 && proj.y <= gameHeight
        )
    );
    
    // 발사체와 적 충돌
    setProjectiles(prevProj => {
      const remainingProj = [];
      const hitEnemies = new Set();
      
      prevProj.forEach(proj => {
        let hit = false;
        enemies.forEach(enemy => {
          if (!hitEnemies.has(enemy.id) && getDistance(proj.x, proj.y, enemy.x, enemy.y) < enemy.size / 2) {
            hitEnemies.add(enemy.id);
            hit = true;
            
            setEnemies(prev =>
              prev.map(e =>
                e.id === enemy.id
                  ? { ...e, health: e.health - proj.damage }
                  : e
              ).filter(e => {
                if (e.health <= 0) {
                  setScore(s => s + 10);
                  setPlayer(p => ({ ...p, exp: p.exp + 20 }));
                  return false;
                }
                return true;
              })
            );
          }
        });
        
        if (!hit) remainingProj.push(proj);
      });
      
      return remainingProj;
    });
    
    // 플레이어와 적 충돌
    enemies.forEach(enemy => {
      if (checkCollision(player, enemy)) {
        setPlayer(prev => {
          const newHealth = prev.health - 0.5;
          if (newHealth <= 0) {
            setGameState('gameOver');
          }
          return { ...prev, health: Math.max(0, newHealth) };
        });
      }
    });
    
    // 레벨업 체크
    setPlayer(prev => {
      const newLevel = calculateLevel(prev.exp);
      if (newLevel > prev.level) {
        const newStats = getPlayerStats(newLevel);
        return {
          ...prev,
          level: newLevel,
          maxHealth: newStats.maxHealth,
          health: newStats.maxHealth
        };
      }
      return prev;
    });
  }, [player.x, player.y, player.level, enemies, getMovementInput]);
  
  useGameLoop(gameLoop, gameState === 'playing');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="relative">
        {/* 게임 화면 */}
        <div
          className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl overflow-hidden border-4 border-[#4a0e0e]"
          style={{ width: `${gameWidth}px`, height: `${gameHeight}px` }}
        >
          {/* 배경 그리드 */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(#8b0000 1px, transparent 1px), linear-gradient(90deg, #8b0000 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}
          />
          
          {gameState === 'menu' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-50">
              <h1 className="text-6xl font-bold text-[#ffd700] mb-4 animate-pulse">뱀파이어 서바이버</h1>
              <p className="text-gray-300 mb-8 text-lg">몬스터를 물리치고 살아남으세요!</p>
              <button
                onClick={initGame}
                className="bg-gradient-to-r from-[#8b0000] to-[#4a0e0e] text-white px-8 py-4 rounded-lg font-bold text-xl hover:scale-110 transition-transform shadow-lg border-2 border-[#ffd700]"
              >
                <Play className="inline mr-2" size={24} />
                게임 시작
              </button>
              <div className="mt-8 text-gray-400 text-sm">
                <p>조작: WASD 또는 화살표 키로 이동</p>
                <p>자동 공격으로 적을 물리치세요</p>
              </div>
            </div>
          )}
          
          {gameState === 'paused' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-50">
              <h2 className="text-4xl font-bold text-[#ffd700] mb-8">일시정지</h2>
              <button
                onClick={() => setGameState('playing')}
                className="bg-gradient-to-r from-[#8b0000] to-[#4a0e0e] text-white px-6 py-3 rounded-lg font-bold hover:scale-110 transition-transform"
              >
                <Play className="inline mr-2" />
                계속하기
              </button>
            </div>
          )}
          
          {gameState === 'gameOver' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 z-50">
              <h2 className="text-5xl font-bold text-red-500 mb-4 animate-pulse">게임 오버</h2>
              <div className="text-[#ffd700] text-2xl mb-2">최종 점수: {score}</div>
              <div className="text-gray-300 mb-8">레벨: {player.level} | 생존 시간: {Math.floor(gameTime)}초</div>
              <button
                onClick={initGame}
                className="bg-gradient-to-r from-[#8b0000] to-[#4a0e0e] text-white px-6 py-3 rounded-lg font-bold hover:scale-110 transition-transform border-2 border-[#ffd700]"
              >
                <RotateCcw className="inline mr-2" />
                다시 시작
              </button>
            </div>
          )}
          
          {gameState === 'playing' && (
            <>
              {/* 플레이어 */}
              <Player {...player} />
              
              {/* 적들 */}
              {enemies.map(enemy => (
                <Enemy key={enemy.id} {...enemy} />
              ))}
              
              {/* 발사체 */}
              {projectiles.map(proj => (
                <div
                  key={proj.id}
                  className="absolute bg-[#ffd700] rounded-full shadow-lg"
                  style={{
                    left: `${proj.x}px`,
                    top: `${proj.y}px`,
                    width: `${proj.size}px`,
                    height: `${proj.size}px`,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 10px #ffd700'
                  }}
                >
                  <Zap className="text-yellow-900" size={proj.size} />
                </div>
              ))}
            </>
          )}
        </div>
        
        {/* UI 오버레이 */}
        {gameState === 'playing' && (
          <>
            {/* 상단 정보 */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-40">
              <div className="bg-black bg-opacity-70 px-4 py-2 rounded-lg border-2 border-[#ffd700]">
                <div className="text-[#ffd700] font-bold text-lg">점수: {score}</div>
                <div className="text-gray-300 text-sm">시간: {Math.floor(gameTime)}초</div>
              </div>
              
              <button
                onClick={() => setGameState('paused')}
                className="bg-black bg-opacity-70 px-3 py-2 rounded-lg border-2 border-gray-600 hover:border-[#ffd700] transition-colors"
              >
                <Pause className="text-white" size={20} />
              </button>
            </div>
            
            {/* 경험치 바 */}
            <div className="absolute bottom-4 left-4 right-4 z-40">
              <div className="bg-black bg-opacity-70 px-4 py-3 rounded-lg border-2 border-[#ffd700]">
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>레벨 {player.level}</span>
                  <span>{player.exp} / {getExpForNextLevel(player.level)} EXP</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#ffd700] to-yellow-500 transition-all duration-300"
                    style={{ width: `${(player.exp % 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}