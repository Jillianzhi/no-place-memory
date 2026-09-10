import type { ArchiveData, SceneDefinition } from './types';

interface DebugSnapshot {
  scene: SceneDefinition;
  fps: number;
  flags: Record<string, boolean | number | string>;
  interactables: string[];
  hit: string | null;
  usedModel: boolean;
  usedFallback: boolean;
  archiveData: ArchiveData;
  gpu: { geometries: number; textures: number; calls: number; triangles: number };
}

export class DebugPanel {
  readonly enabled = new URLSearchParams(location.search).get('debug') === '1';
  private readonly element: HTMLPreElement;

  constructor() {
    this.element = document.createElement('pre');
    this.element.className = 'debug-panel';
    if (this.enabled) document.body.append(this.element);
  }

  update(snapshot: DebugSnapshot): void {
    if (!this.enabled) return;
    this.element.textContent = JSON.stringify(
      {
        currentScene: snapshot.scene.id,
        title: snapshot.scene.title,
        fps: Math.round(snapshot.fps),
        gpu: snapshot.gpu,
        flags: snapshot.flags,
        interactables: snapshot.interactables,
        currentHit: snapshot.hit,
        usedModel: snapshot.usedModel,
        usedFallback: snapshot.usedFallback,
        archiveData: snapshot.archiveData
      },
      null,
      2
    );
  }
}
