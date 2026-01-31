import { useEffect, useRef } from 'react';

// 게임 루프를 관리하는 커스텀 훅
export const useGameLoop = (callback, isRunning) => {
  const requestRef = useRef();
  const previousTimeRef = useRef();
  
  useEffect(() => {
    if (!isRunning) {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      return;
    }
    
    const animate = (time) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callback(deltaTime);
      }
      
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback, isRunning]);
};

// 키보드 입력을 관리하는 커스텀 훅
export const useKeyboardControls = () => {
  const keysPressed = useRef({});
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    
    const handleKeyUp = (e) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  const getMovementInput = () => {
    const keys = keysPressed.current;
    return {
      up: keys['w'] || keys['arrowup'],
      down: keys['s'] || keys['arrowdown'],
      left: keys['a'] || keys['arrowleft'],
      right: keys['d'] || keys['arrowright']
    };
  };
  
  return { getMovementInput };
};