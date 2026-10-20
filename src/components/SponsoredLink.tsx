/** Non-layout Adsterra SmartLink - text only, new tab. */
export function SponsoredLink(props: { className?: string }) {
  const className = props.className || '';
  const href = 'https://arwf.org/4/cef7454bbf679decd8d39f04097ea479';
  return (
    <p className={'text-center text-xs text-stone-400 dark:text-stone-500 ' + className}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="underline hover:text-stone-600 dark:hover:text-stone-300"
      >
        Sponsored
      </a>
    </p>
  );
}
