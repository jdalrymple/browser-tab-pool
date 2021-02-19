import TabPool from './index.js';

// Just an Example

function wait(ms) {
  return new Promise((_) => setTimeout(_, ms));
}

async function test() {
  const pool = new TabPool()

  await pool.init(2)

  const a = pool.runTask(async (page) => {
    await wait(1000)
    console.log('hit')
    return 5
  })

  const b = pool.runTask(() => {
    console.log('hit')
    return 6
  })

  const c = pool.runTask(async () => {
    console.log('hit')
    await wait(3000)
    return 7
  })

  const d = pool.runTask(async () => {
    console.log('322')
    await wait(3000)
    return 9
  })

  const g = await Promise.all([a,b,c, d])

  console.log(g)

  await pool.shutdown()
}

test()
