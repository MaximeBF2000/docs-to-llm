import TurndownService from 'turndown';

let turndownService = null;

function getTurndownService() {
  if (!turndownService) {
    turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      linkStyle: 'inlined',
      emDelimiter: '*',
      strongDelimiter: '**'
    });

    turndownService.addRule('strikethrough', {
      filter: ['s', 'del'],
      replacement: content => `~~${content}~~`
    });

    turndownService.addRule('codeBlock', {
      filter: (node, options) => {
        return node.nodeName === 'PRE' &&
               node.firstChild &&
               node.firstChild.nodeName === 'CODE';
      },
      replacement: (content, node) => {
        const language = node.firstChild.getAttribute('class')?.match(/language-(\w+)/)?.[1] || '';
        return `\n\`\`\`${language}\n${content}\n\`\`\`\n`;
      }
    });
  }

  return turndownService;
}

export function htmlToMarkdown(html, url) {
  const service = getTurndownService();
  try {
    if (typeof html !== 'string' || html.trim().length === 0) {
      return '';
    }
    return service.turndown(html);
  } catch (error) {
    console.warn(`Failed to convert HTML to Markdown for ${url}:`, error.message);
    return '';
  }
}

export function configureTurndown(options = {}) {
  turndownService = null;
  return getTurndownService();
}
