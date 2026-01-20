import pLimit from 'p-limit';

export class ConcurrentQueue {
  constructor(concurrency = 5) {
    this.limit = pLimit(concurrency);
    this.tasks = [];
    this.results = [];
    this.errors = [];
  }

  async add(fn) {
    this.tasks.push(fn);
  }

  async waitForCompletion({ throwOnError = true } = {}) {
    this.results = await Promise.allSettled(
      this.tasks.map(task => this.limit(task))
    );

    this.errors = this.results
      .filter(result => result.status === 'rejected')
      .map(result => result.reason);

    if (throwOnError && this.errors.length > 0) {
      throw new AggregateError(this.errors, `${this.errors.length} tasks failed`);
    }

    return this.results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
  }

  clear() {
    this.tasks = [];
    this.results = [];
    this.errors = [];
  }
}
