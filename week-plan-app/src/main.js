/**
 * 主入口
 * 应用生命周期管理：引导 → 选目录 → 加载数据 → 渲染界面
 */

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { selectDirectory, isSupported } from './utils/file.js';
import { store } from './store.js';
import { initUI } from './renderer.js';

// ── DOM 引用 ──
const onboardingEl = document.getElementById('onboarding');
const mainAppEl = document.getElementById('main-app');
const btnSelectDir = document.getElementById('btn-select-dir');

// ── 检查浏览器支持 ──
if (!isSupported()) {
  if (btnSelectDir) {
    btnSelectDir.textContent = '浏览器不支持';
    btnSelectDir.disabled = true;
    const hint = document.querySelector('.onboarding-hint');
    if (hint) {
      hint.textContent = '请使用 Chrome 或 Edge 浏览器打开';
      hint.style.color = 'var(--color-error)';
    }
  }
}

// ── 事件绑定 ──

// 选择目录
btnSelectDir?.addEventListener('click', async () => {
  await handleSelectDirectory();
});

// 更换目录
window.addEventListener('change-directory', async () => {
  await handleSelectDirectory();
});

// ── 核心流程 ──

async function handleSelectDirectory() {
  try {
    const handle = await selectDirectory();
    if (!handle) return; // 用户取消

    // 加载所有周计划
    await store.loadAll();

    const keys = store.getWeekKeys();
    if (keys.length > 0) {
      // 默认选择最近一周
      store.setCurrentWeek(keys[0]);
    }

    // 切换到主界面
    showMainApp();
  } catch (err) {
    console.error('加载目录失败:', err);
    alert('加载失败: ' + err.message);
  }
}

function showMainApp() {
  // 隐藏引导页
  onboardingEl?.classList.add('hidden');

  // 显示主界面
  mainAppEl?.classList.remove('hidden');

  // 初始化界面
  initUI();
}

// ── 页面卸载时缓存目录句柄（IndexedDB 暂不支持，仅做提示） ──
window.addEventListener('beforeunload', () => {
  // File System Access API 的目录句柄在刷新后会失效
  // 用户需要重新选择目录。IndexedDB 持久化在 v2 中实现
});
