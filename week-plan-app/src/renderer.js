/**
 * DOM 渲染器
 * 协调所有组件，将 store 数据渲染到主界面
 */

import { store } from './store.js';
import { animateTimeGridEntrance, animatePageTransition } from './animations.js';

import * as WeekSelector from './components/weekSelector.js';
import * as TimeGrid from './components/timeGrid.js';
import * as TaskList from './components/taskList.js';
import * as DecisionTable from './components/decisionTable.js';
import * as RiskList from './components/riskList.js';
import * as BodyViewer from './components/bodyViewer.js';
import * as Drawer from './components/drawer.js';
import * as CreateModal from './components/createModal.js';

let mainContent = null;

/**
 * 初始化整个应用界面
 */
export function initUI() {
  // 初始化抽屉和 Modal（它们是全局组件）
  Drawer.init();
  CreateModal.init();

  // 主内容区
  mainContent = document.getElementById('week-content');
  if (!mainContent) return;

  // 创建内容结构
  mainContent.innerHTML = `
    <div id="section-timegrid" class="section">
      <div class="section-header">
        <span class="section-label">时间分配</span>
        <h2 class="section-title">🗓 本周时间线</h2>
      </div>
      <div id="timegrid-container"></div>
    </div>

    <div id="section-tasks" class="section">
      <div class="section-header">
        <span class="section-label">任务</span>
        <h2 class="section-title">✅ 任务清单</h2>
      </div>
      <div id="tasklist-container"></div>
    </div>

    <div id="section-decisions"></div>
    <div id="section-risks"></div>
    <div id="section-body"></div>
  `;

  // 初始化各组件
  WeekSelector.init(document.getElementById('week-selector-container'));
  TimeGrid.init(document.getElementById('timegrid-container'));
  TaskList.init(document.getElementById('tasklist-container'));
  DecisionTable.init(document.getElementById('section-decisions'));
  RiskList.init(document.getElementById('section-risks'));
  BodyViewer.init(document.getElementById('section-body'));

  // 监听周切换 → 播放动画
  store.subscribe((event) => {
    if (event === 'week-changed' || event === 'week-created') {
      _onWeekChanged();
    }
  });
}

/**
 * 周切换后重播入场动画
 */
async function _onWeekChanged() {
  // 短暂延迟等 DOM 更新
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => requestAnimationFrame(r));

  // 翻页过渡
  if (mainContent) {
    animatePageTransition(mainContent);
  }

  // 卡片入场
  const cards = document.querySelectorAll('.day-card');
  if (cards.length > 0) {
    animateTimeGridEntrance('.day-card');
  }
}

/**
 * 触发 re-render
 */
export function refresh() {
  WeekSelector.update?.();
}
