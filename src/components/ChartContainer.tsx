import React, { useRef, useState, useEffect } from 'react';

export function ChartContainer({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasDimensions, setHasDimensions] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    
    let debounceTimer: ReturnType<typeof setTimeout>;
    
    const observer = new ResizeObserver((entries) => {
      // Small debounce to let animations flush
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setHasDimensions(true);
        } else {
          setHasDimensions(false);
        }
      }, 50);
    });
    
    observer.observe(containerRef.current);
    
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setHasDimensions(true);
    }
    
    return () => {
      observer.disconnect();
      clearTimeout(debounceTimer);
    };
  }, []);

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      {hasDimensions ? children : null}
    </div>
  );
}
