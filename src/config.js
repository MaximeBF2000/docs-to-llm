export const DEFAULTS = {
  output: 'llm.txt',
  maxPages: Infinity,
  timeout: 10000,
  concurrency: 5,
  retryAttempts: 3,
  retryDelay: 1000,
  excludePatterns: [
    '/login',
    '/admin',
    '/api',
    '/auth',
    '/signup',
    '/register',
    '/password',
    '/account'
  ]
};

export const SELECTORS_TO_REMOVE = [
  'nav',
  'header',
  'footer',
  'aside',
  '.sidebar',
  '.navigation',
  '.nav',
  '.footer',
  '.header',
  '[role="navigation"]',
  '[role="complementary"]',
  '[role="banner"]',
  '[role="contentinfo"]'
];

export const MAIN_CONTENT_SELECTORS = [
  'main',
  'article',
  '[role="main"]',
  '.content',
  '.documentation',
  '.markdown',
  '#content',
  '#main',
  '#documentation'
];