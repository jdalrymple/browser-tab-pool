import PQueue from 'p-queue';
import Playwright from 'playwright-core';

async function createTabWorker(context, startupFn) {
  const p = await context.newPage();

  if(startupFn) await startupFn(p);

  return ({
    page: p,
    status: 'idle',
  })
}

export default class TabPool {
  constructor(){
    this.tabWorkers = [];
    this.browserContext = null;
    this.browser = null;
    this.queue = null;
  }

  async init(workers, startupFn) {
    this.browser = await Playwright.chromium.launch({
      args: [
        // error when launch(); No usable sandbox! Update your kernel
        '--no-sandbox',
        // error when launch(); Failed to load libosmesa.so
        '--disable-gpu',
        // freeze when newPage()
        '--single-process',
      ],
    });
    this.browserContext = await this.browser.newContext({ acceptDownloads: true });
    this.startupFn = startupFn;
    this.queue = new PQueue.default({ concurrency: workers, autostart: true });

    await this.addTabWorkers(workers);
  }

  async addTabWorkers(workers) {
    const w = Array(workers);
    let i = 0;

    while (i<workers) w[i++] = createTabWorker(this.browserContext, this.startupFn)

    const newWorkers = await Promise.all(w);

    this.tabWorkers.push(...newWorkers);

    await this.queue.onIdle();

    this.queue.concurrency = workers;
  }

  async runTask(fn) {
    // Add to queue, return reference to queue process
    return this.queue.add(async () => {
      const worker = this.tabWorkers.find((p) => p.status === 'idle');

      worker.status = 'busy';

      const result = await fn(worker.page)

      worker.status = 'idle';

      return result;
    })
  }

  async shutdown() {
    await this.browser.close();
  }
}
