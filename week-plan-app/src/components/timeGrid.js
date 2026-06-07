/**
 * TimeGrid — 7 天时间表组件
 * 响应式 CSS Grid，日类型 Cursor 色映射 + 今日背景染色
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
      <div class="day-card" data-type="${type}" data-today="${isToday ? 'true' : 'false'}">
        <div class="day-card-date">${formatDate(date)}</div>
        <div class="day-card-weekday">${getWeekdayCN(date)}</div>
        <div class="day-card-label">${_esc(label) || '—'}</div>
        <span class="day-card-type-pill" data-type="${type}">${TYPE_CN[type] || type}</span>
      </div>
    `;
  }

  html += '</div>';
  container.innerHTML = html;
}

function _esc(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function destroy() {
  if (unsubscribe) unsubscribe();
  container = null;
}
