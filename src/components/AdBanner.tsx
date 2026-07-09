import { useEffect, useRef } from 'react';

const AD_SCRIPT_SRC = 'https://pl30266296.effectivecpmnetwork.com/a7e9174df967c6cbfe2fac56776ae229/invoke.js';
const AD_CONTAINER_ID = 'container-a7e9174df967c6cbfe2fac56776ae229';

export function AdBanner() {
  const injected = useRef(false);

  useEffect(() => {
    // Guard against StrictMode double-invoke and re-renders
    if (injected.current) return;
    if (document.querySelector(`script[src="${AD_SCRIPT_SRC}"]`)) {
      injected.current = true;
      return;
    }
    injected.current = true;

    const script = document.createElement('script');
    script.src = AD_SCRIPT_SRC;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    document.head.appendChild(script);
  }, []);

  return (
    <div className="flex flex-col items-center w-full py-1">
      <p className="text-[10px] text-stone-300 dark:text-stone-600 uppercase tracking-widest mb-1.5 font-medium select-none">
        Advertisement
      </p>
      <div id={AD_CONTAINER_ID} className="w-full" />
    </div>
  );
}
