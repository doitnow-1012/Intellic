'use client';

import { useEffect, useRef } from 'react';

interface AdSenseProps {
  className?: string;
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
}

export function AdSense({
  className = '',
  slot = '4126889793',
  format = 'auto',
  responsive = true,
}: AdSenseProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isAdPushed = useRef(false);

  useEffect(() => {
    if (!adRef.current || isAdPushed.current) return;

    const tryPushAd = () => {
      try {
        const adsbygoogle = (window as any).adsbygoogle;
        if (adsbygoogle) {
          adsbygoogle.push({});
          isAdPushed.current = true;
          return true;
        }
      } catch (err) {
        console.error('AdSense push error:', err);
      }
      return false;
    };

    // 즉시 시도
    if (tryPushAd()) return;

    // 스크립트 로드 대기 (최대 10초, 500ms 간격)
    let attempts = 0;
    const maxAttempts = 20;
    const interval = setInterval(() => {
      attempts++;
      if (tryPushAd() || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`my-6 w-full overflow-hidden ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          minHeight: '100px',
        }}
        data-ad-client="ca-pub-1491652914340377"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
