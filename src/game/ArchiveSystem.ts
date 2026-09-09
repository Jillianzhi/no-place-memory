import type { ArchiveData } from './types';

const createEmptyArchive = (): ArchiveData => ({
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
});

export class ArchiveSystem {
  private static readonly STORAGE_KEY = 'no-place-archive';
  readonly data: ArchiveData = createEmptyArchive();

  private sceneEnterAt = performance.now();
  private activeScene = '';
  private readonly discoveries = new Set<string>();

  constructor() {
    this.restore();
  }

  reset(): void {
    Object.assign(this.data, createEmptyArchive());
    this.discoveries.clear();
    this.activeScene = '';
    this.sceneEnterAt = performance.now();
    localStorage.removeItem(ArchiveSystem.STORAGE_KEY);
  }

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
    this.activeScene = '';
    this.persist();
  }

  touch(id: string): void {
    if (!this.data.firstTouchedObject) this.data.firstTouchedObject = id;
    this.data.repeatedTouches[id] = (this.data.repeatedTouches[id] ?? 0) + 1;
    this.persist();
  }

  error(): void {
    this.data.errorCount += 1;
    this.persist();
  }

  hidden(id: string): void {
    this.discoveries.add(id);
    this.data.hiddenFound = this.discoveries.size;
    this.persist();
  }

  drag(success: boolean): void {
    this.data.dragAttempts += 1;
    if (success) this.data.dragSuccesses += 1;
    this.persist();
  }

  observe(success: boolean): void {
    this.data.observeAttempts += 1;
    if (success) this.data.observeSuccesses += 1;
    this.persist();
  }

  finalize(): ArchiveData {
    this.leaveScene();
    const dragRate = this.data.dragAttempts ? this.data.dragSuccesses / this.data.dragAttempts : 0;
    const observeRate = this.data.observeAttempts ? this.data.observeSuccesses / this.data.observeAttempts : 0;
    const repeatCount = Object.values(this.data.repeatedTouches).filter((count) => count > 1).length;
    if (observeRate > 0.75 && this.data.errorCount <= 2) {
      this.data.resultType = '空间校对员';
    // Finishing the required route alone should not imply an exploration identity.
    } else if (this.data.hiddenFound >= 6 && dragRate >= 0.5) {
      this.data.resultType = '时间褶皱拾荒者';
    } else if (repeatCount >= 3 || this.data.errorCount >= 4) {
      this.data.resultType = '错误记忆保管员';
    } else {
      this.data.resultType = '没有归档的人';
    }
    this.persist();
    return this.data;
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(ArchiveSystem.STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { data?: Partial<ArchiveData>; discoveries?: string[] } | Partial<ArchiveData>;
      const savedData = 'data' in parsed && parsed.data ? parsed.data : parsed;
      Object.assign(this.data, savedData);
      const discoveries = 'discoveries' in parsed && Array.isArray(parsed.discoveries) ? parsed.discoveries : [];
      discoveries.forEach((id) => this.discoveries.add(id));
    } catch {
      localStorage.removeItem(ArchiveSystem.STORAGE_KEY);
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(ArchiveSystem.STORAGE_KEY, JSON.stringify({
        data: this.data,
        discoveries: [...this.discoveries]
      }));
    } catch {
      // Private browsing or full storage must never stop the game.
    }
  }
}
