```txt
    ____  ____  ___________      __________         __    __    __  ___
   / __ \/ __ \/ ____/ ___/     /_  __/ __ \       / /   / /   /  |/  /
  / / / / / / / /    \__ \       / / / / / /      / /   / /   / /|_/ /
 / /_/ / /_/ / /___ ___/ /      / / / /_/ /      / /___/ /___/ /  / /
/_____/\____/\____//____/      /_/  \____/      /_____/_____/_/  /_/
```

CLI tool to crawl documentation websites and aggregate content into a structured `llm.txt` file optimized for LLM consumption.

<p align="left">
  <a href="https://www.npmjs.com/package/docs-to-llm" target="_blank">
    <img src="https://img.shields.io/npm/v/docs-to-llm?color=%23007ec6&label=npm%20package&logo=npm" alt="npm version" />
  </a>
</p>


## Features

- Simple command-line interface
- Automatic URL discovery and crawling
- Content extraction from any HTML-based documentation site
- Structured Markdown output
- Preserves code blocks, tables, and API documentation
- Concurrent page fetching with rate limiting
- Error handling with retry logic
- Progress indicator during crawling

## Installation

```bash
npm install -g docs-to-llm
```

Or use directly with npx:

```bash
npx docs-to-llm <URL>
```

## Usage

```bash
docs-to-llm <DOCUMENTATION_URL> [options]
```

### Options

- `-o, --output <filename>` - Custom output filename (default: llm.txt)
- `-m, --max-pages <number>` - Maximum number of pages to crawl
- `-t, --timeout <milliseconds>` - Request timeout per page (default: 10000)
- `--exclude <pattern>` - Exclude URLs matching a regex pattern (can be used multiple times)
- `--include-only <pattern>` - Only include URLs matching a regex pattern
- `-c, --concurrency <number>` - Number of concurrent requests (default: 5)
- `-v, --verbose` - Enable detailed logging
- `-h, --help` - Display help information

### Examples

Basic usage:
```bash
docs-to-llm https://react.dev
```

Custom output file:
```bash
docs-to-llm https://docs.python.org -o python-docs.txt
```

Limit pages and concurrency:
```bash
docs-to-llm https://nodejs.org -m 50 -c 3
```

Exclude certain paths:
```bash
docs-to-llm https://example.com/docs --exclude /api --exclude /login
```

Include only specific paths:
```bash
docs-to-llm https://example.com --include-only /docs/guides
```

The command that was used to generate the ./example-output.txt file is:
```bash
node bin/docs-to-llm https://opencode.ai/docs --max-pages 200 --timeout 10000 --output ./example-output.txt
```

## Output Format

The generated `llm.txt` file contains:

- Document metadata (source URL, generation time, page count)
- Table of contents
- Each page's content with source URL
- Properly formatted Markdown for LLM consumption

## How It Works

1. **URL Discovery**: Starts from the provided URL and discovers all internal links
2. **Crawling**: Fetches all discovered pages concurrently with rate limiting
3. **Content Extraction**: Identifies and extracts main content, removing navigation and non-content elements
4. **Markdown Conversion**: Converts HTML to structured Markdown
5. **Output Generation**: Creates a single, well-formatted file with metadata and table of contents

## Requirements

- Node.js 18.0.0 or higher

## License

MIT
