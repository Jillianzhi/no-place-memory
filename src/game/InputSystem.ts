import * as THREE from 'three';

export interface PointerState {
  id: number;
  start: THREE.Vector2;
  current: THREE.Vector2;
  previous: THREE.Vector2;
  startedAt: number;
  moved: boolean;
}

type MoveHandler = (point: THREE.Vector2, state?: PointerState) => void;
type DownHandler = (point: THREE.Vector2, state: PointerState) => void;
type UpHandler = (point: THREE.Vector2, state: PointerState) => void;

export class InputSystem {
  static readonly longPressMs = 700;
  static readonly dragThresholdPx = 8;

  private state: PointerState | null = null;
  private readonly downHandlers = new Set<DownHandler>();
  private readonly moveHandlers = new Set<MoveHandler>();
  private readonly upHandlers = new Set<UpHandler>();

  constructor(private readonly element: HTMLElement) {
    this.element.style.touchAction = 'none';
    this.element.addEventListener('pointerdown', this.onPointerDown);
    this.element.addEventListener('pointermove', this.onPointerMove);
    this.element.addEventListener('pointerup', this.onPointerUp);
    this.element.addEventListener('pointercancel', this.onPointerUp);
  }

  onDown(handler: DownHandler): void {
    this.downHandlers.add(handler);
  }

  onMove(handler: MoveHandler): void {
    this.moveHandlers.add(handler);
  }

  onUp(handler: UpHandler): void {
    this.upHandlers.add(handler);
  }

  dispose(): void {
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.removeEventListener('pointerup', this.onPointerUp);
    this.element.removeEventListener('pointercancel', this.onPointerUp);
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    event.preventDefault();
    this.element.setPointerCapture(event.pointerId);
    const point = new THREE.Vector2(event.clientX, event.clientY);
    this.state = {
      id: event.pointerId,
      start: point.clone(),
      current: point.clone(),
      previous: point.clone(),
      startedAt: performance.now(),
      moved: false
    };
    for (const handler of this.downHandlers) handler(point, this.state);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (this.state && event.pointerId === this.state.id) event.preventDefault();
    const point = new THREE.Vector2(event.clientX, event.clientY);
    if (this.state && event.pointerId === this.state.id) {
      this.state.previous.copy(this.state.current);
      this.state.current.copy(point);
      if (this.state.current.distanceTo(this.state.start) >= InputSystem.dragThresholdPx) {
        this.state.moved = true;
      }
    }
    for (const handler of this.moveHandlers) handler(point, this.state ?? undefined);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.state || event.pointerId !== this.state.id) return;
    const point = new THREE.Vector2(event.clientX, event.clientY);
    this.state.previous.copy(this.state.current);
    this.state.current.copy(point);
    for (const handler of this.upHandlers) handler(point, this.state);
    if (this.element.hasPointerCapture(event.pointerId)) this.element.releasePointerCapture(event.pointerId);
    this.state = null;
  };
}
