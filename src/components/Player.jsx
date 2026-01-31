import { useMemo } from 'react';
import { Heart } from 'lucide-react';

export default function Player({ x, y, size, health, maxHealth, level }) {
  const healthPercentage = useMemo(() => (health / maxHealth) * 100, [health, maxHealth]);
  
  return (
    <div
      className="absolute transition-transform duration-75"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* 플레이어 캐릭터 */}
      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-lg border-4 border-blue-200 animate-pulse" />
      
      {/* 레벨 표시 */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#ffd700] text-[#4a0e0e] px-3 py-1 rounded-full text-xs font-bold shadow-md whitespace-nowrap">
        레벨 {level}
      </div>
      
      {/* 체력 바 */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 bg-gray-700 rounded-full overflow-hidden border-2 border-gray-600">
        <div
          className="h-2 bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
          style={{ width: `${healthPercentage}%` }}
        />
      </div>
      
      {/* 체력 아이콘 */}
      <Heart
        className="absolute -bottom-7 -left-6 text-red-500 fill-red-500"
        size={12}
      />
    </div>
  );
}