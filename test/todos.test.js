const { once } = require('node:events');
const assert = require('node:assert/strict');
const test = require('node:test');

process.env.DB_PATH = ':memory:';
const { app, db } = require('../server');

test('health and storefront stay public; tasks require a token and validate inputs', async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const headers = { 'content-type': 'application/json', authorization: 'Bearer local-test-token' };
  try {
    assert.equal((await fetch(`${base}/health`)).status, 200);
    assert.equal((await fetch(`${base}/`, { redirect: 'manual' })).status, 302);
    assert.equal((await fetch(`${base}/api/todos`)).status, 503);
    process.env.TODO_ADMIN_TOKEN = 'local-test-token';
    assert.equal((await fetch(`${base}/api/todos`)).status, 401);
    const write = (path, method, value) => fetch(`${base}/api/todos${path}`, {
      method, headers, ...(value === undefined ? {} : { body: JSON.stringify(value) })
    });
    assert.equal((await write('', 'POST', { title: '   ' })).status, 400);
    const created = await write('', 'POST', { title: '  سفارش آزمایشی  ' });
    assert.equal(created.status, 201);
    const row = await created.json();
    assert.equal(row.title, 'سفارش آزمایشی');
    assert.equal((await write(`/${row.id}`, 'PUT', { done: false })).status, 400);
    assert.equal((await (await write(`/${row.id}`, 'PUT', { done: 1 })).json()).done, 1);
    assert.equal((await write(`/${row.id}`, 'DELETE')).status, 200);
    assert.deepEqual(await (await fetch(`${base}/api/todos`, { headers })).json(), []);
  } finally {
    delete process.env.TODO_ADMIN_TOKEN;
    await new Promise((resolve) => server.close(resolve));
    await new Promise((resolve, reject) => db.close((err) => err ? reject(err) : resolve()));
  }
});
