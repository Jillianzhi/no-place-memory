import QRCode from 'qrcode';

const GAME_URL = 'https://noplacememory.site/';

export interface ShareArchive {
  number: string;
  result: string;
  mark: string;
  summary: string;
  tags: readonly string[];
  metrics: [string, string][];
  routes: { place: string; time: string; fraction: number }[];
  totalTime: string;
  note: string;
}

/** Draw a real PNG locally so iOS / WeChat can offer their native image menu. */
export async function createArchivePoster(data: ShareArchive): Promise<Blob> {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1660;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法生成图片');
  const text = (value: string, x: number, y: number, size = 26, color = '#45534a', bold = false) => {
    ctx.font = `${bold ? '700 ' : ''}${size}px "Songti SC", "Noto Serif SC", serif`;
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  };
  const wrap = (value: string, x: number, y: number, width: number, size = 26, leading = 42) => {
    ctx.font = `${size}px "Songti SC", "Noto Serif SC", serif`;
    let line = '';
    for (const char of value) {
      if (ctx.measureText(line + char).width > width && line) {
        text(line, x, y, size);
        y += leading;
        line = '';
      }
      line += char;
    }
    if (line) text(line, x, y, size);
    return y + leading;
  };
  const rule = (y: number) => {
    ctx.strokeStyle = '#a9afa0';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(86, y); ctx.lineTo(994, y); ctx.stroke();
  };
  ctx.fillStyle = '#eae6d7'; ctx.fillRect(0, 0, 1080, 1660);
  // Quiet paper grain, deterministic across exports.
  for (let i = 0; i < 12000; i++) {
    ctx.fillStyle = i % 2 ? '#45534a08' : '#ffffff35';
    ctx.fillRect((i * 137.31) % 1080, (i * 73.79) % 1660, 1.5, 1.5);
  }
  ctx.strokeStyle = '#829083'; ctx.lineWidth = 2;
  ctx.strokeRect(38, 38, 1004, 1584); ctx.strokeRect(48, 48, 984, 1564);
  text('非场所居民身份档案', 86, 110, 30, '#476b61', true);
  text(data.number, 86, 151, 21);
  text('档案已封存', 836, 112, 23, '#876151'); rule(184);
  ctx.beginPath(); ctx.arc(153, 290, 60, 0, Math.PI * 2);
  ctx.strokeStyle = '#607e71'; ctx.lineWidth = 3; ctx.stroke();
  text(data.mark, 115, 305, 36, '#476b61', true);
  text('最终身份', 258, 242, 23, '#876151');
  text(data.result, 258, 312, 58, '#263e34', true);
  wrap(data.summary, 258, 360, 716, 25, 39);
  let tagX = 86;
  for (const tag of data.tags) {
    ctx.strokeStyle = '#9da895'; ctx.strokeRect(tagX, 446, 166, 46);
    text(tag, tagX + 23, 477, 23); tagX += 184;
  }
  rule(524); text('行为记录', 86, 572, 28, '#476b61', true);
  data.metrics.forEach(([value, label], index) => {
    const x = 86 + index * 227;
    ctx.textAlign = 'center'; text(value, x + 113, 638, 38, '#263e34', true);
    text(label, x + 113, 680, 22); ctx.textAlign = 'left';
  });
  rule(716); text('空间轨迹', 86, 767, 28, '#476b61', true);
  ctx.textAlign = 'right'; text(`总停留 ${data.totalTime}`, 994, 767, 22); ctx.textAlign = 'left';
  data.routes.forEach((route, index) => {
    const y = 820 + index * 67;
    text(`0${index + 1}`, 86, y, 21, '#899283'); text(route.place, 140, y, 26);
    ctx.textAlign = 'right'; text(route.time, 994, y, 22); ctx.textAlign = 'left';
    ctx.fillStyle = '#cad0bf'; ctx.fillRect(140, y + 17, 630, 3);
    ctx.fillStyle = '#668677'; ctx.fillRect(140, y + 17, 630 * Math.min(1, Math.max(0, route.fraction)), 4);
  });
  rule(1145); text('档案注记', 86, 1195, 27, '#476b61', true);
  wrap(data.note, 86, 1241, 908, 24, 37); rule(1360);
  text('不在此处，不在别处', 86, 1423, 34, '#263e34', true);
  text('你会成为哪一种非场所居民？', 86, 1474, 26);
  text('分享给身边的小伙伴，一起走进记忆。', 86, 1518, 23);
  text('noplacememory.site', 86, 1570, 24, '#476b61');
  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, GAME_URL, { width: 200, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#142c24', light: '#ffffff' } });
  ctx.drawImage(qr, 794, 1382, 200, 200);
  text('扫码进入游戏', 816, 1608, 22);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('图片生成失败')), 'image/png'));
}

export async function openArchiveShare(parent: HTMLElement, trigger: HTMLButtonElement, data: ShareArchive): Promise<void> {
  if (parent.querySelector('.archive-share-dialog')) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'archive-share-dialog';
  dialog.setAttribute('aria-label', '保存并分享身份卡');
  dialog.innerHTML = `
    <header><h3>把这份记忆带走</h3><button type="button" data-close aria-label="关闭分享图片">关闭</button></header>
    <p class="share-instructions">长按下方图片保存，分享给身边的小伙伴<br>识别图片二维码，就能进入游戏</p>
    <p data-status role="status">正在生成你的身份卡…</p>
    <img class="archive-share-image" alt="个人身份档案分享图片，附有进入游戏的二维码" hidden>
    <div class="share-image-actions" hidden><a data-download>下载图片</a><button type="button" data-native hidden>分享图片</button></div>`;
  parent.append(dialog);
  let imageUrl: string | undefined;
  const close = () => dialog.close();
  dialog.querySelector('[data-close]')!.addEventListener('click', close);
  dialog.addEventListener('close', () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    dialog.remove(); trigger.focus();
  }, { once: true });
  dialog.showModal();
  const status = dialog.querySelector<HTMLElement>('[data-status]')!;
  try {
    const blob = await createArchivePoster(data);
    if (!dialog.isConnected) return;
    imageUrl = URL.createObjectURL(blob);
    const img = dialog.querySelector<HTMLImageElement>('img')!;
    img.src = imageUrl; img.hidden = false;
    const download = dialog.querySelector<HTMLAnchorElement>('[data-download]')!;
    download.href = imageUrl; download.download = `非场所身份卡-${data.number}.png`;
    dialog.querySelector<HTMLElement>('.share-image-actions')!.hidden = false;
    status.textContent = '';
    const file = new File([blob], download.download, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      const share = dialog.querySelector<HTMLButtonElement>('[data-native]')!;
      share.hidden = false;
      share.addEventListener('click', async () => {
        try { await navigator.share({ files: [file], title: '我的非场所居民身份卡' }); }
        catch (error) {
          if (!(error instanceof DOMException && error.name === 'AbortError')) status.textContent = '可以长按上方图片保存，或点击下载图片。';
        }
      });
    }
  } catch {
    status.textContent = '图片暂时生成失败，请关闭后重试。';
  }
}
