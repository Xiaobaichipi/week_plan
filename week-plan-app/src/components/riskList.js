/**
 * RiskList — 风险列表组件
 * 只读展示，瀑布流末尾
 */

import { store } from '../store.js';

let container = null;
let unsubscribe = null;

export function init(el) {
  container = el;
  unsubscribe = store.subscribe((event) => {
    if (event === 'week-changed' || event === 'data-changed' || event === 'week-created') {
      render();
    }
  });
  render();
}

function render() {
  if (!container) return;
  const week = store.getCurrentWeek();
  const risks = week?.risks || [];

  if (risks.length === 0) {
    container.innerHTML = '';
    return;
  }

  let html = `
    <div class="section">
      <div class="section-header">
        <span class="section-label">风险与注意事项</span>
        <h2 class="section-title">⚠️ 风险</h2>
      </div>
      <ul class="risk-list">
  `;

  risks.forEach(r => {
    html += `
      <li class="risk-item">
        <span class="risk-dot"></span>
        <span>${_esc(String(r))}</span>
      </li>
    `;
  });

  html += `
      </ul>
    </div>
  `;

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
