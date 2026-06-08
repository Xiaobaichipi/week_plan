/**
 * TimeGrid — 7 天时间表组件
 * 响应式 CSS Grid，日类型 Cursor 色映射 + 今日背景染色
 * 支持内联编辑：点击标签文字编辑，点击类型 pill 切换
 */

import { store } from '../store.js';
import { getDayFromMonday, formatDate, getWeekdayCN, isSameDay } from '../utils/date.js';

const TYPE_CN = {
  code: '代码',
  content: '制作',
  travel: '出差',
  training: '培训',
  off: '休息',
};

const TYPE_CYCLE = ['code', 'content', 'travel', 'training', 'off'];

let container = null;
let unsubscribe = null;

export function init(el) {
  container = el;
  unsubscribe = store.subscribe((event) => {
    if (event === 'week-changed' || event === 'data-changed' || event === 'day-changed' || event === 'week-created') {
      render();
    }
  });
  render();
}

function render() {
  if (!container) return;
  const week = store.getCurrentWeek();
  if (!week || !week.weekStart) {
    container.innerHTML = '<p style="color: var(--color-muted)">未加载周计划</p>';
    return;
  }

  const today = new Date();
  const monday = week.weekStart;
  const days = week.days || [];

  let html = '<div class="time-grid">';

  for (let i = 0; i < 7; i++) {
    const date = getDayFromMonday(monday, i);
    const day = days[i] || {};
    const type = day.type || 'off';
    const label = day.label || '';
    const isToday = isSameDay(date, today);

    html += `
      <div class="day-card" data-type="${type}" data-today="${isToday ? 'true' : 'false'}" data-day-index="${i}">
        <div class="day-card-date">${formatDate(date)}</div>
        <div class="day-card-weekday">${getWeekdayCN(date)}</div>
        <div class="day-card-label" data-day-index="${i}" data-field="label">${_esc(label) || '点击添加'}</div>
        <span class="day-card-type-pill" data-type="${type}" data-day-index="${i}">${TYPE_CN[type] || type}</span>
      </div>
    `;
  }

  html += '</div>';
  container.innerHTML = html;
  _bindEvents(container);
}

function _bindEvents(el) {
  // 点击标签编辑
  el.querySelectorAll('.day-card-label').forEach(span => {
    span.addEventListener('click', () => {
      if (span.contentEditable === 'true') return;
      span.contentEditable = 'true';
      span.classList.add('editing');
      // 如果是占位文字，清空
      if (span.textContent === '点击添加') span.textContent = '';
      span.focus();
    });

    span.addEventListener('blur', () => {
      if (span.contentEditable !== 'true') return;
      span.contentEditable = 'false';
      span.classList.remove('editing');
      const dayIndex = parseInt(span.dataset.dayIndex);
      const newLabel = span.textContent.trim();
      store.updateDay(dayIndex, { label: newLabel });
    });

    span.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
      if (e.key === 'Escape') {
        const week = store.getCurrentWeek();
        const orig = (week?.days || [])[parseInt(e.target.dataset.dayIndex)]?.label || '';
        e.target.textContent = orig || '点击添加';
        e.target.blur();
      }
    });
  });

  // 点击类型 pill 切换
  el.querySelectorAll('.day-card-type-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const dayIndex = parseInt(pill.dataset.dayIndex);
      const week = store.getCurrentWeek();
      const currentType = (week?.days || [])[dayIndex]?.type || 'off';
      const nextIdx = (TYPE_CYCLE.indexOf(currentType) + 1) % TYPE_CYCLE.length;
      const nextType = TYPE_CYCLE[nextIdx];
      store.updateDay(dayIndex, { type: nextType });
    });
  });
}

function _esc(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function destroy() {
  if (unsubscribe) unsubscribe();
  container = null;
}
