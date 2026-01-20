import { createCLI } from './cli.js';

const cli = createCLI();
await cli.parseAsync(process.argv);
