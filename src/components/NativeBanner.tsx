import { useLayoutEffect } from 'react';

const AD_SCRIPT_SRC = 'https://bicea.org/21/a7e9174df967c6cbfe2fac56776ae229';
const AD_CONTAINER_ID = 'container-a7e9174df967c6cbfe2fac56776ae229';

/** Adsterra Native Banner (4:1). Places its script immediately before the slot. */
export function NativeBanner() {
  useLayoutEffect(() => {
    const container = document.getElementById(AD_CONTAINER_ID);
    if (!container || document.querySelector(`script[src="${AD_SCRIPT_SRC}"]`)) return;

    const script = document.createElement('script');
    script.src = AD_SCRIPT_SRC;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    container.insertAdjacentElement('beforebegin', script);
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
