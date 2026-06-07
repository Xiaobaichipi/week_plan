/**
 * TaskList — 任务列表组件
 * 内联编辑：点击变输入框，失焦保存；勾选完成；删除
 */

import { store } from '../store.js';

let container = null;
let unsubscribe = null;

export function init(el) {
  container = el;
  unsubscribe = store.subscribe((event) => {
    if (event === 'week-changed' || event === 'data-changed' || event === 'task-added' || event === 'task-removed' || event === 'week-created') {
      render();
    }
  });
  render();
}

function render() {
  if (!container) return;
  const week = store.getCurrentWeek();
  if (!week) {
    container.innerHTML = '';
    return;
  }

  const tasks = week.tasks || [];

  // 按 group 分组
  const groups = {};
  tasks.forEach(t => {
    const g = t.group || '其他';
    if (!groups[g]) groups[g] = [];
    groups[g].push(t);
  });

  let html = '';

  for (const [groupName, groupTasks] of Object.entries(groups)) {
    html += `<div class="task-group" data-group="${_esc(groupName)}">`;
    html += `<div class="task-group-title">${_esc(groupName)}</div>`;
    html += '<ul class="task-list">';

    groupTasks.forEach(task => {
      html += `
        <li class="task-item" data-task-id="${task.id}">
          <input
            type="checkbox"
            class="task-check"
            ${task.done ? 'checked' : ''}
            aria-label="${_esc(task.title)}"
          />
          <span
            class="task-text ${task.done ? 'done' : ''}"
            contenteditable="false"
            data-task-id="${task.id}"
          >${_esc(task.title)}</span>
          <button class="task-delete" data-task-id="${task.id}" aria-label="删除任务">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <line x1="3" y1="3" x2="11" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="11" y1="3" x2="3" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </li>
      `;
    });

    html += '</ul>';

    // 添加按钮
    html += `
      <div class="task-add">
        <button class="task-add-btn" data-group="${_esc(groupName)}">+ 添加任务</button>
      </div>
    `;

    html += '</div>';
  }

  // 如果没有任务，显示空状态
  if (Object.keys(groups).length === 0) {
    html += `
      <div class="task-group">
        <p style="color: var(--color-muted-soft); font-size: var(--text-body-sm);">暂无任务</p>
        <div class="task-add">
          <button class="task-add-btn" data-group="任务">+ 添加任务</button>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
  _bindEvents(container);
}

function _bindEvents(el) {
  // Checkbox change
  el.querySelectorAll('.task-check').forEach(cb => {
    cb.addEventListener('change', (e) => {
      e.stopPropagation();
      const taskId = cb.closest('.task-item').dataset.taskId;
      const week = store.getCurrentWeek();
      const taskIdx = (week.tasks || []).findIndex(t => t.id === taskId);
      if (taskIdx >= 0) {
        store.updateCurrent(`tasks.${taskIdx}.done`, cb.checked);
      }
    });
  });

  // Text inline edit
  el.querySelectorAll('.task-text').forEach(span => {
    span.addEventListener('click', () => {
      if (span.contentEditable === 'true') return;
      span.contentEditable = 'true';
      span.classList.add('editing');
      span.focus();
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(span);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    });

    span.addEventListener('blur', () => {
      if (span.contentEditable !== 'true') return;
      span.contentEditable = 'false';
      span.classList.remove('editing');
      const newTitle = span.textContent.trim();
      const taskId = span.dataset.taskId;
      const week = store.getCurrentWeek();
      const taskIdx = (week.tasks || []).findIndex(t => t.id === taskId);
      if (taskIdx >= 0 && newTitle !== week.tasks[taskIdx].title) {
        store.updateCurrent(`tasks.${taskIdx}.title`, newTitle);
      }
    });

    span.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        span.blur();
      }
      if (e.key === 'Escape') {
        span.textContent = store.getCurrentWeek()?.tasks?.find(t => t.id === span.dataset.taskId)?.title || '';
        span.blur();
      }
    });
  });

  // Delete button
  el.querySelectorAll('.task-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const taskId = btn.dataset.taskId;
      store.removeTask(taskId);
    });
  });

  // Add task button
  el.querySelectorAll('.task-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.group;
      store.addTask(group, '新任务');
      // 渲染后自动聚焦新任务
      setTimeout(() => {
        const lastItem = container.querySelector('.task-item:last-child .task-text');
        if (lastItem) {
          lastItem.click();
        }
      }, 100);
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
