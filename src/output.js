import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import { htmlToMarkdown } from './converter.js';
import { extractContent } from './extractor.js';
import { verboseLog } from './logger.js';

export async function generateOutput(pages, options) {
  const { output, startUrl } = options;

  const processedPages = pages.map(page => {
    const html = typeof page.html === 'string' ? page.html : '';
    const $ = cheerio.load(html);
    const { title, content } = extractContent($);
    const contentHtml = typeof content?.html === 'function' ? content.html() : '';
    const markdown = htmlToMarkdown(contentHtml, page.url);

    return {
      url: page.url,
      title,
      markdown: markdown.trim()
    };
  });

  const content = formatOutput(processedPages, startUrl);
  await writeToFile(content, output);

  return processedPages;
}

function formatOutput(pages, startUrl) {
  const docName = extractDocName(startUrl);
  const timestamp = new Date().toISOString();

  let output = '';

  output += `# ${docName}\n\n`;
  output += `**Source:** ${startUrl}\n`;
  output += `**Generated:** ${timestamp}\n`;
  output += `**Pages Crawled:** ${pages.length}\n\n`;
  output += '---\n\n';
  output += generateTableOfContents(pages);
  output += '---\n\n';

  for (const page of pages) {
    output += createPageSection(page);
  }

  return output;
}

function extractDocName(url) {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.hostname.split('.');
    return parts.slice(0, -1).join('.').replace(/-/g, ' ');
  } catch {
    return 'Documentation';
  }
}

function generateTableOfContents(pages) {
  let toc = '## Table of Contents\n\n';

  for (const page of pages) {
    const slug = createSlug(page.title);
    toc += `- [${page.title}](#${slug})\n`;
  }

  toc += '\n';
  return toc;
}

function createPageSection(page) {
  let section = '';
  section += `## ${page.title}\n\n`;
  section += `**Source URL:** ${page.url}\n\n`;
  section += page.markdown ? `${page.markdown}\n` : '';
  section += '\n---\n\n';

  return section;
}

function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

async function writeToFile(content, filepath) {
  const dir = path.dirname(filepath);
  
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.warn(`Failed to create directory ${dir}:`, error.message);
  }

  const tempPath = `${filepath}.tmp`;
  
  try {
    await fs.writeFile(tempPath, content, 'utf8');
    await fs.rename(tempPath, filepath);
    verboseLog(`Written ${content.length} characters to ${filepath}`);
  } catch (error) {
    try {
      await fs.unlink(tempPath);
    } catch (unlinkError) {
      verboseLog(`Failed to delete temp file: ${unlinkError.message}`);
    }
    throw error;
  }
}
