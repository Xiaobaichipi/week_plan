/**
 * WeekSelector — 周选择器组件
 * 左右箭头翻页 + 当前周标签
 */

import { store } from '../store.js';
import { formatWeekRange } from '../utils/date.js';

let container = null;
let labelEl = null;
let prevBtn = null;
let nextBtn = null;
let unsubscribe = null;

export function init(el) {
  container = el;
  el.innerHTML = `
    <button class="btn btn-week-nav" id="btn-prev-week" aria-label="上一周">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M11 4L6 9L11 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <span class="week-selector-label" id="week-label"></span>
    <button class="btn btn-week-nav" id="btn-next-week" aria-label="下一周">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M7 4L12 9L7 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `;

  labelEl = el.querySelector('#week-label');
  prevBtn = el.querySelector('#btn-prev-week');
  nextBtn = el.querySelector('#btn-next-week');

  prevBtn.addEventListener('click', () => {
    const ok = store.goPreviousWeek();
    if (ok) update();
  });

  nextBtn.addEventListener('click', () => {
    const ok = store.goNextWeek();
    if (ok) update();
  });

  // 键盘左右键翻页
  document.addEventListener('keydown', (e) => {
    // 如果焦点在输入框内，不处理
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft') {
      store.goNextWeek() && update();
    } else if (e.key === 'ArrowRight') {
      store.goPreviousWeek() && update();
    }
  });

  unsubscribe = store.subscribe((event) => {
    if (event === 'week-changed' || event === 'week-created') {
      update();
    }
  });

  update();
}

export function update() {
  if (!labelEl) return;
  const week = store.getCurrentWeek();
  if (week && week.weekStart) {
    labelEl.textContent = formatWeekRange(week.weekStart);
  } else {
    labelEl.textContent = '未选择周';
  }

  // 更新箭头状态
  const keys = store.getWeekKeys();
  const currentKey = store.getCurrentKey();
  const idx = keys.indexOf(currentKey);

  prevBtn.style.opacity = idx < keys.length - 1 ? '1' : '0.3';
  prevBtn.style.pointerEvents = idx < keys.length - 1 ? 'auto' : 'none';
  nextBtn.style.opacity = idx > 0 ? '1' : '0.3';
  nextBtn.style.pointerEvents = idx > 0 ? 'auto' : 'none';
}

export function destroy() {
  if (unsubscribe) unsubscribe();
  container = null;
}
