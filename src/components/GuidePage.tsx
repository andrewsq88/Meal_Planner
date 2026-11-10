import type { ReactNode } from 'react';
import { Moon, Sun, UtensilsCrossed } from 'lucide-react';
import type { GuidePageCopy } from '../content/guides';
import { parseBlocks, type Block } from '../content/guide-model';
import { GuideBanner, useGuideBanners } from './GuideBanners';
import { SiteFooter } from './SiteFooter';

interface GuidePageProps {
  page: GuidePageCopy;
  pathname: string;
  dark: boolean;
  onToggleDark: () => void;
}

function richText(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((part) => part !== '');
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

function PlannerButton({ label }: { label: string }) {
  return (
    <a
      href="/"
      className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-amber-200 transition-all duration-200 hover:from-amber-600 hover:to-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 sm:w-auto"
    >
      {label}
    </a>
  );
}

function BlockView({
  block,
  page,
  narrow,
}: {
  block: Block;
  page: GuidePageCopy;
  narrow: boolean;
}) {
  if (block.type === 'p' && block.text.startsWith('**[MAIN BUTTON:')) {
    if (!block.text.includes(`"${page.buttonLabel}"`)) {
      throw new Error(`Primary button label does not match the copy for ${page.path}`);
    }
    return <PlannerButton label={page.buttonLabel} />;
  }
  if (block.type === 'p' && block.text.startsWith('**[AD SLOT')) {
    const slot = block.text.match(/AD SLOT (\d+)/)?.[1];
    if (slot !== '1' && slot !== '2') throw new Error(`Unexpected ad marker on ${page.path}`);
    return <GuideBanner index={slot === '1' ? 0 : 1} narrow={narrow} pathname={page.path} />;
  }
  if (block.type === 'h2') {
    return (
      <h2 className="mt-10 text-2xl font-extrabold tracking-tight text-stone-800 dark:text-stone-100">
        {block.text}
      </h2>
    );
  }
  if (block.type === 'h3') {
    return (
      <h3 className="mt-8 text-xl font-bold text-stone-800 dark:text-stone-100">
        {block.text}
      </h3>
    );
  }
  if (block.type === 'p') {
    return <p className="mt-4 text-base leading-relaxed text-stone-700 dark:text-stone-300">{richText(block.text)}</p>;
  }
  if (block.type === 'ul' || block.type === 'checklist') {
    return (
      <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-stone-700 dark:text-stone-300">
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>{richText(item)}</li>
        ))}
      </ul>
    );
  }
  if (block.type === 'ol') {
    return (
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-base leading-relaxed text-stone-700 dark:text-stone-300">
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>{richText(item)}</li>
        ))}
      </ol>
    );
  }
  if (block.type !== 'table') {
    throw new Error(`Unsupported block ${block.type}`);
  }
  return (
    <div className="mt-4 max-w-full overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm text-stone-700 dark:text-stone-300">
        <thead>
          <tr className="border-b border-amber-200 bg-amber-50 dark:border-stone-600 dark:bg-stone-800">
            {block.headers.map((header, headerIndex) => (
              <th key={headerIndex} scope="col" className="px-3 py-2 font-bold text-stone-800 dark:text-stone-100">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-amber-100 dark:border-stone-700">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2 align-top">
                  {richText(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function isLateAd(block: Block): boolean {
  return block.type === 'p' && block.text.startsWith('**[AD SLOT 2');
}

/** Keep both ads in the upper article: one after the button, one after the second section. */
function placeGuideAds(blocks: Block[]): Array<Block | { type: 'ad'; index: 1 }> {
  const source = blocks.filter((block) => !isLateAd(block));
  const headings: number[] = [];
  source.forEach((block, index) => {
    if (block.type === 'h2' && block.text !== 'Frequently asked questions') headings.push(index);
  });
  const sectionStart = headings[1] ?? headings[0];
  let insertAt = source.length;
  if (sectionStart != null) {
    insertAt = sectionStart + 1;
    while (insertAt < source.length && source[insertAt].type !== 'h2') insertAt += 1;
  }
  const laid: Array<Block | { type: 'ad'; index: 1 }> = [];
  source.forEach((block, index) => {
    if (index === insertAt) laid.push({ type: 'ad', index: 1 });
    laid.push(block);
  });
  if (!laid.some((item) => 'index' in item && item.index === 1)) laid.push({ type: 'ad', index: 1 });
  return laid;
}

export function GuidePage({ page, pathname, dark, onToggleDark }: GuidePageProps) {
  const blocks = placeGuideAds(parseBlocks(page.body));
  const narrow = useGuideBanners(pathname);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-rose-50/20 dark:from-stone-900 dark:via-stone-900 dark:to-stone-900 transition-colors duration-300 flex flex-col">
      <header className="bg-white/80 dark:bg-stone-900/90 backdrop-blur-sm border-b border-amber-100 dark:border-stone-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <UtensilsCrossed className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span>
              <span className="block text-xl font-extrabold text-stone-800 dark:text-stone-100 leading-tight">Weekly Menu</span>
              <span className="block text-xs text-stone-400 dark:text-stone-500 font-medium">Weekly meal planner</span>
            </span>
          </a>
          <button
            type="button"
            onClick={onToggleDark}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-stone-700 border border-amber-100 dark:border-stone-700 bg-amber-50 dark:bg-stone-800 transition-all duration-200"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="flex-1">
        <article className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
              <li>
                <a
                  href="/"
                  className="underline decoration-stone-300 underline-offset-2 hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:decoration-stone-600 dark:hover:text-stone-100"
                >
                  Weekly Meal Planner
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-stone-700 dark:text-stone-200">{page.h1}</li>
            </ol>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-800 dark:text-stone-100 leading-tight tracking-tight text-balance">
            {page.h1}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-stone-700 dark:text-stone-300">
            <strong>Short answer:</strong> {page.shortAnswer}
          </p>
          {blocks.map((block, index) => (
            'type' in block && block.type === 'ad' ? (
              <GuideBanner key={index} index={1} narrow={narrow} pathname={page.path} />
            ) : (
              <BlockView key={index} block={block as Block} page={page} narrow={narrow} />
            )
          ))}
        </article>
      </main>

      <SiteFooter
        pathname={pathname}
        className="border-t border-amber-100 dark:border-stone-700 py-5"
      />
    </div>
  );
}
