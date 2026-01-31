// 게임 로직 유틸리티 함수들

// 두 점 사이의 거리 계산
export const getDistance = (x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

// 두 객체 간 충돌 감지 (AABB - Axis-Aligned Bounding Box)
export const checkCollision = (obj1, obj2) => {
  return (
    obj1.x < obj2.x + obj2.size &&
    obj1.x + obj1.size > obj2.x &&
    obj1.y < obj2.y + obj2.size &&
    obj1.y + obj1.size > obj2.y
  );
};

// 정규화된 방향 벡터 계산
export const getNormalizedDirection = (fromX, fromY, toX, toY) => {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return { x: 0, y: 0 };
  
  return {
    x: dx / distance,
    y: dy / distance
  };
};

// 경험치에 따른 레벨 계산
export const calculateLevel = (exp) => {
  return Math.floor(exp / 100) + 1;
};

// 레벨에 따른 필요 경험치 계산
export const getExpForNextLevel = (level) => {
  return level * 100;
};

// 적 생성 위치 계산 (화면 밖에서 생성)
export const getSpawnPosition = (gameWidth, gameHeight) => {
  const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
  
  switch (side) {
    case 0: // top
      return { x: Math.random() * gameWidth, y: -50 };
    case 1: // right
      return { x: gameWidth + 50, y: Math.random() * gameHeight };
    case 2: // bottom
      return { x: Math.random() * gameWidth, y: gameHeight + 50 };
    case 3: // left
      return { x: -50, y: Math.random() * gameHeight };
    default:
      return { x: 0, y: 0 };
  }
};

// 게임 난이도에 따른 적 스폰 간격 계산
export const getSpawnInterval = (level) => {
  return Math.max(1000 - (level * 50), 300); // 최소 300ms
};

// 플레이어 스탯 계산
export const getPlayerStats = (level) => {
  return {
    maxHealth: 100 + (level - 1) * 20,
    damage: 10 + (level - 1) * 2,
    speed: 200,
    attackRange: 150,
    attackCooldown: 500
  };
};