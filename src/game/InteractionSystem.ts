import * as THREE from 'three';
import { ArchiveSystem } from './ArchiveSystem';
import { AudioSystem, type SfxCue } from './AudioSystem';
import { InputSystem, type PointerState } from './InputSystem';
import { SceneManager } from './SceneManager';
import type { GestureType, HotspotId, PointerGesture } from './types';

type HitHandler = (id: string | null) => void;
type FeedbackHandler = (feedback: InteractionFeedback) => void;

interface PickResult {
  object: THREE.Object3D;
  localPoint: THREE.Vector2;
}

interface ScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface InteractionFeedback {
  kind: 'idle' | 'hint' | 'hold' | 'drag' | 'success' | 'error';
  hotspotId?: string;
  label?: string;
  progress?: number;
  point?: THREE.Vector2;
}

export class InteractionSystem {
  private readonly raycaster = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();
  private input: InputSystem;
  private pressedObject: THREE.Object3D | null = null;
  private longPressTimer = 0;
  private longPressFired = false;
  private currentHit: string | null = null;
  private hoverStartedAt = 0;
  private hoverObject: THREE.Object3D | null = null;
  private onHit: HitHandler = () => undefined;
  private onFeedback: FeedbackHandler = () => undefined;
  private lastPoint = new THREE.Vector2();
  private pointerStartedAt = 0;
  private pointerIsDragging = false;
  private lastSwipePoint = new THREE.Vector2();
  private lastContinuousSfxAt = 0;
  private enabled = true;

  constructor(
    element: HTMLElement,
    private readonly camera: THREE.Camera,
    private readonly sceneManager: SceneManager,
    private readonly archive: ArchiveSystem,
    private readonly audio: AudioSystem
  ) {
    this.input = new InputSystem(element);
    this.input.onDown(this.handleDown);
    this.input.onMove(this.handleMove);
    this.input.onUp(this.handleUp);
  }

  setHitHandler(handler: HitHandler): void {
    this.onHit = handler;
  }

  setFeedbackHandler(handler: FeedbackHandler): void {
    this.onFeedback = handler;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) return;
    window.clearTimeout(this.longPressTimer);
    this.pressedObject = null;
    this.hoverObject = null;
    this.sceneManager.endDrag();
    this.onFeedback({ kind: 'idle' });
  }

  dispose(): void {
    this.input.dispose();
  }

  private readonly handleDown = (point: THREE.Vector2): void => {
    if (!this.enabled) return;
    this.audio.unlock();
    this.lastPoint.copy(point);
    const downHit = this.pick(point);
    this.pressedObject = downHit?.object ?? null;
    this.longPressFired = false;
    this.pointerStartedAt = performance.now();
    this.pointerIsDragging = false;
    this.lastSwipePoint.copy(point);
    if (this.pressedObject) {
      const id = this.idOf(this.pressedObject);
      if (['hotspot_ticket', 'hotspot_red_paper', 'hotspot_memory_table', 'hotspot_final_fragment'].includes(id)) {
        this.audio.playSfx('paper_pickup');
      } else {
        this.audio.playSfx('contact_click');
      }
      const dragPoint = this.pointerWorldOnDragPlane(point, id as HotspotId);
      if (dragPoint) this.sceneManager.beginDrag(id as HotspotId, dragPoint);
      this.archive.touch(id);
      this.onFeedback({ kind: 'hint', hotspotId: id, label: this.labelFor(id), point });
      this.longPressTimer = window.setTimeout(() => {
        if (!this.pressedObject) return;
        this.longPressFired = true;
        this.commit('longPress', point, this.pressedObject, undefined, new THREE.Vector2(), InputSystem.longPressMs);
      }, InputSystem.longPressMs);
    }
  };

  private readonly handleMove = (point: THREE.Vector2, state?: PointerState): void => {
    if (!this.enabled) return;
    this.lastPoint.copy(point);
    const hit = this.pick(point);
    this.updateHit(hit?.object ?? null);
    if (!state || !this.pressedObject) return;
    const id = this.idOf(this.pressedObject);
    const delta = state.current.clone().sub(state.start);
    if (state.moved) {
      window.clearTimeout(this.longPressTimer);
      this.pointerIsDragging = true;
      this.onFeedback({ kind: 'drag', hotspotId: id, label: this.dragLabelFor(id), point });
      this.sceneManager.previewDrag(id as HotspotId, delta, this.pointerWorldOnDragPlane(point, id as HotspotId) ?? undefined);
    }
    if (
      state.moved &&
      (id.includes('glass') || id.includes('rain')) &&
      hit &&
      this.idOf(hit.object) === id &&
      delta.length() > 18 &&
      point.distanceTo(this.lastSwipePoint) >= 16
    ) {
      this.lastSwipePoint.copy(point);
      this.commit('swipe', point, this.pressedObject, undefined, delta, performance.now() - state.startedAt, hit.localPoint);
    }
  };

  private readonly handleUp = (point: THREE.Vector2, state: PointerState): void => {
    if (!this.enabled) return;
    window.clearTimeout(this.longPressTimer);
    if (!this.pressedObject || this.longPressFired) {
      this.pressedObject = null;
      this.sceneManager.endDrag();
      this.pointerStartedAt = 0;
      this.pointerIsDragging = false;
      this.onFeedback({ kind: 'idle' });
      return;
    }

    const duration = performance.now() - state.startedAt;
    const delta = state.current.clone().sub(state.start);
    const upHit = this.pick(point);
    const pressedId = this.idOf(this.pressedObject);
    const screenDrop = this.screenSpaceDrop(this.pressedObject, point);
    const directDrop = pressedId === 'hotspot_ticket' ? null : upHit?.object ?? null;
    const drop = screenDrop ?? directDrop ?? this.inferDrop(this.pressedObject, delta);
    if (state.moved) {
      const id = this.idOf(this.pressedObject);
      const isWipe = id.includes('glass') || id.includes('rain');
      if (isWipe) {
        if (point.distanceTo(this.lastSwipePoint) >= 8 && upHit && this.idOf(upHit.object) === id) {
          this.commit('swipe', point, this.pressedObject, undefined, delta, duration, upHit.localPoint);
        }
      } else {
        const distance = Math.abs(delta.x) + Math.abs(delta.y);
        const gesture: GestureType = distance > 26 ? 'drag' : 'swipe';
        this.commit(gesture, point, this.pressedObject, drop ?? undefined, delta, duration, upHit?.localPoint);
      }
    } else {
      this.commit('tap', point, this.pressedObject, undefined, delta, duration, upHit?.localPoint);
    }
    this.pressedObject = null;
    this.sceneManager.endDrag();
    this.pointerStartedAt = 0;
    this.pointerIsDragging = false;
    this.onFeedback({ kind: 'idle' });
  };

  update(time: number): void {
    if (!this.enabled) return;
    if (this.pressedObject && !this.longPressFired && !this.pointerIsDragging) {
      this.onFeedback({
        kind: 'hold',
        hotspotId: this.idOf(this.pressedObject),
        label: this.labelFor(this.idOf(this.pressedObject)),
        progress: Math.min(1, (time - this.pointerStartedAt) / InputSystem.longPressMs),
        point: this.lastPoint
      });
    }
    if (!this.hoverObject) return;
    const hoveredFor = time - this.hoverStartedAt;
    if (hoveredFor > 1250) {
      this.commit('observe', new THREE.Vector2(), this.hoverObject, undefined, new THREE.Vector2(), hoveredFor);
      this.hoverStartedAt = time + 999999;
    }
  }

  private commit(
    type: GestureType,
    point: THREE.Vector2,
    object: THREE.Object3D,
    drop: THREE.Object3D | undefined,
    delta: THREE.Vector2,
    duration: number,
    localPoint?: THREE.Vector2
  ): void {
    const dropId = drop ? this.idOf(drop) : undefined;
    const gesture: PointerGesture = {
      type,
      id: this.idOf(object) as HotspotId,
      object,
      dropId: dropId as HotspotId | undefined,
      localPoint,
      delta,
      point,
      duration
    };
    const success = this.sceneManager.handleGesture(gesture);
    if (type === 'drag') this.archive.drag(success);
    if (type === 'observe' && this.sceneManager.currentDefinition.hotspots.some(h => h.id === gesture.id && h.gestures.includes('observe'))) this.archive.observe(success);
    if (success) {
      if (type === 'swipe' && gesture.id === 'hotspot_fog_glass' && this.sceneManager.getObjectives().some(item => item.label === '擦开雾玻璃' && item.done)) {
        this.archive.hidden('fog-glass');
      }
      if (type === 'tap' && gesture.id === 'hotspot_memory_photo') {
        this.archive.hidden(`photo-${object.uuid}`);
      }
      this.playInteractionSfx(gesture, true);
      this.onFeedback({ kind: 'success', hotspotId: String(gesture.id), label: this.successLabelFor(String(gesture.id)) });
    } else if (type !== 'observe') {
      this.archive.error();
      this.playInteractionSfx(gesture, false);
      this.onFeedback({ kind: 'error', hotspotId: String(gesture.id), label: this.errorLabelFor(String(gesture.id), type) });
    }
  }

  private playInteractionSfx(gesture: PointerGesture, success: boolean): void {
    const cue = this.sfxFor(gesture, success);
    if (!cue) return;
    if (cue === 'glass_wipe') {
      const now = performance.now();
      if (now - this.lastContinuousSfxAt < 280) return;
      this.lastContinuousSfxAt = now;
    }
    this.audio.playSfx(cue);
  }

  private sfxFor(gesture: PointerGesture, success: boolean): SfxCue | null {
    const id = String(gesture.id);
    if (!success) {
      if (id === 'hotspot_red_paper' || id === 'hotspot_memory_table' || id === 'hotspot_final_fragment') return 'paper_drop';
      return 'material_error';
    }

    const cues: Partial<Record<HotspotId, SfxCue>> = {
      hotspot_radio: 'radio_static',
      hotspot_fog_glass: 'glass_wipe',
      hotspot_clock: 'clock_mechanism',
      exit_door: 'wood_door',
      hotspot_board: 'board_power',
      exit_bus_door: 'bus_door',
      hotspot_wall: 'old_lamp',
      hotspot_sound_light: 'old_lamp',
      hotspot_bike: 'bike_bell',
      hotspot_iron_door: 'metal_door',
      hotspot_projector: 'projector_start',
      hotspot_archive_cabinet: 'archive_bag',
      exit_restart: 'tape_stop',
      hotspot_memory_photo: 'photo_flip',
      hotspot_memory_near: 'photo_flip',
      hotspot_memory_middle: 'photo_flip',
      hotspot_memory_far: 'photo_flip',
      exit_archive: 'tape_stop'
    };

    if (id === 'hotspot_ticket') return gesture.dropId === 'hotspot_gate' ? 'ticket_stamp' : 'paper_drop';
    if (id === 'hotspot_red_paper') return gesture.dropId === 'hotspot_iron_door' ? 'paper_place' : 'paper_drop';
    if (id === 'hotspot_memory_table' || id === 'hotspot_final_fragment') {
      return gesture.dropId === 'hotspot_screen' ? 'screen_receive' : 'paper_drop';
    }
    return cues[id as HotspotId] ?? null;
  }

  private pick(point: THREE.Vector2): PickResult | null {
    const rect = (this.input as unknown as { element?: HTMLElement }).element?.getBoundingClientRect?.() ?? document.body.getBoundingClientRect();
    this.ndc.x = ((point.x - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -(((point.y - rect.top) / rect.height) * 2 - 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.sceneManager.getInteractables(), true);
    const hit = hits[0];
    if (!hit?.object) return null;
    const object = this.resolveHotspotObject(hit.object);
    return { object, localPoint: this.localPointForHit(object, hit.point) };
  }

  private pointerWorldOnDragPlane(point: THREE.Vector2, id: HotspotId): THREE.Vector3 | null {
    const planeZ = this.sceneManager.getDragPlaneZ(id);
    if (planeZ === null) return null;
    const rect = (this.input as unknown as { element?: HTMLElement }).element?.getBoundingClientRect?.() ?? document.body.getBoundingClientRect();
    this.ndc.x = ((point.x - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -(((point.y - rect.top) / rect.height) * 2 - 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const ray = this.raycaster.ray;
    if (Math.abs(ray.direction.z) < 0.0001) return null;
    const distance = (planeZ - ray.origin.z) / ray.direction.z;
    if (distance <= 0) return null;
    return ray.origin.clone().add(ray.direction.clone().multiplyScalar(distance));
  }

  private resolveHotspotObject(object: THREE.Object3D): THREE.Object3D {
    let cursor: THREE.Object3D | null = object;
    while (cursor && !cursor.userData.hotspotId) cursor = cursor.parent;
    return cursor ?? object;
  }

  private idOf(object: THREE.Object3D): string {
    return String(object.userData.hotspotId ?? object.name);
  }

  private localPointForHit(object: THREE.Object3D, worldPoint: THREE.Vector3): THREE.Vector2 {
    const local = object.worldToLocal(worldPoint.clone());
    const size = object.userData.hotspotSize as THREE.Vector3 | undefined;
    if (!size) return new THREE.Vector2(0.5, 0.5);
    const x = size.z > size.x * 2
      ? THREE.MathUtils.clamp(0.5 - local.z / size.z, 0, 1)
      : THREE.MathUtils.clamp(local.x / size.x + 0.5, 0, 1);
    const y = THREE.MathUtils.clamp(0.5 - local.y / size.y, 0, 1);
    return new THREE.Vector2(x, y);
  }

  private updateHit(object: THREE.Object3D | null): void {
    const id = object ? this.idOf(object) : null;
    if (id === this.currentHit) return;
    this.currentHit = id;
    this.onHit(id);
    this.onFeedback(id ? { kind: 'hint', hotspotId: id, label: this.labelFor(id), point: this.lastPoint } : { kind: 'idle' });
    if (object) {
      this.hoverObject = object;
      this.hoverStartedAt = performance.now();
    } else {
      this.hoverObject = null;
      this.hoverStartedAt = 0;
    }
  }

  private inferDrop(object: THREE.Object3D, delta: THREE.Vector2): THREE.Object3D | null {
    const id = this.idOf(object);
    const targetId =
      (id === 'hotspot_memory_table' || id === 'hotspot_final_fragment') && (Math.abs(delta.x) > 38 || delta.y < -32)
            ? 'hotspot_screen'
            : null;
    if (!targetId) return null;
    return this.sceneManager.getInteractables().find((item) => this.idOf(item) === targetId) ?? null;
  }

  private screenSpaceDrop(object: THREE.Object3D, point: THREE.Vector2): THREE.Object3D | null {
    const draggedId = this.idOf(object);
    if (draggedId === 'hotspot_red_paper') {
      const door = this.sceneManager.getInteractables().find((item) => this.idOf(item) === 'hotspot_iron_door');
      if (!door) return null;
      const canvasRect = (this.input as unknown as { element?: HTMLElement }).element?.getBoundingClientRect?.() ?? document.body.getBoundingClientRect();
      const doorRect = this.projectBounds(door, canvasRect);
      if (!doorRect) return null;
      const pointerInside = point.x >= doorRect.left - 10 && point.x <= doorRect.right + 10
        && point.y >= doorRect.top - 10 && point.y <= doorRect.bottom + 10;
      return pointerInside ? door : null;
    }
    if (draggedId !== 'hotspot_ticket') return null;
    const gate = this.sceneManager.getInteractables().find((item) => this.idOf(item) === 'hotspot_gate');
    const ticket = this.sceneManager.getVisualObject('ticket_visual');
    const slot = this.sceneManager.getVisualObject('gate_slot_visual') ?? gate;
    if (!gate || !ticket || !slot) return null;

    const canvasRect = (this.input as unknown as { element?: HTMLElement }).element?.getBoundingClientRect?.() ?? document.body.getBoundingClientRect();
    const ticketRect = this.projectBounds(ticket, canvasRect);
    const slotRect = this.projectBounds(slot, canvasRect);
    if (!ticketRect || !slotRect) return null;

    const target = {
      left: slotRect.left - 12,
      top: slotRect.top - 14,
      right: slotRect.right + 12,
      bottom: slotRect.bottom + 14
    };
    const overlapWidth = Math.max(0, Math.min(ticketRect.right, target.right) - Math.max(ticketRect.left, target.left));
    const overlapHeight = Math.max(0, Math.min(ticketRect.bottom, target.bottom) - Math.max(ticketRect.top, target.top));
    const ticketArea = Math.max(1, (ticketRect.right - ticketRect.left) * (ticketRect.bottom - ticketRect.top));
    const overlapRatio = overlapWidth * overlapHeight / ticketArea;
    const pointerInside = point.x >= target.left && point.x <= target.right && point.y >= target.top && point.y <= target.bottom;
    return pointerInside && overlapRatio >= 0.15 ? gate : null;
  }

  private projectBounds(object: THREE.Object3D, canvasRect: DOMRect): ScreenRect | null {
    object.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(object);
    if (bounds.isEmpty()) return null;
    let left = Number.POSITIVE_INFINITY;
    let top = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;
    let bottom = Number.NEGATIVE_INFINITY;
    for (const x of [bounds.min.x, bounds.max.x]) {
      for (const y of [bounds.min.y, bounds.max.y]) {
        for (const z of [bounds.min.z, bounds.max.z]) {
          const projected = new THREE.Vector3(x, y, z).project(this.camera);
          const screenX = canvasRect.left + (projected.x + 1) * 0.5 * canvasRect.width;
          const screenY = canvasRect.top + (1 - projected.y) * 0.5 * canvasRect.height;
          left = Math.min(left, screenX);
          top = Math.min(top, screenY);
          right = Math.max(right, screenX);
          bottom = Math.max(bottom, screenY);
        }
      }
    }
    return { left, top, right, bottom };
  }

  private labelFor(id: string): string {
    const labels: Record<string, string> = {
      hotspot_radio: '按住广播，直到杂音变清',
      hotspot_fog_glass: '在雾玻璃上擦拭',
      hotspot_clock: '轻点或拖动时钟',
      exit_door: '完成四件事后点门',
      hotspot_ticket: '把车票向检票口拖',
      hotspot_board: '轻点电子屏',
      hotspot_gate: '检票口在这里',
      exit_bus_door: '检票后点车门',
      hotspot_wall: '轻点墙面，点亮灯',
      hotspot_sound_light: '轻点灯',
      hotspot_bike: '观察变化：车轮',
      hotspot_red_paper: '把奖状拖回铁门',
      hotspot_iron_door: '奖状归位后点铁门',
      hotspot_playground: '观察乐园残影',
      hotspot_projector: '按住放映机启动',
      hotspot_archive_cabinet: '碎片入银幕后打开档案袋',
      hotspot_screen: '碎片要落到银幕',
      hotspot_memory_table: '把记忆碎片拖向银幕',
      hotspot_final_fragment: '把记忆碎片拖向银幕',
      exit_restart: '档案完成后点这里',
      hotspot_memory_near: '轻点近处的一组照片',
      hotspot_memory_middle: '轻点长廊中段的照片',
      hotspot_memory_far: '轻点尽头的照片',
      hotspot_memory_photo: '轻点查看这张照片',
      exit_archive: '看完三段照片后进入档案室'
    };
    return labels[id] ?? id;
  }

  private dragLabelFor(id: string): string {
    if (id === 'hotspot_ticket') return '继续拖到右侧检票槽';
    if (id === 'hotspot_red_paper') return '继续拖向右侧铁门';
    if (id === 'hotspot_memory_table' || id === 'hotspot_final_fragment') return '继续拖向银幕中央';
    if (id.includes('glass') || id.includes('rain')) return '继续擦拭';
    return '松手确认';
  }

  private successLabelFor(id: string): string {
    if (id.includes('glass') || id.includes('rain')) return '擦开了';
    if (id.includes('ticket')) return '车票已移动';
    if (id.includes('projector') || id.includes('radio')) return '长按完成';
    return '已回应';
  }

  private errorLabelFor(id: string, type: GestureType): string {
    if (type === 'longPress') return '再按久一点';
    if (type === 'drag') return this.dragLabelFor(id);
    if (id.startsWith('exit_')) return '还有物件没有完成';
    return this.labelFor(id);
  }
}
