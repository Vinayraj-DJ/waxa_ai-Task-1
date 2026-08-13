import assert from 'node:assert';
import { test } from 'node:test';
import { MockDriver } from '../src/drivers/MockDriver.js';

test('MockDriver satisfies BaseDriver contract methods', async () => {
  const driver = new MockDriver('cognodb', 'CognoDB Cloud Test');
  await driver.connect();
  assert.strictEqual(driver.isConnected, true);

  const t1 = await driver.queryTraversal1Hop('usr_1');
  assert.strictEqual(typeof t1, 'number');
  assert.ok(t1 > 0);

  const footprint = await driver.getObservableFootprint();
  assert.ok(footprint.instanceSpecs.includes('0.5 vCPU'));

  await driver.disconnect();
  assert.strictEqual(driver.isConnected, false);
});
