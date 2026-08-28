import * as THREE from 'three';
import { TransformControls, type TransformControlsMode } from 'three/examples/jsm/controls/TransformControls.js';
import { SceneManager, sceneDefinitions } from './SceneManager';

type SceneChangeHandler = (index: number) => Promise<void>;

const objectLabels: Record<string, string> = {
  stage_back_visual: '后墙',
  stage_left_visual: '左墙',
  stage_right_visual: '右墙',
  stage_floor_visual: '地面',
  stage_lip_visual: '舞台前沿',
  school_ceiling_visual: '走廊天花板',
  school_left_open_wall_visual: '左侧开放窗洞',
  school_outside_bays_visual: '窗外校园远景',
  school_ceiling_beams_visual: '连续天花横梁',
  school_ceiling_aging_visual: '天花旧漆水痕',
  school_atmosphere_visual: '场景氛围层',
  school_floor_reflection_visual: '地面潮湿反光',
  school_right_doorway_visual: '右侧门洞',
  school_right_doorway_lintel_visual: '右侧门洞横梁',
  school_right_doorway_jamb_visual: '右侧门洞边柱',
  school_turn_floor_visual: '尽头转折地面',
  school_turn_back_visual: '尽头转折后墙',
  school_turn_pier_visual: '尽头转折墙柱',
  school_wall_conduit_visual: '右上金属电线管',
  school_wall_conduit_clamps_visual: '电线管卡扣',
  school_wall_conduit_drop_visual: '电线管竖管',
  school_lockers_visual: '蓝绿色储物柜',
  school_cleaning_corner_visual: '扫帚拖把水桶',
  school_bench_visual: '木长凳与暖水瓶',
  school_foreground_bamboo_visual: '左上近景竹叶',
  school_foreground_bamboo_v2_visual: '左上近景竹叶',
  school_foreground_railing_visual: '左下楼梯栏杆',
  school_foreground_stool_visual: '右下木凳边缘',
  curtain_visual: '可交互窗扇',
  fog_glass_visual: '可擦雾玻璃',
  radio_visual: '广播',
  clock_visual: '墙钟',
  exit_door_visual: '学校出口门',
  station_ceiling_visual: '候车室天花板',
  station_architecture_v2_visual: '候车厅建筑结构',
  station_columns_visual: '候车厅柱列',
  station_ceiling_beams_visual: '候车厅天花横梁',
  station_far_wall_visual: '候车厅远端门洞',
  station_outside_platform_visual: '两侧雨中站台',
  station_hanging_lamps_visual: '旧吊灯',
  station_ceiling_fans_visual: '旧吊扇',
  station_luggage_visual: '旧行李',
  station_luggage_1_visual: '右侧旧行李一',
  station_luggage_2_visual: '右侧旧行李二',
  station_luggage_3_visual: '左下前景皮箱',
  station_small_props_visual: '雨伞架与垃圾桶',
  station_trash_bin_visual: '右侧旧垃圾桶',
  station_umbrella_stand_1_visual: '右下前景伞桶',
  station_umbrella_stand_2_visual: '右侧中景伞桶',
  station_atmosphere_visual: '候车厅雨雾氛围',
  station_floor_reflection_visual: '候车室地面反光',
  board_visual: '电子屏',
  exit_bus_door_visual: '客运车门',
  station_benches_visual: '候车椅',
  ticket_visual: '车票',
  station_ticket_glow_visual: '车票提示微光',
  gate_visual: '检票箱',
  iron_door_visual: '铁门',
  wall_visual: '墙面变化',
  sound_light_visual: '灯',
  red_paper_visual: '奖状',
  building_stairs_visual: '楼梯',
  bike_visual: '自行车',
  building_ceiling_visual: '楼道天花板',
  screen_frame_visual: '银幕外框',
  screen_visual: '银幕',
  projector_stand_visual: '放映机支架',
  projector_visual: '放映机',
  memory_table_visual: '记忆桌',
  archive_cabinet_visual: '档案袋',
  final_fragment_visual: '记忆碎片',
  archive_shelf_visual: '档案架',
  projection_branches_visual: '银色枝干',
  projection_ceiling_visual: '放映厅天花板'
};

const formatNumber = (value: number): string => {
  const rounded = Math.abs(value) < 0.0005 ? 0 : Math.round(value * 1000) / 1000;
  return String(rounded);
};

export class SceneEditor {
  private readonly controls: TransformControls;
  private readonly helper: THREE.Object3D;
  private readonly raycaster = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();
  private readonly panel = document.createElement('aside');
  private readonly objectSelect: HTMLSelectElement;
  private readonly axisInputs: HTMLInputElement[];
  private readonly status: HTMLElement;
  private readonly selectedLabel: HTMLElement;
  private readonly orientationLabel: HTMLElement;
  private readonly box = new THREE.Box3Helper(new THREE.Box3(), 0xffd5ed);
  private readonly originalVisibility = new WeakMap<THREE.Object3D, boolean>();
  private selected: THREE.Object3D | null = null;
  private rootId: string | null = null;
  private mode: TransformControlsMode = 'translate';
  private uniformScale = true;
  private pointerDown = new THREE.Vector2();
  private gizmoWasActive = false;
  private lastPickPoint = new THREE.Vector2(-1000, -1000);
  private lastPickTime = 0;
  private pickCycle = 0;

  constructor(
    private readonly container: HTMLElement,
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: THREE.Camera,
    private readonly sceneManager: SceneManager,
    private readonly onSceneChange: SceneChangeHandler
  ) {
    this.controls = new TransformControls(camera, canvas);
    this.controls.size = 0.72;
    this.controls.setMode(this.mode);
    this.helper = this.controls.getHelper();
    this.sceneManager.scene.add(this.helper);
    this.box.visible = false;
    this.sceneManager.scene.add(this.box);

    this.panel.className = 'scene-editor';
    this.panel.innerHTML = `
      <header class="scene-editor__header">
        <div><strong>场景布局编辑器</strong><span data-role="orientation"></span></div>
        <button type="button" class="editor-icon-button" data-action="collapse" title="收起编辑器" aria-label="收起编辑器">−</button>
      </header>
      <nav class="scene-editor__scenes" aria-label="切换场景"></nav>
      <div class="scene-editor__body">
        <label class="editor-field editor-field--object">物体
          <select data-role="objects" aria-label="选择物体"></select>
        </label>
        <div class="editor-selection" data-role="selected">请点击画面中的物体</div>
        <div class="editor-segments" aria-label="变换方式">
          <button type="button" class="active" data-mode="translate">移动</button>
          <button type="button" data-mode="rotate">旋转</button>
          <button type="button" data-mode="scale">缩放</button>
        </div>
        <div class="editor-axis-grid">
          <span class="editor-axis-title" data-role="axis-title">位置（米）</span>
          ${['x', 'y', 'z'].map((axis) => `
            <div class="editor-axis-row">
              <b>${axis.toUpperCase()}</b>
              <button type="button" data-nudge="-1" data-axis="${axis}" aria-label="减小 ${axis.toUpperCase()}">−</button>
              <input type="number" inputmode="decimal" data-axis-input="${axis}" step="0.05" aria-label="${axis.toUpperCase()} 数值" />
              <button type="button" data-nudge="1" data-axis="${axis}" aria-label="增大 ${axis.toUpperCase()}">＋</button>
            </div>`).join('')}
        </div>
        <label class="editor-check"><input type="checkbox" data-role="uniform" checked /> 等比缩放</label>
        <div class="editor-actions">
          <button type="button" data-action="reset-object">复原物体</button>
          <button type="button" data-action="reset-scene">复原本场景</button>
          <button type="button" data-action="export">导出布局</button>
          <button type="button" data-action="import">导入布局</button>
          <input type="file" data-role="import-file" accept="application/json,.json" hidden />
        </div>
        <div class="editor-status" data-role="status">调整后自动保存</div>
      </div>
      <button type="button" class="editor-finish" data-action="preview">完成并预览游戏</button>
    `;
    this.container.append(this.panel);

    this.objectSelect = this.panel.querySelector('[data-role="objects"]') as HTMLSelectElement;
    this.axisInputs = Array.from(this.panel.querySelectorAll<HTMLInputElement>('[data-axis-input]'));
    this.status = this.panel.querySelector('[data-role="status"]') as HTMLElement;
    this.selectedLabel = this.panel.querySelector('[data-role="selected"]') as HTMLElement;
    this.orientationLabel = this.panel.querySelector('[data-role="orientation"]') as HTMLElement;
    this.buildSceneButtons();
    this.bindEvents();
  }

  update(): void {
    if (this.rootId !== this.sceneManager.activeRootId) this.refreshScene();
    if (this.selected && this.box.visible) {
      this.box.box.setFromObject(this.selected);
      this.box.updateMatrixWorld(true);
    }
  }

  private buildSceneButtons(): void {
    const nav = this.panel.querySelector('[aria-label="切换场景"]') as HTMLElement;
    sceneDefinitions.forEach((definition, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.scene = String(index);
      button.textContent = String(index + 1);
      button.title = definition.title;
      nav.append(button);
    });
  }

  private bindEvents(): void {
    this.controls.addEventListener('objectChange', () => {
      if (!this.selected) return;
      this.sceneManager.previewEditedObject(this.selected);
      this.updateInputs();
    });
    this.controls.addEventListener('mouseDown', () => {
      this.gizmoWasActive = true;
    });
    this.controls.addEventListener('mouseUp', () => {
      this.saveSelection();
      window.setTimeout(() => (this.gizmoWasActive = false), 0);
    });

    this.canvas.addEventListener('pointerdown', (event) => this.pointerDown.set(event.clientX, event.clientY));
    this.canvas.addEventListener('pointerup', this.handleCanvasPointerUp);
    this.objectSelect.addEventListener('change', () => {
      const object = this.sceneManager.getEditableObjects().find((item) => item.uuid === this.objectSelect.value) ?? null;
      this.select(object);
    });

    this.panel.addEventListener('click', this.handlePanelClick);
    this.panel.querySelector('[data-role="uniform"]')?.addEventListener('change', (event) => {
      this.uniformScale = (event.target as HTMLInputElement).checked;
    });
    for (const input of this.axisInputs) input.addEventListener('change', this.handleInputChange);
    this.panel.querySelector<HTMLInputElement>('[data-role="import-file"]')?.addEventListener('change', this.handleImport);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  private readonly handleCanvasPointerUp = (event: PointerEvent): void => {
    if (this.gizmoWasActive || this.controls.dragging) return;
    const point = new THREE.Vector2(event.clientX, event.clientY);
    if (point.distanceTo(this.pointerDown) > 7) return;
    this.pick(point);
  };

  private readonly handlePanelClick = (event: MouseEvent): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!button) return;
    const sceneIndex = button.dataset.scene;
    if (sceneIndex !== undefined) {
      void this.switchScene(Number(sceneIndex));
      return;
    }
    const mode = button.dataset.mode as TransformControlsMode | undefined;
    if (mode) {
      this.setMode(mode);
      return;
    }
    if (button.dataset.nudge) {
      this.nudge(button.dataset.axis ?? 'x', Number(button.dataset.nudge));
      return;
    }
    const action = button.dataset.action;
    if (action === 'collapse') this.panel.classList.toggle('collapsed');
    if (action === 'reset-object' && this.selected) {
      this.sceneManager.resetEditedObject(this.selected);
      this.updateInputs();
      this.setStatus('已复原这个物体');
    }
    if (action === 'reset-scene') {
      this.sceneManager.resetCurrentEditorLayout();
      this.updateInputs();
      this.setStatus('已复原当前场景');
    }
    if (action === 'export') this.exportLayouts();
    if (action === 'import') this.panel.querySelector<HTMLInputElement>('[data-role="import-file"]')?.click();
    if (action === 'preview') {
      const url = new URL(location.href);
      url.searchParams.delete('edit');
      url.searchParams.set('scene', String(this.sceneManager.currentSceneIndex + 1));
      location.href = url.toString();
    }
  };

  private readonly handleInputChange = (event: Event): void => {
    if (!this.selected) return;
    const input = event.target as HTMLInputElement;
    const axis = input.dataset.axisInput as 'x' | 'y' | 'z';
    const value = Number(input.value);
    if (!Number.isFinite(value)) return;
    if (this.mode === 'translate') this.selected.position[axis] = value;
    if (this.mode === 'rotate') this.selected.rotation[axis] = THREE.MathUtils.degToRad(value);
    if (this.mode === 'scale') {
      const safe = Math.max(0.01, value);
      if (this.uniformScale) this.selected.scale.setScalar(safe);
      else this.selected.scale[axis] = safe;
    }
    this.selected.updateMatrixWorld(true);
    this.sceneManager.previewEditedObject(this.selected);
    this.saveSelection();
    this.updateInputs();
  };

  private readonly handleImport = async (event: Event): Promise<void> => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      await this.sceneManager.importEditorLayouts(await file.text());
      this.setStatus('布局已导入');
    } catch (error) {
      this.setStatus(error instanceof Error ? error.message : '导入失败', true);
    } finally {
      input.value = '';
    }
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement;
    if (target.matches('input, select, textarea')) return;
    if (event.key.toLowerCase() === 'w') this.setMode('translate');
    if (event.key.toLowerCase() === 'e') this.setMode('rotate');
    if (event.key.toLowerCase() === 'r') this.setMode('scale');
  };

  private async switchScene(index: number): Promise<void> {
    this.detachSelection();
    this.setStatus('正在切换场景…');
    await this.onSceneChange(index);
    const url = new URL(location.href);
    url.searchParams.set('scene', String(index + 1));
    history.replaceState({}, '', url);
    this.refreshScene();
    this.setStatus('调整后自动保存');
  }

  private refreshScene(): void {
    this.detachSelection();
    this.rootId = this.sceneManager.activeRootId;
    const objects = this.sceneManager.getEditableObjects();
    this.objectSelect.replaceChildren();
    const prompt = document.createElement('option');
    prompt.value = '';
    prompt.textContent = '从画面点击，或在这里选择';
    this.objectSelect.append(prompt);
    for (const object of objects) {
      const option = document.createElement('option');
      option.value = object.uuid;
      option.textContent = `${objectLabels[object.name] ?? object.name} · ${object.name}`;
      this.objectSelect.append(option);
    }
    this.orientationLabel.textContent = this.sceneManager.layoutOrientation === 'portrait' ? '竖屏布局' : '横屏布局';
    for (const button of this.panel.querySelectorAll<HTMLButtonElement>('[data-scene]')) {
      button.classList.toggle('active', Number(button.dataset.scene) === this.sceneManager.currentSceneIndex);
    }
  }

  private pick(point: THREE.Vector2): void {
    const rect = this.canvas.getBoundingClientRect();
    this.ndc.set(((point.x - rect.left) / rect.width) * 2 - 1, -(((point.y - rect.top) / rect.height) * 2 - 1));
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const editable = this.sceneManager.getEditableObjects();
    const editableSet = new Set(editable);
    const choices: THREE.Object3D[] = [];
    for (const hit of this.raycaster.intersectObjects(editable, true)) {
      let object: THREE.Object3D | null = hit.object;
      while (object && !editableSet.has(object)) object = object.parent;
      if (object && !choices.includes(object)) choices.push(object);
    }
    if (choices.length === 0) {
      this.select(null);
      return;
    }
    const now = performance.now();
    if (point.distanceTo(this.lastPickPoint) < 10 && now - this.lastPickTime < 750) this.pickCycle += 1;
    else this.pickCycle = 0;
    this.lastPickPoint.copy(point);
    this.lastPickTime = now;
    this.select(choices[this.pickCycle % choices.length]);
  }

  private select(object: THREE.Object3D | null): void {
    if (object === this.selected) return;
    this.detachSelection();
    this.selected = object;
    if (!object) {
      this.objectSelect.value = '';
      this.selectedLabel.textContent = '请点击画面中的物体';
      return;
    }
    this.originalVisibility.set(object, object.visible);
    if (!object.visible) object.visible = true;
    this.controls.attach(object);
    this.box.visible = true;
    this.box.box.setFromObject(object);
    this.objectSelect.value = object.uuid;
    this.selectedLabel.textContent = `${objectLabels[object.name] ?? object.name} · ${object.name}`;
    this.updateInputs();
  }

  private detachSelection(): void {
    if (this.selected && this.originalVisibility.has(this.selected)) {
      this.selected.visible = this.originalVisibility.get(this.selected) ?? true;
    }
    this.controls.detach();
    this.box.visible = false;
    this.selected = null;
  }

  private setMode(mode: TransformControlsMode): void {
    this.mode = mode;
    this.controls.setMode(mode);
    this.controls.setSpace(mode === 'translate' ? 'world' : 'local');
    this.panel.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
      button.classList.toggle('active', button.dataset.mode === mode);
    });
    const titles = { translate: '位置（米）', rotate: '旋转（度）', scale: '缩放倍率' };
    const title = this.panel.querySelector('[data-role="axis-title"]');
    if (title) title.textContent = titles[mode];
    this.panel.classList.toggle('scale-mode', mode === 'scale');
    this.updateInputs();
  }

  private nudge(axisName: string, direction: number): void {
    if (!this.selected) return;
    const axis = axisName as 'x' | 'y' | 'z';
    if (this.mode === 'translate') this.selected.position[axis] += direction * 0.05;
    if (this.mode === 'rotate') this.selected.rotation[axis] += THREE.MathUtils.degToRad(direction * 1);
    if (this.mode === 'scale') {
      const next = Math.max(0.01, this.selected.scale[axis] + direction * 0.05);
      if (this.uniformScale) this.selected.scale.setScalar(next);
      else this.selected.scale[axis] = next;
    }
    this.selected.updateMatrixWorld(true);
    this.sceneManager.previewEditedObject(this.selected);
    this.saveSelection();
    this.updateInputs();
  }

  private updateInputs(): void {
    for (const input of this.axisInputs) {
      const axis = input.dataset.axisInput as 'x' | 'y' | 'z';
      input.disabled = !this.selected;
      if (!this.selected) {
        input.value = '';
        continue;
      }
      const value = this.mode === 'translate'
        ? this.selected.position[axis]
        : this.mode === 'rotate'
          ? THREE.MathUtils.radToDeg(this.selected.rotation[axis])
          : this.selected.scale[axis];
      input.value = formatNumber(value);
      input.step = this.mode === 'rotate' ? '1' : '0.05';
    }
  }

  private saveSelection(): void {
    if (!this.selected) return;
    this.sceneManager.saveEditedObject(this.selected);
    this.setStatus(`已保存 ${objectLabels[this.selected.name] ?? this.selected.name}`);
  }

  private exportLayouts(): void {
    const blob = new Blob([this.sceneManager.exportEditorLayouts()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'no-place-scene-layouts.json';
    link.click();
    URL.revokeObjectURL(url);
    this.setStatus('布局文件已导出');
  }

  private setStatus(message: string, error = false): void {
    this.status.textContent = message;
    this.status.classList.toggle('error', error);
  }
}
