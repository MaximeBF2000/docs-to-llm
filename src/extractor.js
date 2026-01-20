import * as cheerio from 'cheerio';
import { MAIN_CONTENT_SELECTORS, SELECTORS_TO_REMOVE } from './config.js';

export function extractMainContent($root) {
  let mainContent = null;

  for (const selector of MAIN_CONTENT_SELECTORS) {
    const element = $root(selector);
    if (element.length > 0) {
      mainContent = element.first();
      break;
    }
  }

  if (!mainContent) {
    const allElements = $root('body').find('*');
    let maxTextLength = 0;
    let bestElement = null;

    allElements.each(function() {
      const $this = $root(this);
      const textLength = $this.text().trim().length;
      const hasChildren = $this.children().length > 0;

      if (hasChildren && textLength > maxTextLength && textLength < 50000) {
        maxTextLength = textLength;
        bestElement = $this;
      }
    });

    mainContent = bestElement || $root('body');
  }

  return mainContent;
}

export function cleanContent($content) {
  for (const selector of SELECTORS_TO_REMOVE) {
    $content.find(selector).remove();
  }

  return $content;
}

export function extractCodeBlocks($root) {
  const codeBlocks = [];

  $root('pre').each(function() {
    const $pre = $root(this);
    const code = $pre.find('code').text() || $pre.text();
    const language = $pre.find('code').attr('class')?.match(/language-(\w+)/)?.[1] || '';

    codeBlocks.push({ code, language });
  });

  return codeBlocks;
}

export function extractTables($root) {
  const tables = [];

  $root('table').each(function() {
    const $table = $root(this);
    const headers = [];
    const rows = [];

    $table.find('thead th').each(function() {
      headers.push($root(this).text().trim());
    });

    $table.find('tbody tr').each(function() {
      const row = [];
      $root(this).find('td').each(function() {
        row.push($root(this).text().trim());
      });
      if (row.length > 0) {
        rows.push(row);
      }
    });

    if (headers.length > 0 || rows.length > 0) {
      tables.push({ headers, rows });
    }
  });

  return tables;
}

export function extractApiDocs($root) {
  const apiDocs = {
    endpoints: [],
    methods: [],
    properties: []
  };

  $root('pre code').each(function() {
    const code = $root(this).text().trim();

    const methodMatch = code.match(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b/i);
    if (methodMatch) {
      apiDocs.endpoints.push(code);
    }

    const functionMatch = code.match(/^function\s+(\w+)/);
    if (functionMatch) {
      apiDocs.methods.push(functionMatch[1]);
    }

    const constMatch = code.match(/^(const|let|var)\s+(\w+)/);
    if (constMatch) {
      apiDocs.properties.push(constMatch[2]);
    }
  });

  return apiDocs;
}

export function extractTitle($root) {
  const title = $root('title').text().trim();
  const h1 = $root('h1').first().text().trim();
  
  return h1 || title || 'Documentation';
}

export function extractContent($root) {
  const title = extractTitle($root);
  const mainContent = extractMainContent($root);
  const $content = mainContent.clone();

  cleanContent($content);

  return {
    title,
    content: $content
  };
}