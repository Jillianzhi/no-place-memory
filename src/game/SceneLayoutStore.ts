import * as THREE from 'three';
import type { SceneId } from './types';

export type LayoutOrientation = 'portrait' | 'landscape';

export interface SavedTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

interface LayoutDocument {
  version: 1;
  scenes: Partial<Record<SceneId, Partial<Record<LayoutOrientation, Record<string, SavedTransform>>>>>;
}

const STORAGE_KEY = 'no-place-3d.scene-layouts.v1';
const SCHOOL_REVISION_KEY = `${STORAGE_KEY}.scene01-revision`;
const SCHOOL_REVISION = 'corridor-3d-v15';
const STATION_REVISION_KEY = `${STORAGE_KEY}.scene02-revision`;
const STATION_REVISION = 'waiting-hall-3d-v24';
const BUILDING_REVISION_KEY = `${STORAGE_KEY}.scene03-revision`;
const BUILDING_REVISION = 'apartment-stairwell-3d-v26';
const PROJECTION_REVISION_KEY = `${STORAGE_KEY}.scene04-revision`;
const PROJECTION_REVISION = 'archive-projection-room-3d-v7';

const emptyDocument = (): LayoutDocument => ({ version: 1, scenes: {} });

const finiteTuple = (value: unknown): value is [number, number, number] =>
  Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === 'number' && Number.isFinite(item));

const isSavedTransform = (value: unknown): value is SavedTransform => {
  if (!value || typeof value !== 'object') return false;
  const transform = value as Partial<SavedTransform>;
  return finiteTuple(transform.position) && finiteTuple(transform.rotation) && finiteTuple(transform.scale);
};

const isUsableTransform = (transform: SavedTransform): boolean => {
  const [x, y, z] = transform.position;
  const positionIsUsable = Math.abs(x) <= 50 && y >= -1.5 && y <= 10 && Math.abs(z) <= 50;
  const scaleIsUsable = transform.scale.every((value) => value >= 0.01 && value <= 100);
  return positionIsUsable && scaleIsUsable;
};

export class SceneLayoutStore {
  private document = this.read();

  constructor() {
    let changed = false;
    if (localStorage.getItem(SCHOOL_REVISION_KEY) !== SCHOOL_REVISION) {
      delete this.document.scenes.scene01_school;
      localStorage.setItem(SCHOOL_REVISION_KEY, SCHOOL_REVISION);
      changed = true;
    }
    if (localStorage.getItem(STATION_REVISION_KEY) !== STATION_REVISION) {
      delete this.document.scenes.scene02_station;
      localStorage.setItem(STATION_REVISION_KEY, STATION_REVISION);
      changed = true;
    }
    if (localStorage.getItem(BUILDING_REVISION_KEY) !== BUILDING_REVISION) {
      delete this.document.scenes.scene03_building;
      localStorage.setItem(BUILDING_REVISION_KEY, BUILDING_REVISION);
      changed = true;
    }
    if (localStorage.getItem(PROJECTION_REVISION_KEY) !== PROJECTION_REVISION) {
      delete this.document.scenes.scene04_projection;
      localStorage.setItem(PROJECTION_REVISION_KEY, PROJECTION_REVISION);
      changed = true;
    }
    if (changed) this.write();
  }

  get(sceneId: SceneId, orientation: LayoutOrientation, objectName: string): SavedTransform | null {
    const transform = this.document.scenes[sceneId]?.[orientation]?.[objectName] ?? null;
    return transform && isUsableTransform(transform) ? transform : null;
  }

  save(sceneId: SceneId, orientation: LayoutOrientation, object: THREE.Object3D): void {
    const scene = (this.document.scenes[sceneId] ??= {});
    const layout = (scene[orientation] ??= {});
    layout[object.name] = {
      position: object.position.toArray() as [number, number, number],
      rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
      scale: object.scale.toArray() as [number, number, number]
    };
    this.write();
  }

  remove(sceneId: SceneId, orientation: LayoutOrientation, objectName: string): void {
    const layout = this.document.scenes[sceneId]?.[orientation];
    if (!layout) return;
    delete layout[objectName];
    this.write();
  }

  clearScene(sceneId: SceneId, orientation: LayoutOrientation): void {
    const scene = this.document.scenes[sceneId];
    if (!scene) return;
    delete scene[orientation];
    this.write();
  }

  exportJson(): string {
    return JSON.stringify(this.document, null, 2);
  }

  importJson(json: string): void {
    const parsed = JSON.parse(json) as Partial<LayoutDocument>;
    if (parsed.version !== 1 || !parsed.scenes || typeof parsed.scenes !== 'object') {
      throw new Error('布局文件格式不正确。');
    }
    for (const scene of Object.values(parsed.scenes)) {
      if (!scene || typeof scene !== 'object') continue;
      for (const layout of Object.values(scene)) {
        if (!layout || typeof layout !== 'object') continue;
        for (const transform of Object.values(layout)) {
          if (!isSavedTransform(transform)) throw new Error('布局文件包含无效的坐标。');
        }
      }
    }
    this.document = parsed as LayoutDocument;
    this.write();
  }

  private read(): LayoutDocument {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyDocument();
      const parsed = JSON.parse(raw) as LayoutDocument;
      return parsed.version === 1 && parsed.scenes ? parsed : emptyDocument();
    } catch {
      return emptyDocument();
    }
  }

  private write(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.document));
  }
}
