export default async function teardown() {
  const token = process.env.FORGE_E2E_SHUTDOWN_TOKEN;
  if (!token) throw new Error('Missing fixture shutdown token');
  const response = await fetch('http://127.0.0.1:3001/__fixture/shutdown', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error('Fixture shutdown failed: ' + response.status);
  await response.text();
}
