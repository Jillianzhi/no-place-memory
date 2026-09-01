import * as THREE from 'three';

export class CameraRig {
  readonly camera: THREE.PerspectiveCamera;
  private readonly basePosition = new THREE.Vector3(0, 1.42, 4.85);
  private readonly target = new THREE.Vector3(0, 0.9, -0.2);
  private pointerParallax = new THREE.Vector2();
  private portrait = false;
  private viewportAspect = 1;
  private sceneIndex = 0;
  private compareMode = false;
  private readonly portraitDistances = [5.75, 5.9, 5.78, 5.86] as const;
  private readonly portraitTargets = [1.42, 1.42, 1.4, 1.44] as const;

  constructor(width: number, height: number) {
    this.camera = new THREE.PerspectiveCamera(39, width / height, 0.1, 100);
    this.resize(width, height);
    this.camera.position.copy(this.basePosition);
    this.camera.lookAt(this.target);
  }

  resize(width: number, height: number): void {
    this.viewportAspect = width / height;
    const nextPortrait = height > width * 1.08;
    const modeChanged = nextPortrait !== this.portrait;
    this.portrait = nextPortrait;
    this.applyAspect();
    this.camera.fov = this.sceneIndex === 0
      ? (this.portrait ? 54 : 43)
      : (this.portrait ? 50 : width < 720 ? 48 : 39);
    this.camera.updateProjectionMatrix();
    if (modeChanged) this.setScene(this.sceneIndex);
  }

  setScene(index: number): void {
    this.sceneIndex = index;
    this.applyAspect();
    if (this.portrait) {
      if (index === 0) {
        this.camera.fov = 50;
        this.camera.updateProjectionMatrix();
        this.basePosition.set(0, 1.52, 5.75);
        this.target.set(0.04, 1.37, -7.4);
        return;
      }
      if (index === 1) {
        this.camera.fov = 48;
        this.camera.updateProjectionMatrix();
        this.basePosition.set(0.02, 1.62, 6.15);
        this.target.set(0.28, 1.3, -5.55);
        return;
      }
      if (index === 2) {
        this.camera.fov = 52;
        this.camera.updateProjectionMatrix();
        this.basePosition.set(0, 1.82, 7.2);
        this.target.set(0, 1.28, -2.3);
        return;
      }
      if (index === 3) {
        this.camera.fov = 55;
        this.camera.updateProjectionMatrix();
        this.basePosition.set(0, 1.58, 7.2);
        this.target.set(0, 1.54, -2.3);
        return;
      }
      if (index === 4) {
        this.camera.fov = 53;
        this.camera.updateProjectionMatrix();
        this.basePosition.set(0, 1.62, 5.8);
        this.target.set(0, 1.55, -9.2);
        return;
      }
      this.basePosition.set(0, 1.46, this.portraitDistances[index] ?? 5.8);
      this.target.set(0, this.portraitTargets[index] ?? 1.42, -0.2);
      return;
    }
    if (index === 0) {
      this.camera.fov = 46;
      this.camera.updateProjectionMatrix();
      this.basePosition.set(-0.24, 1.5, 4.8);
      this.target.set(-0.16, 1.34, -8.2);
      return;
    }
    if (index === 1) {
      this.camera.fov = 48;
      this.camera.updateProjectionMatrix();
      this.basePosition.set(0.12, 1.55, 5.6);
      this.target.set(0, 1.34, -6.5);
      return;
    }
    if (index === 2) {
      this.camera.fov = 44;
      this.camera.updateProjectionMatrix();
      this.basePosition.set(0, 1.72, 5.85);
      this.target.set(0, 1.48, -2.25);
      return;
    }
    if (index === 3) {
      this.camera.fov = 43;
      this.camera.updateProjectionMatrix();
      this.basePosition.set(0, 1.58, 5.7);
      this.target.set(0, 1.55, -2.45);
      return;
    }
    if (index === 4) {
      this.camera.fov = 45;
      this.camera.updateProjectionMatrix();
      this.basePosition.set(0, 1.62, 5.15);
      this.target.set(0, 1.5, -9.8);
      return;
    }
    this.basePosition.set(0.08, 1.42, index === 1 ? 5.05 : 4.85);
    this.target.set(0, 0.9, -0.2);
  }

  private applyAspect(): void {
    this.camera.aspect = this.portrait && this.sceneIndex >= 1
      ? Math.max(this.viewportAspect, 0.54)
      : this.viewportAspect;
  }

  setPointer(normalized: THREE.Vector2): void {
    if (this.compareMode) return;
    this.pointerParallax.copy(normalized);
  }

  setCompareMode(enabled: boolean): void {
    this.compareMode = enabled;
    if (enabled) this.pointerParallax.set(0, 0);
  }

  update(time: number): void {
    const breath = this.compareMode ? 0 : Math.sin(time * 0.0007) * 0.035;
    this.camera.position.lerp(
      new THREE.Vector3(
        this.basePosition.x + this.pointerParallax.x * 0.08,
        this.basePosition.y + this.pointerParallax.y * 0.05 + breath,
        this.basePosition.z
      ),
      0.055
    );
    this.camera.lookAt(this.target);
  }
}
