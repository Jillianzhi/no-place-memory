import './styles/main.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app container.');
}

// Paint the HTML introduction before downloading and initializing WebGL.
requestAnimationFrame(() => requestAnimationFrame(async () => {
  try {
    const { Game } = await import('./game/Game');
    const game = new Game(app);
    document.querySelector('#boot-screen')?.remove();
    game.start();
  } catch (error) {
    console.error('Game initialization failed', error);
    const status = document.querySelector('#boot-screen [role="status"]');
    if (status) {
      status.textContent = '暂时无法打开，请点击重试。';
      const retry = document.createElement('button');
      retry.className = 'primary-button';
      retry.textContent = '重新加载';
      retry.addEventListener('click', () => location.reload());
      status.after(retry);
    }
  }
}));
