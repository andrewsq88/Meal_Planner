import { useEffect } from 'react';

const AD_SCRIPT_SRC = 'https://bicea.org/21/a7e9174df967c6cbfe2fac56776ae229';
const AD_CONTAINER_ID = 'container-a7e9174df967c6cbfe2fac56776ae229';

let scriptInjected = false;

/** Adsterra Native Banner (4:1). Injects its script once and reserves the slot. */
export function NativeBanner() {
  useEffect(() => {
    if (scriptInjected) return;
    if (document.querySelector(`script[src="${AD_SCRIPT_SRC}"]`)) {
      scriptInjected = true;
      return;
    }
    scriptInjected = true;

    const script = document.createElement('script');
    script.src = AD_SCRIPT_SRC;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    document.body.appendChild(script);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6" aria-hidden="true">
      <div
        id={AD_CONTAINER_ID}
        style={{
          width: '100%',
          maxWidth: 728,
          marginInline: 'auto',
          aspectRatio: '4 / 1',
          minHeight: 90,
        }}
      />
    </div>
  );
}
