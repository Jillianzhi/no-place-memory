import * as THREE from 'three';

export class CanvasTextureFactory {
  createClockFace(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable.');
    const center = 512;

    ctx.clearRect(0, 0, 1024, 1024);
    ctx.beginPath();
    ctx.arc(center, center, 480, 0, Math.PI * 2);
    ctx.fillStyle = '#263f48';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(center, center, 438, 0, Math.PI * 2);
    ctx.fillStyle = '#c5ad78';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(center, center, 414, 0, Math.PI * 2);
    ctx.fillStyle = '#eee8d8';
    ctx.fill();

    ctx.strokeStyle = '#2e3b3d';
    ctx.fillStyle = '#2e3b3d';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 60; i += 1) {
      const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const inner = i % 5 === 0 ? 334 : 360;
      const outer = 392;
      ctx.lineWidth = i % 5 === 0 ? 11 : 4;
      ctx.beginPath();
      ctx.moveTo(center + Math.cos(angle) * inner, center + Math.sin(angle) * inner);
      ctx.lineTo(center + Math.cos(angle) * outer, center + Math.sin(angle) * outer);
      ctx.stroke();
    }
    ctx.font = '700 92px Georgia, serif';
    for (let value = 1; value <= 12; value += 1) {
      const angle = (value / 12) * Math.PI * 2 - Math.PI / 2;
      ctx.fillText(String(value), center + Math.cos(angle) * 278, center + Math.sin(angle) * 278 + 4);
    }
    ctx.fillStyle = 'rgba(101, 77, 48, 0.08)';
    for (let i = 0; i < 110; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * 390;
      ctx.beginPath();
      ctx.arc(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius, 1 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    return this.finalize(canvas);
  }

  createSchoolWall(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable.');
    const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
    gradient.addColorStop(0, '#88959d');
    gradient.addColorStop(0.58, '#73858a');
    gradient.addColorStop(0.585, '#304e52');
    gradient.addColorStop(1, '#263f43');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.fillStyle = 'rgba(221, 230, 226, 0.055)';
    for (let i = 0; i < 180; i += 1) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      ctx.beginPath();
      ctx.ellipse(x, y, 8 + Math.random() * 38, 2 + Math.random() * 15, Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(12, 30, 34, 0.12)';
    ctx.fillRect(0, 588, 1024, 8);
    return this.finalize(canvas);
  }

  createTerrazzoFloor(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable.');
    ctx.fillStyle = '#33464e';
    ctx.fillRect(0, 0, 1024, 1024);
    const colors = ['#9ba6a1', '#60747a', '#c6b9aa', '#202f36'];
    for (let i = 0; i < 1700; i += 1) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.22 + Math.random() * 0.34;
      const size = 1 + Math.random() * 4;
      ctx.fillRect(Math.random() * 1024, Math.random() * 1024, size, size);
    }
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#a7b4b4';
    ctx.lineWidth = 3;
    for (let p = 0; p <= 1024; p += 256) {
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 1024);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(1024, p);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    return this.finalize(canvas);
  }

  createSchoolFloorReflection(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable.');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ambient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    ambient.addColorStop(0, 'rgba(153, 171, 218, 0.2)');
    ambient.addColorStop(0.48, 'rgba(112, 135, 190, 0.08)');
    ambient.addColorStop(1, 'rgba(80, 98, 146, 0)');
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.filter = 'blur(28px)';
    ctx.fillStyle = 'rgba(184, 198, 232, 0.13)';
    for (const [x, y, width, height] of [
      [24, 110, 120, 760],
      [205, 260, 70, 620],
      [350, 410, 42, 470]
    ]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.23);
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
    ctx.filter = 'none';
    return this.finalize(canvas);
  }

  createSchoolCeiling(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable.');
    ctx.fillStyle = '#5b6870';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.strokeStyle = 'rgba(30, 43, 49, 0.45)';
    ctx.lineWidth = 8;
    for (let p = 0; p <= 1024; p += 256) {
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 1024);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(1024, p);
      ctx.stroke();
    }
    return this.finalize(canvas);
  }

  createLockerDoor(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable.');
    const gradient = ctx.createLinearGradient(0, 0, 512, 0);
    gradient.addColorStop(0, '#25434a');
    gradient.addColorStop(0.5, '#42636a');
    gradient.addColorStop(1, '#1d353b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 1024);
    ctx.strokeStyle = '#142b31';
    ctx.lineWidth = 18;
    ctx.strokeRect(18, 18, 476, 988);
    ctx.fillStyle = '#192f35';
    for (let y = 105; y <= 185; y += 26) ctx.fillRect(126, y, 260, 10);
    ctx.fillStyle = '#c1b998';
    ctx.fillRect(156, 245, 200, 82);
    ctx.fillStyle = '#21363a';
    ctx.fillRect(178, 267, 156, 38);
    ctx.fillStyle = '#b6a576';
    ctx.fillRect(406, 482, 34, 106);
    ctx.fillStyle = 'rgba(217, 228, 218, 0.12)';
    for (let i = 0; i < 45; i += 1) ctx.fillRect(Math.random() * 470, Math.random() * 950, 3 + Math.random() * 18, 2);
    return this.finalize(canvas);
  }

  createSchoolWindowView(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable.');
    const sky = ctx.createLinearGradient(0, 0, 0, 1024);
    sky.addColorStop(0, '#8a91c0');
    sky.addColorStop(0.5, '#7185a3');
    sky.addColorStop(1, '#364f62');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.fillStyle = '#344d58';
    ctx.fillRect(80, 460, 850, 300);
    ctx.fillStyle = '#526d74';
    for (let x = 120; x < 900; x += 110) ctx.fillRect(x, 510, 62, 95);
    ctx.fillStyle = '#263f48';
    ctx.fillRect(0, 760, 1024, 264);
    ctx.strokeStyle = 'rgba(24, 48, 51, 0.72)';
    ctx.lineWidth = 15;
    for (let x = 60; x < 1024; x += 130) {
      ctx.beginPath();
      ctx.moveTo(x, 1024);
      ctx.quadraticCurveTo(x + 40, 530, x + 15, 80);
      ctx.stroke();
      for (let y = 160; y < 820; y += 150) {
        ctx.beginPath();
        ctx.ellipse(x + 42, y, 70, 16, -0.55, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(203, 211, 255, 0.12)';
    ctx.fillRect(0, 0, 1024, 1024);
    return this.finalize(canvas);
  }

  createBuildingFloorPlate(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable.');
    ctx.fillStyle = '#948b74';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#4a453c';
    ctx.lineWidth = 18;
    ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
    ctx.fillStyle = '#39362f';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 112px serif';
    ctx.fillText('三楼', canvas.width / 2, canvas.height / 2 + 4);
    ctx.globalAlpha = 0.13;
    for (let index = 0; index < 32; index += 1) {
      ctx.fillStyle = index % 2 ? '#241f1b' : '#d3c7a8';
      ctx.fillRect((index * 83) % 490, (index * 47) % 238, 8 + (index % 5) * 5, 3 + (index % 3) * 4);
    }
    ctx.globalAlpha = 1;
    return this.finalize(canvas);
  }

  createLabel(text: string, subtext = '', accent = '#d7c1ff'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable.');
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1d35');
    gradient.addColorStop(0.55, '#5b6097');
    gradient.addColorStop(1, '#f3b6cc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.strokeRect(22, 22, canvas.width - 44, canvas.height - 44);
    ctx.fillStyle = '#fff8ff';
    ctx.font = '600 42px serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, 104);
    ctx.font = '24px serif';
    ctx.globalAlpha = 0.78;
    ctx.fillText(subtext, canvas.width / 2, 154);
    ctx.globalAlpha = 1;
    return this.finalize(canvas);
  }

  createTicket(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable.');
    ctx.fillStyle = '#f4ece2';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#96b8c8';
    ctx.fillRect(0, 0, 512, 42);
    ctx.fillStyle = '#3f4a5f';
    ctx.font = 'bold 38px serif';
    ctx.fillText('旧县城客运票', 34, 100);
    ctx.font = '26px serif';
    ctx.fillText('终点：未写明', 34, 148);
    ctx.fillText('12:30  站台 04', 34, 190);
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = '#9b8290';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(410, 42);
    ctx.lineTo(410, 236);
    ctx.stroke();
    return this.finalize(canvas);
  }

  createMistText(text: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable.');
    ctx.fillStyle = 'rgba(220,232,255,0.38)';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 80; i += 1) {
      ctx.fillStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.08})`;
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, 12 + Math.random() * 58, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(39,48,92,0.72)';
    ctx.font = '42px serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 256, 268);
    return this.finalize(canvas);
  }

  createBoard(lines: string[]): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable.');
    ctx.fillStyle = '#111722';
    ctx.fillRect(0, 0, 768, 384);
    ctx.fillStyle = '#9ff5ff';
    ctx.font = 'bold 38px monospace';
    lines.forEach((line, index) => ctx.fillText(line, 54, 88 + index * 70));
    ctx.globalAlpha = 0.22;
    for (let y = 0; y < 384; y += 8) {
      ctx.fillRect(0, y, 768, 2);
    }
    return this.finalize(canvas);
  }

  createArchive(result: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable.');
    ctx.fillStyle = '#ece8f8';
    ctx.fillRect(0, 0, 1024, 768);
    ctx.fillStyle = '#131521';
    ctx.font = 'bold 64px serif';
    ctx.textAlign = 'center';
    ctx.fillText('非场所档案', 512, 150);
    ctx.font = 'bold 78px serif';
    ctx.fillText(result, 512, 340);
    ctx.font = '32px serif';
    ctx.fillText('此处没有归处，别处也没有缺口。', 512, 500);
    ctx.strokeStyle = '#8991c9';
    ctx.lineWidth = 10;
    ctx.strokeRect(64, 64, 896, 640);
    return this.finalize(canvas);
  }

  private finalize(canvas: HTMLCanvasElement): THREE.CanvasTexture {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }
}
