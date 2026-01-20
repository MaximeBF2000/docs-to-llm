import axios from 'axios';
import * as cheerio from 'cheerio';
import { isValidUrl, normalizeUrl, isInternalLink, resolveUrl, getDomain } from './utils/url.js';
import { retryWithBackoff } from './utils/retry.js';
import { ConcurrentQueue } from './utils/queue.js';
import { DEFAULTS } from './config.js';
import { verboseLog } from './logger.js';

export async function crawl(startUrl, options = {}) {
  const {
    maxPages = DEFAULTS.maxPages,
    timeout = DEFAULTS.timeout,
    concurrency = DEFAULTS.concurrency,
    excludePatterns = DEFAULTS.excludePatterns,
    includeOnlyPattern = null,
    onProgress = null
  } = options;

  const visitedUrls = new Set();
  const pages = [];
  const queue = [startUrl];
  const baseUrlDomain = getDomain(startUrl);

  reportProgress(onProgress, { visited: visitedUrls.size, queued: queue.length, pages: pages.length, maxPages });

  while (queue.length > 0 && pages.length < maxPages) {
    const currentBatch = queue.splice(0, Math.min(concurrency, queue.length));
    
    const crawlQueue = new ConcurrentQueue(concurrency);

    for (const url of currentBatch) {
      if (visitedUrls.has(normalizeUrl(url))) {
        continue;
      }

      crawlQueue.add(async () => {
        const normalizedUrl = normalizeUrl(url);
        
        if (visitedUrls.has(normalizedUrl)) {
          return null;
        }

        visitedUrls.add(normalizedUrl);

        try {
          const page = await fetchPage(url, timeout);
          if (page) {
            const links = await extractLinks(page.html, url);
            const filteredLinks = filterLinks(links, {
              baseUrl: url,
              baseUrlDomain,
              excludePatterns,
              includeOnlyPattern,
              visitedUrls
            });

            queue.push(...filteredLinks);
            verboseLog(`Crawled: ${url} (found ${filteredLinks.length} new links)`);
            return page;
          }
        } catch (error) {
          console.warn(`Failed to crawl ${url}:`, error.message);
        }

        return null;
      });
    }

    try {
      const batchResults = await crawlQueue.waitForCompletion({ throwOnError: false });
      const validPages = batchResults.filter(page => page !== null);
      pages.push(...validPages);
      reportProgress(onProgress, { visited: visitedUrls.size, queued: queue.length, pages: pages.length, maxPages });
    } catch (error) {
      console.warn('Batch crawl failed:', error.message);
    }
  }

  return pages;
}

function reportProgress(onProgress, stats) {
  if (typeof onProgress !== 'function') {
    return;
  }

  try {
    onProgress(stats);
  } catch (error) {
    console.warn('Progress callback failed:', error.message);
  }
}

export async function fetchPage(url, timeout = 10000) {
  return retryWithBackoff(async () => {
    try {
      const response = await axios.get(url, {
        timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; docs-to-llm/1.0; +https://github.com)'
        }
      });

      if (response.status === 200) {
        const contentType = response.headers['content-type'] || '';
        if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
          verboseLog(`Skipping non-HTML content: ${url} (${contentType})`);
          return null;
        }
        return {
          url: response.request.res.responseUrl || url,
          html: response.data,
          status: response.status
        };
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (error.response) {
        throw new Error(`HTTP ${error.response.status}`);
      }
      throw error;
    }
  }, 3, 1000);
}

export async function extractLinks(html, baseUrl) {
  const $ = cheerio.load(html);
  const links = [];

  $('a[href]').each(function() {
    const href = $(this).attr('href');
    if (!href) return;

    const resolvedUrl = resolveUrl(href, baseUrl);
    if (!resolvedUrl) return;

    if (!isValidUrl(resolvedUrl)) return;

    links.push(resolvedUrl);
  });

  return links;
}

function filterLinks(links, options) {
  const {
    baseUrl,
    baseUrlDomain,
    excludePatterns,
    includeOnlyPattern,
    visitedUrls
  } = options;

  return links.filter(link => {
    const normalizedLink = normalizeUrl(link);

    if (!isLikelyHtmlLink(link)) {
      return false;
    }

    if (visitedUrls.has(normalizedLink)) {
      return false;
    }

    if (!isInternalLink(link, baseUrl)) {
      return false;
    }

    for (const pattern of excludePatterns) {
      const regex = new RegExp(pattern);
      if (regex.test(link)) {
        return false;
      }
    }

    if (includeOnlyPattern) {
      const regex = new RegExp(includeOnlyPattern);
      if (!regex.test(link)) {
        return false;
      }
    }

    return true;
  });
}

function isLikelyHtmlLink(link) {
  try {
    const urlObj = new URL(link);
    const pathname = urlObj.pathname.toLowerCase();
    const blockedExtensions = [
      '.json',
      '.xml',
      '.txt',
      '.pdf',
      '.zip',
      '.tar',
      '.gz',
      '.tgz',
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.svg',
      '.ico',
      '.mp4',
      '.mp3',
      '.webm',
      '.avi',
      '.mov',
      '.woff',
      '.woff2',
      '.ttf',
      '.eot',
      '.map'
    ];

    return !blockedExtensions.some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

export function shouldIncludeUrl(url, options) {
  const {
    baseUrl,
    excludePatterns,
    includeOnlyPattern
  } = options;

  if (!isInternalLink(url, baseUrl)) {
    return false;
  }

  for (const pattern of excludePatterns) {
    const regex = new RegExp(pattern);
    if (regex.test(url)) {
      return false;
    }
  }

  if (includeOnlyPattern) {
    const regex = new RegExp(includeOnlyPattern);
    if (!regex.test(url)) {
      return false;
    }
  }

  return true;
}
