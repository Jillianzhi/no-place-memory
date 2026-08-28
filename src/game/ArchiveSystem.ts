import type { ArchiveData } from './types';

export class ArchiveSystem {
  readonly data: ArchiveData = {
    firstTouchedObject: null,
    longestScene: null,
    sceneTimes: {},
    errorCount: 0,
    repeatedTouches: {},
    hiddenFound: 0,
    dragAttempts: 0,
    dragSuccesses: 0,
    observeAttempts: 0,
    observeSuccesses: 0,
    resultType: null
  };

  private sceneEnterAt = performance.now();
  private activeScene = '';

  enterScene(scene: string): void {
    this.leaveScene();
    this.activeScene = scene;
    this.sceneEnterAt = performance.now();
  }

  leaveScene(): void {
    if (!this.activeScene) return;
    const elapsed = (performance.now() - this.sceneEnterAt) / 1000;
    this.data.sceneTimes[this.activeScene] = (this.data.sceneTimes[this.activeScene] ?? 0) + elapsed;
    const entries = Object.entries(this.data.sceneTimes).sort((a, b) => b[1] - a[1]);
    this.data.longestScene = entries[0]?.[0] ?? null;
  }

  touch(id: string): void {
    if (!this.data.firstTouchedObject) this.data.firstTouchedObject = id;
    this.data.repeatedTouches[id] = (this.data.repeatedTouches[id] ?? 0) + 1;
  }

  error(): void {
    this.data.errorCount += 1;
  }

  hidden(): void {
    this.data.hiddenFound += 1;
  }

  drag(success: boolean): void {
    this.data.dragAttempts += 1;
    if (success) this.data.dragSuccesses += 1;
  }

  observe(success: boolean): void {
    this.data.observeAttempts += 1;
    if (success) this.data.observeSuccesses += 1;
  }

  finalize(): ArchiveData {
    this.leaveScene();
    const dragRate = this.data.dragAttempts ? this.data.dragSuccesses / this.data.dragAttempts : 0;
    const observeRate = this.data.observeAttempts ? this.data.observeSuccesses / this.data.observeAttempts : 0;
    const repeatCount = Object.values(this.data.repeatedTouches).filter((count) => count > 1).length;
    if (observeRate > 0.75 && this.data.errorCount <= 2) {
      this.data.resultType = '空间校对员';
    } else if (this.data.hiddenFound >= 3 && dragRate >= 0.5) {
      this.data.resultType = '时间褶皱拾荒者';
    } else if (repeatCount >= 3 || this.data.errorCount >= 4) {
      this.data.resultType = '错误记忆保管员';
    } else {
      this.data.resultType = '没有归档的人';
    }
    localStorage.setItem('no-place-archive', JSON.stringify(this.data));
    return this.data;
  }
}
