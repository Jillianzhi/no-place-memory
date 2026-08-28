import * as THREE from 'three';
import { ArchiveSystem } from './ArchiveSystem';
import { AssetLoader } from './AssetLoader';
import { AudioSystem } from './AudioSystem';
import { CameraRig } from './CameraRig';
import { DebugPanel } from './DebugPanel';
import { FogSystem } from './FogSystem';
import { InteractionSystem, type InteractionFeedback } from './InteractionSystem';
import { ParticleSystem } from './ParticleSystem';
import { SceneManager } from './SceneManager';
import { SceneEditor } from './SceneEditor';

interface ArchiveProfile {
  code: string;
  mark: string;
  summary: string;
  tags: [string, string, string];
}

const archiveProfiles: Record<string, ArchiveProfile> = {
  空间校对员: {
    code: 'A-03',
    mark: '校对',
    summary: '你习惯先确认空间里的细微偏差，再允许一段记忆继续向前。',
    tags: ['观察敏锐', '动作克制', '偏差修正']
  },
  时间褶皱拾荒者: {
    code: 'B-17',
    mark: '拾荒',
    summary: '你会在被忽略的角落里停下，把无人认领的时间重新带回光下。',
    tags: ['寻找隐藏', '触觉记忆', '路径游移']
  },
  错误记忆保管员: {
    code: 'C-08',
    mark: '保管',
    summary: '你没有丢弃错误的触碰，而是让它们成为辨认真实位置的坐标。',
    tags: ['反复确认', '容纳误差', '记忆留存']
  },
  没有归档的人: {
    code: 'X-00',
    mark: '游离',
    summary: '你的行动尚未被任何一种档案完全解释，仍停留在场所之间。',
    tags: ['未定路径', '低声经过', '保持开放']
  }
};

const archiveSceneOrder = [
  ['没有结束的午休', '旧学校走廊'],
  ['没有终点的候车室', '老县城候车室'],
  ['仍然亮着灯的楼道', '家属院楼道'],
  ['没有归处的放映厅', '旧放映厅'],
  ['记忆不会排成一列', '旧照片长廊']
] as const;

const music = {
  bookend: '/assets/dreamcore/audio/music_bookend.m4a',
  school: '/assets/dreamcore/audio/music_school.m4a',
  station: '/assets/dreamcore/audio/music_station.m4a',
  building: '/assets/dreamcore/audio/music_building.m4a',
  corridor: '/assets/dreamcore/audio/music_corridor.m4a'
} as const;

const archiveObjectLabels: Record<string, string> = {
  hotspot_radio: '旧广播',
  hotspot_fog_glass: '雾玻璃',
  hotspot_clock: '停住的时钟',
  hotspot_ticket: '旧车票',
  hotspot_board: '电子屏',
  hotspot_gate: '检票口',
  hotspot_wall: '楼道墙面',
  hotspot_sound_light: '声控灯',
  hotspot_bike: '自行车',
  hotspot_red_paper: '褪色奖状',
  hotspot_iron_door: '铁门',
  hotspot_projector: '放映机',
  hotspot_archive_cabinet: '档案袋',
  hotspot_screen: '银幕',
  hotspot_memory_table: '记忆碎片',
  hotspot_final_fragment: '记忆碎片',
  hotspot_memory_near: '近处照片',
  hotspot_memory_middle: '中段照片',
  hotspot_memory_far: '尽头照片',
  hotspot_memory_photo: '旧照片'
};

export class Game {
  private readonly compareParam = new URLSearchParams(location.search).get('compare');
  private readonly compareMode = this.compareParam === '1' || this.compareParam === 'clean';
  private readonly editorMode = new URLSearchParams(location.search).get('edit') === '1';
  private readonly directSceneMode = new URLSearchParams(location.search).has('scene');
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  private readonly cameraRig: CameraRig;
  private readonly sceneManager = new SceneManager(new AssetLoader());
  private readonly archive = new ArchiveSystem();
  private readonly audio = new AudioSystem();
  private readonly debug = new DebugPanel();
  private readonly particles = new ParticleSystem();
  private readonly fog = new FogSystem();
  private readonly interaction: InteractionSystem;
  private readonly editor: SceneEditor | null;
  private readonly editorPreview: HTMLDivElement | null;
  private readonly overlay = document.createElement('section');
  private readonly sceneTitle = document.createElement('div');
  private readonly progress = document.createElement('div');
  private readonly objectives = document.createElement('div');
  private readonly hint = document.createElement('div');
  private readonly holdRing = document.createElement('div');
  private readonly toast = document.createElement('div');
  private hit: string | null = null;
  private lastFrame = performance.now();
  private fps = 60;
  private started = false;

  constructor(private readonly container: HTMLElement) {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.compareMode ? 0.92 : 1.02;
    if (this.editorMode) {
      this.editorPreview = document.createElement('div');
      this.editorPreview.className = 'editor-preview-shell';
      this.editorPreview.setAttribute('aria-label', '手机竖屏游戏画面');
      this.editorPreview.append(this.renderer.domElement);
      this.container.append(this.editorPreview);
    } else {
      this.editorPreview = null;
      this.container.append(this.renderer.domElement);
    }

    const initialViewport = this.getRenderViewport();
    this.renderer.setSize(initialViewport.width, initialViewport.height, !this.editorMode);

    this.cameraRig = new CameraRig(initialViewport.width, initialViewport.height);
    this.cameraRig.setCompareMode(this.compareMode || this.editorMode);
    this.sceneManager.setCompareMode(this.compareMode);
    this.interaction = new InteractionSystem(this.renderer.domElement, this.cameraRig.camera, this.sceneManager, this.archive, this.audio);
    this.interaction.setEnabled(!this.editorMode);
    this.interaction.setHitHandler((id) => (this.hit = id));
    this.interaction.setFeedbackHandler(this.handleFeedback);

    this.sceneManager.scene.add(this.particles.group, this.fog.group);
    this.sceneManager.setHandlers(this.handleComplete, this.showMessage);

    this.overlay.className = 'game-overlay';
    this.sceneTitle.className = 'scene-title';
    this.progress.className = 'progress-runes';
    this.objectives.className = 'objective-panel';
    this.hint.className = 'gesture-hint';
    this.holdRing.className = 'hold-ring';
    this.toast.className = 'toast';
    this.overlay.append(this.sceneTitle, this.progress, this.objectives, this.hint, this.holdRing, this.toast);
    this.container.append(this.overlay);

    this.editor = this.editorMode
      ? new SceneEditor(this.container, this.renderer.domElement, this.cameraRig.camera, this.sceneManager, this.switchEditorScene)
      : null;

    if (this.editorMode) {
      document.documentElement.classList.add('scene-editing');
      this.started = true;
      requestAnimationFrame(this.resize);
    }

    if (this.directSceneMode) this.started = true;

    if (this.compareMode) {
      document.documentElement.classList.add('visual-compare');
      this.started = true;
      if (this.compareParam === '1') {
        const reference = document.createElement('img');
        reference.className = 'visual-compare-reference';
        reference.src = '/assets/reference/scene01_corridor_reference.png';
        reference.alt = '';
        this.container.append(reference);
      }
    }

    window.addEventListener('resize', this.resize);
    window.addEventListener('pointerdown', this.unlockAudio, { passive: true });
    window.addEventListener('touchstart', this.unlockAudio, { passive: true });
    window.addEventListener('click', this.unlockAudio);
    window.addEventListener('keydown', this.unlockAudio);
    window.addEventListener('pointermove', this.pointerParallax, { passive: true });
    this.sceneManager.setViewport(initialViewport.width, initialViewport.height);
    if (!this.compareMode && !this.editorMode && !this.directSceneMode) this.showStart();
  }

  private readonly unlockAudio = (): void => {
    this.audio.unlock();
  };

  start(): void {
    const sceneParam = Number(new URLSearchParams(location.search).get('scene') ?? '1');
    const initialScene = Number.isFinite(sceneParam) ? Math.min(5, Math.max(1, sceneParam)) - 1 : 0;
    this.cameraRig.setScene(initialScene);
    void this.sceneManager.load(initialScene).then(() => {
      this.archive.enterScene(this.sceneManager.currentDefinition.title);
      if (this.directSceneMode) this.syncSceneMusic();
      this.updateHud();
      this.animate();
    });
  }

  private showStart(): void {
    document.documentElement.classList.add('intro-active');
    const start = document.createElement('div');
    start.className = 'start-card';
    start.setAttribute('role', 'dialog');
    start.setAttribute('aria-label', '游戏开场');
    start.innerHTML = `
      <div class="start-atmosphere" aria-hidden="true">
        <span class="start-aperture"></span>
        <span class="start-scanline"></span>
      </div>
      <div class="start-topline" aria-hidden="true">
        <span>NO PLACE ARCHIVE</span>
        <span>ENTRY / 01</span>
      </div>
      <div class="start-content">
        <div class="start-index">一份尚未归档的空间记录</div>
        <h1><span>不在此处，</span><span>不在别处</span></h1>
        <p>五个无人空间，正在等待一次轻轻触碰。</p>
        <button class="primary-button start-button" aria-label="开始游戏">开始游戏</button>
      </div>
      <div class="start-footnote">建议佩戴耳机 · 声音将在进入后开启</div>
    `;
    this.container.append(start);
    start.querySelector<HTMLButtonElement>('button')?.addEventListener('click', (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      button.disabled = true;
      this.started = true;
      this.audio.unlock();
      this.audio.playSfx('entry_door');
      this.audio.playMusic(music.bookend, false);
      start.classList.add('is-leaving');
      window.setTimeout(() => {
        start.remove();
        document.documentElement.classList.remove('intro-active');
        this.syncSceneMusic();
        this.showMessage(this.sceneManager.currentDefinition.title);
      }, 1050);
    });
  }

  private readonly handleComplete = (kind: 'scene' | 'game'): void => {
    if (kind === 'scene') {
      this.archive.enterScene(this.sceneManager.currentDefinition.title);
      this.cameraRig.setScene(this.sceneManager.currentSceneIndex);
      this.syncSceneMusic();
      window.setTimeout(() => this.updateHud(), 30);
      return;
    }
    this.audio.playMusic(music.bookend, false);
    this.audio.playSfx('dossier_reveal');
    this.showArchive();
  };

  private syncSceneMusic(): void {
    const scene = this.sceneManager.currentDefinition.id;
    if (scene === 'scene01_school') this.audio.playMusic(music.school, false);
    else if (scene === 'scene02_station') this.audio.playMusic(music.station, false);
    else if (scene === 'scene03_building') this.audio.playMusic(music.building, false);
    else this.audio.playMusic(music.corridor, false);
  }

  private showArchive(): void {
    const data = this.archive.finalize();
    const result = data.resultType ?? '没有归档的人';
    const profile = archiveProfiles[result] ?? archiveProfiles['没有归档的人'];
    const panel = document.createElement('div');
    panel.className = 'archive-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', '最终身份档案');
    const dragRate = data.dragAttempts ? Math.round((data.dragSuccesses / data.dragAttempts) * 100) : 0;
    const observeRate = data.observeAttempts ? Math.round((data.observeSuccesses / data.observeAttempts) * 100) : 0;
    const totalSeconds = Object.values(data.sceneTimes).reduce((total, seconds) => total + seconds, 0);
    const maxSceneSeconds = Math.max(1, ...Object.values(data.sceneTimes));
    const archiveNumber = `NP-${String(Math.round(totalSeconds * 10 + data.errorCount * 37 + data.hiddenFound * 61) % 100000).padStart(5, '0')}-${profile.code}`;
    const firstTouched = archiveObjectLabels[data.firstTouchedObject ?? ''] ?? '未被记录的物件';
    const longestPlace = archiveSceneOrder.find(([title]) => title === data.longestScene)?.[1] ?? data.longestScene ?? '未记录';
    const routeRows = archiveSceneOrder.map(([title, place], index) => {
      const seconds = data.sceneTimes[title] ?? 0;
      const routeWidth = Math.max(seconds > 0 ? 8 : 0, Math.round((seconds / maxSceneSeconds) * 100));
      return `
        <div class="archive-route-row">
          <span class="archive-route-index">0${index + 1}</span>
          <div class="archive-route-copy"><strong>${place}</strong><i style="--route:${routeWidth}%"></i></div>
          <time>${this.formatArchiveTime(seconds)}</time>
        </div>`;
    }).join('');
    panel.innerHTML = `
      <div class="archive-paper">
        <header class="archive-header">
          <div>
            <span class="archive-kicker">非场所居民身份档案</span>
            <strong class="archive-number">${archiveNumber}</strong>
          </div>
          <span class="archive-status">档案已生成</span>
        </header>

        <section class="archive-identity" aria-label="最终身份">
          <div class="archive-mark" aria-hidden="true">${profile.mark}</div>
          <div>
            <span class="archive-section-label">最终身份</span>
            <h2>${result}</h2>
            <p class="archive-summary">${profile.summary}</p>
          </div>
        </section>

        <div class="archive-tags" aria-label="身份倾向">
          ${profile.tags.map((tag) => `<span>${tag}</span>`).join('')}
        </div>

        <section class="archive-section">
          <div class="archive-section-title"><span>行为记录</span><em>共经过 5 个空间</em></div>
          <div class="archive-metrics">
            <dl><dt>${data.dragSuccesses}/${data.dragAttempts}</dt><dd>拖拽归位</dd></dl>
            <dl><dt>${data.observeAttempts ? `${observeRate}%` : '—'}</dt><dd>观察校验</dd></dl>
            <dl><dt>${data.hiddenFound}</dt><dd>隐藏发现</dd></dl>
            <dl><dt>${data.errorCount}</dt><dd>无效触碰</dd></dl>
          </div>
        </section>

        <section class="archive-section">
          <div class="archive-section-title"><span>空间轨迹</span><em>总停留 ${this.formatArchiveTime(totalSeconds)}</em></div>
          <div class="archive-route">${routeRows}</div>
        </section>

        <section class="archive-note">
          <span>档案注记</span>
          <p>你最先触碰了“${firstTouched}”，并在“${longestPlace}”停留最久。记录不会判断你是否走对，只保存你如何辨认一处不属于任何人的空间。</p>
        </section>

        <footer class="archive-footer">
          <div class="archive-seal"><span>已封存</span><small>NO PLACE ARCHIVE</small></div>
          <button class="primary-button" aria-label="重新体验">重新体验</button>
        </footer>
      </div>
    `;
    this.container.append(panel);
    panel.querySelector('button')?.addEventListener('click', () => {
      this.audio.playSfx('dossier_close');
      panel.remove();
      this.sceneManager.restart();
      this.cameraRig.setScene(0);
      this.audio.playMusic(music.school, false);
      this.archive.enterScene(this.sceneManager.currentDefinition.title);
    });
  }

  private formatArchiveTime(seconds: number): string {
    if (seconds < 1) return '0 秒';
    if (seconds < 60) return `${Math.round(seconds)} 秒`;
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.round(seconds % 60);
    return remainder ? `${minutes} 分 ${remainder} 秒` : `${minutes} 分`;
  }

  private readonly showMessage = (message: string): void => {
    if (!this.started && !message.includes('没有结束')) return;
    this.toast.textContent = message;
    this.toast.classList.add('visible');
    window.setTimeout(() => this.toast.classList.remove('visible'), 2300);
    this.updateHud();
  };

  private updateHud(): void {
    const definition = this.sceneManager.currentDefinition;
    this.sceneTitle.innerHTML = `<strong>${definition.title}</strong>`;
    const items = this.sceneManager.getObjectives();
    const done = items.filter((item) => item.done).length;
    this.progress.textContent = `${done}/${items.length}`;
    this.objectives.innerHTML = items
      .map((item) => `<span class="${item.done ? 'done' : ''}">${item.done ? '✓' : '·'} ${item.label}</span>`)
      .join('');
  }

  private readonly handleFeedback = (feedback: InteractionFeedback): void => {
    if (feedback.kind === 'idle') {
      this.hint.classList.remove('visible', 'success', 'error');
      this.holdRing.classList.remove('visible');
      return;
    }

    if (feedback.kind === 'hold') {
      const progress = feedback.progress ?? 0;
      this.holdRing.classList.add('visible');
      this.holdRing.style.setProperty('--hold', `${Math.round(progress * 360)}deg`);
      if (feedback.point) {
        this.holdRing.style.left = `${feedback.point.x}px`;
        this.holdRing.style.top = `${feedback.point.y}px`;
      }
    } else {
      this.holdRing.classList.remove('visible');
    }

    if (feedback.label) {
      this.hint.textContent = feedback.label;
      this.hint.classList.toggle('success', feedback.kind === 'success');
      this.hint.classList.toggle('error', feedback.kind === 'error');
      this.hint.classList.add('visible');
      if (feedback.point) {
        this.hint.style.left = `${Math.min(window.innerWidth - 18, Math.max(18, feedback.point.x))}px`;
        this.hint.style.top = `${Math.min(window.innerHeight - 76, Math.max(76, feedback.point.y - 44))}px`;
      }
      if (feedback.kind === 'success' || feedback.kind === 'error') {
        window.setTimeout(() => this.hint.classList.remove('visible', 'success', 'error'), 900);
      }
    }
    this.updateHud();
  };

  private readonly animate = (): void => {
    const now = performance.now();
    const delta = now - this.lastFrame;
    this.lastFrame = now;
    this.fps = this.fps * 0.9 + (1000 / Math.max(delta, 1)) * 0.1;
    this.cameraRig.update(now);
    const usesDedicatedAtmosphere = this.compareMode || this.editorMode || ['scene01_school', 'scene02_station'].includes(this.sceneManager.currentDefinition.id);
    const isBuilding = this.sceneManager.currentDefinition.id === 'scene03_building';
    this.particles.setProfile(isBuilding ? 0.16 : 1, !isBuilding);
    this.particles.group.visible = !usesDedicatedAtmosphere;
    this.fog.group.visible = !usesDedicatedAtmosphere;
    if (!usesDedicatedAtmosphere) {
      this.particles.update(now);
      this.fog.update(now);
    }
    this.sceneManager.update(now);
    this.interaction.update(now);
    this.editor?.update();
    this.renderer.render(this.sceneManager.scene, this.cameraRig.camera);
    this.debug.update({
      scene: this.sceneManager.currentDefinition,
      fps: this.fps,
      flags: this.sceneManager.currentState.flags,
      interactables: this.sceneManager.getInteractableNames(),
      hit: this.hit,
      usedModel: this.sceneManager.usingModel,
      usedFallback: this.sceneManager.usingFallback,
      archiveData: this.archive.data
    });
    requestAnimationFrame(this.animate);
  };

  private readonly resize = (): void => {
    const viewport = this.getRenderViewport();
    this.renderer.setSize(viewport.width, viewport.height, !this.editorMode);
    this.cameraRig.resize(viewport.width, viewport.height);
    this.sceneManager.setViewport(viewport.width, viewport.height);
  };

  private getRenderViewport(): { width: number; height: number } {
    if (!this.editorPreview) return { width: window.innerWidth, height: window.innerHeight };
    const bounds = this.editorPreview.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width || 360));
    const height = Math.max(1, Math.round(bounds.height || 640));
    return { width, height };
  }

  private readonly pointerParallax = (event: PointerEvent): void => {
    if (this.compareMode || this.editorMode) return;
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = (event.clientY / window.innerHeight) * 2 - 1;
    this.cameraRig.setPointer(new THREE.Vector2(x, y));
  };

  private readonly switchEditorScene = async (index: number): Promise<void> => {
    this.cameraRig.setScene(index);
    await this.sceneManager.load(index);
  };
}
