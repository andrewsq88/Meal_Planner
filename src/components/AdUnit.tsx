import { useEffect, useRef } from 'react';

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
}

export function AdUnit(props: AdUnitProps) {
  const slot = props.slot;
  const format = props.format || 'auto';
  const className = props.className || '';
  const insRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);
  const minH = format === 'rectangle' ? 250 : 90;

  useEffect(() => {
    if (insRef.current && !pushedRef.current) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        pushedRef.current = true;
      } catch {
        // AdSense not loaded yet
      }
    }
  }, []);

  return (
    <div
      className={'ad-container ' + className}
      aria-hidden="true"
      style={{ minHeight: minH, minWidth: 320 }}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', minHeight: minH }}
        data-ad-client="ca-pub-2857342591276131"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
