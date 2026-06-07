/**
 * CreateModal — 创建新周 Modal
 * 日期选择 + 来源选择（复制/空白/模板）
 */

import { store } from '../store.js';
import { getMonday, formatDate } from '../utils/date.js';

let modal = null;
let overlay = null;
let dateInput = null;
let confirmBtn = null;
let cancelBtn = null;
let closeBtn = null;

export function init() {
  modal = document.getElementById('create-modal');
  overlay = document.getElementById('create-modal-overlay');
  dateInput = document.getElementById('modal-week-start');
  confirmBtn = document.getElementById('btn-modal-confirm');
  cancelBtn = document.getElementById('btn-modal-cancel');
  closeBtn = document.getElementById('btn-modal-close');

  // 监听外部触发
  window.addEventListener('open-create-modal', open);

  closeBtn?.addEventListener('click', close);
  cancelBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', close);

  confirmBtn?.addEventListener('click', async () => {
    await handleCreate();
  });

  // Escape to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal?.classList.contains('hidden')) {
      close();
    }
  });
}

function open() {
  // 默认日期：从当前周的下一周周一，或本周周一
  const current = store.getCurrentWeek();
  const nextMonday = current
    ? new Date(current.weekStart.getTime() + 7 * 86400000)
    : getMonday(new Date(Date.now() + 7 * 86400000));

  if (dateInput) {
    dateInput.value = formatDate(nextMonday);
  }

  // 重置来源选项
  const cloneRadio = document.querySelector('input[name="source"][value="clone"]');
  if (cloneRadio) cloneRadio.checked = true;

  modal?.classList.remove('hidden');
  overlay?.classList.remove('hidden');
  dateInput?.focus();
}

function close() {
  modal?.classList.add('hidden');
  overlay?.classList.add('hidden');
}

async function handleCreate() {
  const dateStr = dateInput?.value;
  if (!dateStr) {
    alert('请选择周一日期');
    return;
  }

  const monday = new Date(dateStr + 'T00:00:00');
  if (isNaN(monday.getTime())) {
    alert('日期格式无效');
    return;
  }

  // 验证是否为周一
  if (monday.getDay() !== 1) {
    const realMonday = getMonday(monday);
    const ok = confirm('所选日期不是周一，已自动调整为 ' + formatDate(realMonday) + '。是否继续？');
    if (!ok) return;
    monday.setTime(realMonday.getTime());
  }

  const sourceRadio = document.querySelector('input[name="source"]:checked');
  const source = sourceRadio?.value || 'clone';

  try {
    confirmBtn.disabled = true;
    confirmBtn.textContent = '创建中...';
    await store.createWeek(monday, source);
    close();
  } catch (err) {
    alert('创建失败: ' + err.message);
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = '创建';
  }
}

export function destroy() {
  window.removeEventListener('open-create-modal', open);
  modal = null;
  overlay = null;
}
