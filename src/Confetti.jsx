import { useEffect } from 'react';
import './App.css';

export default function Confetti() {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Confetti animation will complete after 3 seconds
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="confetti-container">
      {Array.from({ length: 50 }).map((_, i) => (
        <div 
          key={i}
          className="confetti"
          style={{
            '--left': `${Math.random() * 100}%`,
            '--animation-delay': `${Math.random() * 2}s`,
            '--color': `hsl(${Math.random() * 360}, 100%, 50%)`,
            '--size': `${Math.random() * 8 + 4}px`,
            '--rotation': `${Math.random() * 360}deg`
          }}
        />
      ))}
    </div>
  );
}