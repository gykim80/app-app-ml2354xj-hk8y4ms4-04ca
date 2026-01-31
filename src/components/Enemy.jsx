import { Skull } from 'lucide-react';

export default function Enemy({ x, y, size, health, maxHealth, id }) {
  const healthPercentage = (health / maxHealth) * 100;
  
  return (
    <div
      className="absolute transition-transform duration-100"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* 적 캐릭터 */}
      <div className="w-full h-full bg-gradient-to-br from-[#8b0000] to-[#4a0e0e] rounded-lg shadow-lg border-2 border-red-900 flex items-center justify-center">
        <Skull className="text-red-200" size={size * 0.6} />
      </div>
      
      {/* 체력 바 */}
      {health < maxHealth && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-12 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
          <div
            className="h-1.5 bg-gradient-to-r from-red-500 to-red-700 transition-all duration-200"
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
      )}
    </div>
  );
}