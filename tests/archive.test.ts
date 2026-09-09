import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ArchiveSystem } from '../src/game/ArchiveSystem.ts';

Object.defineProperty(globalThis, 'localStorage', { value: { setItem() {}, removeItem() {} } });

test('continuous wiping and repeat visits count each discovery only once', () => {
  const archive = new ArchiveSystem();
  for (let i = 0; i < 367; i++) archive.hidden('fog-glass');
  archive.hidden('photo-1'); archive.hidden('photo-1');
  assert.equal(archive.data.hiddenFound, 2);
});

test('all four identities are reachable through different behavior', () => {
  const careful = new ArchiveSystem(); careful.observe(true);
  assert.equal(careful.finalize().resultType, '空间校对员');
  const explorer = new ArchiveSystem(); explorer.drag(true);
  for (let i = 0; i < 6; i++) explorer.hidden(`discovery-${i}`);
  assert.equal(explorer.finalize().resultType, '时间褶皱拾荒者');
  const keeper = new ArchiveSystem();
  for (let i = 0; i < 4; i++) keeper.error();
  assert.equal(keeper.finalize().resultType, '错误记忆保管员');
  const wanderer = new ArchiveSystem(); wanderer.drag(true);
  for (let i = 0; i < 4; i++) wanderer.hidden(`required-${i}`);
  assert.equal(wanderer.finalize().resultType, '没有归档的人');
});

test('restart resets every statistic and discovery deduplication', () => {
  const archive = new ArchiveSystem();
  archive.enterScene('old'); archive.touch('radio'); archive.error();
  archive.hidden('fog-glass'); archive.drag(true); archive.observe(false); archive.finalize();
  archive.reset();
  assert.deepEqual(archive.data, new ArchiveSystem().data);
  archive.hidden('fog-glass');
  assert.equal(archive.data.hiddenFound, 1);
});

test('finalizing twice does not add the last scene time twice', () => {
  const archive = new ArchiveSystem(); archive.enterScene('school'); archive.finalize();
  const time = archive.data.sceneTimes.school;
  archive.finalize(); assert.equal(archive.data.sceneTimes.school, time);
});
