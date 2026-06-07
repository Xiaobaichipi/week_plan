/**
 * DecisionTable — 决策速查表组件
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
  const decisions = week?.decisions || [];

  if (decisions.length === 0) {
    container.innerHTML = '';
    return;
  }

  let html = `
    <div class="section">
      <div class="section-header">
        <span class="section-label">架构决策</span>
        <h2 class="section-title">决策速查</h2>
      </div>
      <div class="table-wrapper">
        <table class="decision-table">
          <thead>
            <tr>
              <th>#</th>
              <th>分类</th>
              <th>决策项</th>
              <th>结论</th>
            </tr>
          </thead>
          <tbody>
  `;

  decisions.forEach(d => {
    html += `
      <tr>
        <td>${_esc(d.id || '')}</td>
        <td><span class="decision-category">${_esc(d.category || '')}</span></td>
        <td>${_esc(d.title || '')}</td>
        <td>${_esc(d.value || '')}</td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </div>
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
