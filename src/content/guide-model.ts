import type { GuidePageCopy } from './guides';

export type Block =
  | { type: 'h2' | 'h3' | 'p'; text: string }
  | { type: 'ul' | 'ol' | 'checklist'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] };

export interface GuideStep {
  position: number;
  name: string;
  text: string;
}

export interface GuideFaq {
  question: string;
  answer: string;
}

export function plainText(value: string): string {
  return value.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\s+/g, ' ').trim();
}

function tableCells(line: string): string[] {
  return line.split('|').slice(1, -1).map((cell) => cell.trim());
}

function isSeparator(line: string): boolean {
  const cells = tableCells(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

export function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === '') {
      index += 1;
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4).trim() });
      index += 1;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3).trim() });
      index += 1;
      continue;
    }
    if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].startsWith('|')) {
        tableLines.push(lines[index]);
        index += 1;
      }
      const contentLines = tableLines.filter((row) => !isSeparator(row));
      const [header, ...rows] = contentLines;
      if (!header) throw new Error('Table is missing a header row');
      blocks.push({
        type: 'table',
        headers: tableCells(header),
        rows: rows.map(tableCells),
      });
      continue;
    }
    if (line.startsWith('- [ ]')) {
      const items: string[] = [];
      while (index < lines.length && lines[index].startsWith('- [ ]')) {
        items.push(lines[index].replace(/^- \[ \]\s*/, ''));
        index += 1;
      }
      blocks.push({ type: 'checklist', items });
      continue;
    }
    if (line.startsWith('- ')) {
      const items: string[] = [];
      while (index < lines.length && lines[index].startsWith('- ')) {
        items.push(lines[index].slice(2));
        index += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, ''));
        index += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length
      && lines[index].trim() !== ''
      && !lines[index].startsWith('#')
      && !lines[index].startsWith('|')
      && !lines[index].startsWith('- ')
      && !/^\d+\.\s/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: 'p', text: paragraph.join(' ') });
  }

  return blocks;
}

function stepFromItem(item: string): { name: string; text: string } {
  const match = item.match(/^\*\*([^*]+)\*\*\s*([\s\S]*)$/);
  if (!match) {
    const text = plainText(item);
    return { name: text, text };
  }
  const name = match[1].trim();
  const rest = plainText(match[2]);
  return { name, text: rest ? `${name} ${rest}` : name };
}

function visibleText(block: Block): string {
  if (block.type === 'p' && block.text.startsWith('**[')) return '';
  if (block.type === 'p' || block.type === 'h2' || block.type === 'h3') return plainText(block.text);
  if (block.type === 'ul' || block.type === 'ol' || block.type === 'checklist') {
    return block.items.map(plainText).join(' ');
  }
  return '';
}

function orderedSteps(items: string[]): GuideStep[] {
  return items.map((item, index) => ({ position: index + 1, ...stepFromItem(item) }));
}

export function guideSteps(blocks: Block[]): GuideStep[] {
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.type !== 'h2' || !/^(how to|six steps|five steps)/i.test(block.text)) continue;
    for (let next = index + 1; next < blocks.length; next += 1) {
      const following = blocks[next];
      if (following.type === 'h2' || following.type === 'h3') break;
      if (following.type === 'ol') return orderedSteps(following.items);
    }
  }

  const steps: GuideStep[] = [];
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.type !== 'h2' || !/^Step \d+:/i.test(block.text)) continue;
    const parts: string[] = [];
    for (let next = index + 1; next < blocks.length; next += 1) {
      const following = blocks[next];
      if (following.type === 'h2' || following.type === 'h3') break;
      const text = visibleText(following);
      if (text) parts.push(text);
    }
    steps.push({ position: steps.length + 1, name: block.text, text: parts.join(' ') });
  }
  if (steps.length === 0) throw new Error('Guide is missing its how-to steps');
  return steps;
}

export function guideFaqs(blocks: Block[]): GuideFaq[] {
  const start = blocks.findIndex((block) => block.type === 'h2' && block.text === 'Frequently asked questions');
  if (start < 0) return [];
  const faqs: GuideFaq[] = [];
  for (let index = start + 1; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.type === 'h2') break;
    if (block.type !== 'h3') continue;
    const answer = blocks[index + 1];
    if (!answer || answer.type !== 'p') throw new Error(`Question has no answer: ${block.text}`);
    faqs.push({ question: block.text, answer: plainText(answer.text) });
  }
  if (faqs.length !== 5) throw new Error(`Expected 5 questions, found ${faqs.length}`);
  return faqs;
}

export function guideGraph(page: GuidePageCopy, origin: string) {
  const blocks = parseBlocks(page.body);
  const steps = guideSteps(blocks);
  const faqs = guideFaqs(blocks);
  const url = `${origin}${page.path}`;
  const nodes: Record<string, unknown>[] = [
    {
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: page.h1,
      description: page.description,
      url,
      mainEntityOfPage: url,
      inLanguage: 'en',
      isPartOf: { '@id': `${origin}/#website` },
      author: { '@id': `${origin}/#organization` },
      publisher: { '@id': `${origin}/#organization` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Weekly Meal Planner',
          item: `${origin}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: page.h1,
          item: url,
        },
      ],
    },
    {
      '@type': 'HowTo',
      '@id': `${url}#howto`,
      name: page.h1,
      description: page.shortAnswer,
      url,
      step: steps.map((step) => ({
        '@type': 'HowToStep',
        position: step.position,
        name: step.name,
        text: step.text,
      })),
    },
  ];
  if (faqs.length > 0) {
    nodes.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      url,
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }
  return nodes;
}
