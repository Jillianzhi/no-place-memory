import * as THREE from 'three';

export type SceneId = 'scene01_school' | 'scene02_station' | 'scene03_building' | 'scene04_projection' | 'scene05_memory';

export type GestureType = 'tap' | 'drag' | 'swipe' | 'longPress' | 'observe';

export type HotspotId =
  | 'hotspot_radio'
  | 'hotspot_fog_glass'
  | 'hotspot_clock'
  | 'exit_door'
  | 'hotspot_ticket'
  | 'hotspot_board'
  | 'hotspot_gate'
  | 'exit_bus_door'
  | 'hotspot_wall'
  | 'hotspot_sound_light'
  | 'hotspot_bike'
  | 'hotspot_red_paper'
  | 'hotspot_iron_door'
  | 'hotspot_playground'
  | 'hotspot_projector'
  | 'hotspot_archive_cabinet'
  | 'hotspot_screen'
  | 'hotspot_memory_table'
  | 'hotspot_final_fragment'
  | 'exit_restart'
  | 'hotspot_memory_near'
  | 'hotspot_memory_middle'
  | 'hotspot_memory_far'
  | 'hotspot_memory_photo'
  | 'exit_archive';

export interface HotspotDefinition {
  id: HotspotId;
  label: string;
  gestures: GestureType[];
}

export interface SceneDefinition {
  id: SceneId;
  title: string;
  place: string;
  modelPath: string;
  hotspots: HotspotDefinition[];
}

export interface SceneBuildResult {
  root: THREE.Group;
  hotspots: THREE.Object3D[];
  usedFallback: boolean;
  usedModel: boolean;
}

export interface PointerGesture {
  type: GestureType;
  id?: HotspotId;
  object?: THREE.Object3D;
  dropId?: HotspotId;
  localPoint?: THREE.Vector2;
  delta: THREE.Vector2;
  point: THREE.Vector2;
  duration: number;
}

export interface ArchiveData {
  firstTouchedObject: string | null;
  longestScene: string | null;
  sceneTimes: Record<string, number>;
  errorCount: number;
  repeatedTouches: Record<string, number>;
  hiddenFound: number;
  dragAttempts: number;
  dragSuccesses: number;
  observeAttempts: number;
  observeSuccesses: number;
  resultType: string | null;
}

export interface SceneState {
  flags: Record<string, boolean | number | string>;
  completed: boolean;
}
