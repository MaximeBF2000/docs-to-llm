import { crawl } from './crawler.js';
import { generateOutput } from './output.js';
import { info, success, error } from './logger.js';
import ora from 'ora';

export async function execute(url, options) {
  info(`Starting crawl of: ${url}`);
  info(`Output file: ${options.output}`);

  const spinner = ora('Crawling documentation pages...').start();

  try {
    const pages = await crawl(url, {
      ...options,
      onProgress: ({ visited, queued, pages, maxPages }) => {
        const target = Number.isFinite(maxPages) ? `/${maxPages}` : '';
        spinner.text = `Crawled ${pages}${target} pages (visited ${visited}, queued ${queued})...`;
      }
    });

    spinner.text = `Processing ${pages.length} pages...`;

    await generateOutput(pages, options);

    spinner.succeed(`Successfully crawled ${pages.length} pages`);
    success(`Output written to: ${options.output}`);
  } catch (err) {
    spinner.fail('Crawling failed');
    error(err.message);
    throw err;
  }
}
