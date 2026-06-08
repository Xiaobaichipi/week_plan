/**
 * Drawer — 抽屉菜单组件
 * 迷你时间轴 + 操作按钮区
 */

import { store } from '../store.js';
import { formatWeekRange } from '../utils/date.js';
import { parseWeekPlan } from '../parser.js';
import { writeFile } from '../utils/file.js';
import { generateMarkdown } from '../writer.js';

let overlay = null;
let drawer = null;
let timelineEl = null;
let unsubscribe = null;
let isOpen = false;

export function init() {
  overlay = document.getElementById('drawer-overlay');
  drawer = document.getElementById('drawer');
  timelineEl = document.getElementById('drawer-timeline');

  // Toggle
  document.getElementById('btn-drawer-toggle')?.addEventListener('click', open);
  document.getElementById('btn-drawer-close')?.addEventListener('click', close);
  overlay?.addEventListener('click', close);

  // Action buttons
  document.getElementById('btn-new-week')?.addEventListener('click', () => {
    close();
    // 触发创建 Modal（由 main.js 处理）
    window.dispatchEvent(new CustomEvent('open-create-modal'));
  });
  document.getElementById('btn-import-md')?.addEventListener('click', () => {
    close();
    importMarkdown();
  });
  document.getElementById('btn-export-all')?.addEventListener('click', () => {
    close();
    exportAll();
  });
  document.getElementById('btn-change-dir')?.addEventListener('click', () => {
    close();
    window.dispatchEvent(new CustomEvent('change-directory'));
  });

  // Escape to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) close();
  });

  unsubscribe = store.subscribe((event) => {
    if (event === 'week-changed' || event === 'week-created' || event === 'data-changed') {
      renderTimeline();
    }
  });

  renderTimeline();
}

function renderTimeline() {
  if (!timelineEl) return;
  const currentKey = store.getCurrentKey();
  const weeks = store.getAllWeeksSummary();

  if (weeks.length === 0) {
    timelineEl.innerHTML = '<p style="color: var(--color-muted-soft); font-size: var(--text-body-sm);">暂无历史周计划</p>';
    return;
  }

  let html = '<ul class="timeline-list">';

  weeks.forEach(w => {
    let state = 'future';
    if (w.key < currentKey) state = 'past';
    else if (w.key === currentKey) state = 'current';

    const doneText = w.doneCount > 0 ? `✓${w.doneCount}/${w.taskCount}` : `${w.taskCount} 项`;

    html += `
      <li class="timeline-item ${state}" data-week-key="${w.key}">
        <div class="timeline-week-label">${w.weekStart ? formatWeekRange(w.weekStart) : w.key}</div>
        <div class="timeline-week-range">${doneText} · ${_statusText(w.status)}</div>
      </li>
    `;
  });

  html += '</ul>';
  timelineEl.innerHTML = html;

  // 点击跳转
  timelineEl.querySelectorAll('.timeline-item').forEach(item => {
    item.addEventListener('click', () => {
      const key = item.dataset.weekKey;
      store.setCurrentWeek(key);
      close();
    });
  });
}

function open() {
  isOpen = true;
  drawer?.classList.add('open');
  overlay?.classList.remove('hidden');
  overlay?.classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function close() {
  isOpen = false;
  drawer?.classList.remove('open');
  overlay?.classList.add('hidden');
  overlay?.classList.remove('visible');
  document.body.style.overflow = '';
}

async function importMarkdown() {
  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
      multiple: false,
    });
    const file = await fileHandle.getFile();
    const content = await file.text();
    // 导入文件作为新周
    const data = parseWeekPlan(content, file.name);
    const md = generateMarkdown(data);
    await writeFile(file.name, md);
    await store.loadAll();
    const key = (data.weekStart && !isNaN(data.weekStart.getTime()))
      ? formatDate(data.weekStart)
      : file.name.replace(/\.md$/, '');
    store.setCurrentWeek(key);
  } catch (err) {
    if (err.name !== 'AbortError') {
      alert('导入失败: ' + err.message);
    }
  }
}

async function exportAll() {
  const files = await store.exportAll();
  if (files.length === 0) {
    alert('没有可导出的周计划');
    return;
  }

  // 创建 zip 下载（简单方案：逐个下载）
  for (const { name, content } of files) {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    // 小延迟避免浏览器阻止多文件下载
    await new Promise(r => setTimeout(r, 300));
  }
}

function _statusText(status) {
  switch (status) {
    case 'done': return '✅ 完成';
    case 'active': return '🔄 进行中';
    default: return '📋 规划';
  }
}

export function destroy() {
  if (unsubscribe) unsubscribe();
  overlay = null;
  drawer = null;
  timelineEl = null;
  isOpen = false;
}
