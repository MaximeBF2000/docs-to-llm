import { Command } from 'commander';
import { isValidUrl } from './utils/url.js';
import { setVerbose } from './logger.js';
import { DEFAULTS } from './config.js';
import { execute } from './run.js';

export function createCLI() {
  const program = new Command();

  program
    .name('docs-to-llm')
    .description('CLI tool to crawl documentation websites and aggregate content into a structured llm.txt file')
    .version('1.0.0')
    .argument('<url>', 'Documentation URL to crawl')
    .option('-o, --output <filename>', `Custom output filename (default: ${DEFAULTS.output})`, DEFAULTS.output)
    .option('-m, --max-pages <number>', 'Maximum number of pages to crawl', String(DEFAULTS.maxPages))
    .option('-t, --timeout <milliseconds>', `Request timeout per page in milliseconds (default: ${DEFAULTS.timeout})`, String(DEFAULTS.timeout))
    .option('--exclude <pattern>', 'Exclude URLs matching a regex pattern (can be used multiple times)', collect, [])
    .option('--include-only <pattern>', 'Only include URLs matching a regex pattern')
    .option('-c, --concurrency <number>', `Number of concurrent requests (default: ${DEFAULTS.concurrency})`, String(DEFAULTS.concurrency))
    .option('-v, --verbose', 'Enable detailed logging')
    .action(async (url, options) => {
      try {
        const parsedOptions = await parseOptions(url, options);
        await validateOptions(parsedOptions);
        await execute(url, parsedOptions);
      } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
      }
    });

  return program;
}

function collect(value, previous) {
  return previous.concat([value]);
}

export async function parseOptions(url, options) {
  const parsedOptions = {
    startUrl: url,
    output: options.output,
    maxPages: parseNumber(options.maxPages, DEFAULTS.maxPages),
    timeout: parseNumber(options.timeout, DEFAULTS.timeout),
    excludePatterns: [...DEFAULTS.excludePatterns, ...options.exclude],
    includeOnlyPattern: options.includeOnly || null,
    concurrency: parseNumber(options.concurrency, DEFAULTS.concurrency),
    verbose: options.verbose || false
  };

  if (parsedOptions.verbose) {
    setVerbose(true);
  }

  return parsedOptions;
}

function parseNumber(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export async function validateOptions(options) {
  if (!options.startUrl) {
    throw new Error('URL is required');
  }

  if (!isValidUrl(options.startUrl)) {
    throw new Error(`Invalid URL: ${options.startUrl}`);
  }

  if (options.maxPages < 1) {
    throw new Error('max-pages must be at least 1');
  }

  if (options.timeout < 1000) {
    throw new Error('timeout must be at least 1000ms');
  }

  if (options.concurrency < 1 || options.concurrency > 20) {
    throw new Error('concurrency must be between 1 and 20');
  }

  for (const pattern of options.excludePatterns) {
    try {
      new RegExp(pattern);
    } catch (error) {
      throw new Error(`Invalid exclude pattern: ${pattern}`);
    }
  }

  if (options.includeOnlyPattern) {
    try {
      new RegExp(options.includeOnlyPattern);
    } catch (error) {
      throw new Error(`Invalid include-only pattern: ${options.includeOnlyPattern}`);
    }
  }
}