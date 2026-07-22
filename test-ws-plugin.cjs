const Fastify = require('fastify');
const fp = require('fastify-plugin');
const fw = require('@fastify/websocket');

async function test() {
  const app = Fastify({ logger: false });

  await app.register(fp(async (f) => {
    await f.register(fw, { options: { maxPayload: 1048576 } });
    f.get('/ws', { websocket: true }, (socket, req) => {
      socket.send('hello');
    });
  }), { prefix: '/v1' });

  await app.ready();
  console.log('routes:', app.printRoutes());

  // Test with inject
  const res = await app.inject({ method: 'GET', url: '/v1/ws' });
  console.log('inject status:', res.statusCode);
}

test().catch(e => { console.error('ERROR:', e.message, e.stack); process.exit(1); });
