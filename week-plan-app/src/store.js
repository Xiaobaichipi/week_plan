/**
 * 中央状态管理
 * 管理所有周计划数据，提供订阅/通知机制
 */

import { getMonday, formatDate } from './utils/date.js';
import { parseWeekPlan } from './parser.js';
import { generateMarkdown } from './writer.js';
import { writeFile, scanWeekFiles, readWeekFile } from './utils/file.js';
import { generateFilename } from './utils/date.js';

/**
 * @typedef {object} WeekData
 * @property {Date} weekStart
 * @property {string} status
 * @property {string} title
 * @property {string} description
 * @property {Array} days - 7天的时间分配
 * @property {Array} tasks - 任务列表
 * @property {Array} decisions - 决策记录
 * @property {Array} risks - 风险列表
 * @property {Array} tags - 标签
 * @property {string} rawBody - 原始 Markdown 正文
 * @property {string} filename - 对应文件名
 */

/**
 * 核心 Store
 */
class Store {
  constructor() {
    /** @type {Map<string, WeekData>} key: formatDate(weekStart) */
    this._weeks = new Map();

    /** @type {WeekData|null} 当前显示的周 */
    this._current = null;

    /** @type {string|null} 当前周 key */
    this._currentKey = null;

    /** @type {Array<Function>} */
    this._listeners = [];

    /** @type {Array<string>} 排序后的周 key 列表 */
    this._sortedKeys = [];
  }

  /**
   * 注册变更监听
   * @param {Function} fn
   */
  subscribe(fn) {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter(f => f !== fn);
    };
  }

  /** 通知所有监听者 */
  _notify(event, payload) {
    this._listeners.forEach(fn => fn(event, payload));
  }

  /**
   * 从目录加载所有周计划
   * @returns {Promise<Array<string>>} 所有周 key
   */
  async loadAll() {
    const files = await scanWeekFiles();
    this._weeks.clear();

    for (const { name, handle } of files) {
      try {
        const content = await handle.getFile().then(f => f.text());
        const data = parseWeekPlan(content);
        data.filename = name;
        data._fileHandle = handle;
        const validDate = data.weekStart && !isNaN(data.weekStart.getTime());
        const key = validDate ? formatDate(data.weekStart) : name;
        this._weeks.set(key, data);
      } catch (err) {
        console.error(`解析文件失败: ${name}`, err);
      }
    }

    this._updateSortedKeys();
    return this._sortedKeys;
  }

  /** 更新排序键列表 */
  _updateSortedKeys() {
    this._sortedKeys = [...this._weeks.keys()].sort().reverse();
  }

  /**
   * 获取所有周 key 列表（倒序）
   * @returns {Array<string>}
   */
  getWeekKeys() {
    return this._sortedKeys;
  }

  /**
   * 获取所有周数据（用于抽屉时间轴）
   * @returns {Array<{key: string, weekStart: Date, status: string}>}
   */
  getAllWeeksSummary() {
    return this._sortedKeys.map(key => {
      const w = this._weeks.get(key);
      return {
        key,
        weekStart: w.weekStart,
        status: w.status,
        taskCount: w.tasks ? w.tasks.length : 0,
        doneCount: w.tasks ? w.tasks.filter(t => t.done).length : 0,
      };
    });
  }

  /**
   * 获取指定周的数据
   * @param {string} key
   * @returns {WeekData|null}
   */
  getWeek(key) {
    return this._weeks.get(key) || null;
  }

  /**
   * 获取当前显示的周
   * @returns {WeekData|null}
   */
  getCurrentWeek() {
    return this._current;
  }

  /**
   * 获取当前周 key
   * @returns {string|null}
   */
  getCurrentKey() {
    return this._currentKey;
  }

  /**
   * 切换到指定周
   * @param {string} key
   */
  setCurrentWeek(key) {
    const data = this._weeks.get(key);
    if (data) {
      this._current = data;
      this._currentKey = key;
      this._notify('week-changed', { key, data });
    }
  }

  /**
   * 切换到上一周
   */
  goPreviousWeek() {
    const idx = this._sortedKeys.indexOf(this._currentKey);
    if (idx < this._sortedKeys.length - 1) {
      this.setCurrentWeek(this._sortedKeys[idx + 1]);
      return true;
    }
    return false;
  }

  /**
   * 切换到下一周
   */
  goNextWeek() {
    const idx = this._sortedKeys.indexOf(this._currentKey);
    if (idx > 0) {
      this.setCurrentWeek(this._sortedKeys[idx - 1]);
      return true;
    }
    return false;
  }

  /**
   * 更新当前周的某个字段
   * @param {string} path 点分隔路径，如 "tasks.0.done"
   * @param {any} value
   */
  async updateCurrent(path, value) {
    if (!this._current) return;
    _setDeep(this._current, path, value);
    await this._saveCurrent();
    this._notify('data-changed', { path, value });
  }

  /**
   * 更新当前周的天数信息
   * @param {number} dayIndex 0-6
   * @param {object} data
   */
  async updateDay(dayIndex, data) {
    if (!this._current) return;
    if (!this._current.days) this._current.days = [];
    // 自动填充 date（从 weekStart + dayIndex 推算）
    if (!this._current.days[dayIndex]?.date && this._current.weekStart) {
      const d = new Date(this._current.weekStart);
      d.setDate(d.getDate() + dayIndex);
      data.date = formatDate(d);
    }
    this._current.days[dayIndex] = {
      ...this._current.days[dayIndex],
      ...data,
    };
    await this._saveCurrent();
    this._notify('day-changed', { dayIndex, data });
  }

  /**
   * 添加任务
   * @param {string} group 分组
   * @param {string} title 任务名称
   */
  async addTask(group, title) {
    if (!this._current) return;
    if (!this._current.tasks) this._current.tasks = [];
    const ids = this._current.tasks.map(t => parseInt(t.id?.split('-')[1]) || 0);
    const nextId = `t-${String(Math.max(0, ...ids) + 1).padStart(3, '0')}`;
    this._current.tasks.push({
      id: nextId,
      group,
      title,
      done: false,
    });
    await this._saveCurrent();
    this._notify('task-added', { id: nextId, group, title });
  }

  /**
   * 删除任务
   * @param {string} taskId
   */
  async removeTask(taskId) {
    if (!this._current) return;
    this._current.tasks = (this._current.tasks || []).filter(t => t.id !== taskId);
    await this._saveCurrent();
    this._notify('task-removed', { id: taskId });
  }

  /**
   * 保存当前周到文件
   */
  async _saveCurrent() {
    if (!this._current) return;
    const md = generateMarkdown(this._current);
    const filename = this._current.filename || generateFilename(this._current.weekStart);
    this._current.filename = filename;
    await writeFile(filename, md);
  }

  /**
   * 创建新周
   * @param {Date} monday 周一日期
   * @param {'clone'|'blank'|'template'} source 数据来源
   */
  async createWeek(monday, source = 'clone') {
    let data = null;

    if (source === 'clone' && this._sortedKeys.length > 0) {
      // 从最近的周复制
      const latestKey = this._sortedKeys[0];
      const latest = this._weeks.get(latestKey);
      data = _cloneWeekData(latest, monday);
    } else if (source === 'template') {
      data = _createTemplateWeek(monday);
    } else {
      data = _createBlankWeek(monday);
    }

    const filename = generateFilename(monday);
    data.filename = filename;
    data._regenerateBody = true;

    const md = generateMarkdown(data);
    await writeFile(filename, md);

    // 重新加载
    await this.loadAll();
    const key = formatDate(monday);
    this.setCurrentWeek(key);
    this._notify('week-created', { key, data });
    return key;
  }

  /**
   * 导出所有周为 Markdown（打包下载）
   * @returns {Promise<Array<{name: string, content: string}>>}
   */
  async exportAll() {
    const results = [];
    for (const key of this._sortedKeys) {
      const data = this._weeks.get(key);
      const md = generateMarkdown(data);
      results.push({ name: data.filename || generateFilename(data.weekStart), content: md });
    }
    return results;
  }
}

// ── 内部工具函数 ──

function _setDeep(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!(key in current)) current[key] = {};
    current = current[key];
  }
  current[parts[parts.length - 1]] = value;
}

function _cloneWeekData(source, newMonday) {
  const data = JSON.parse(JSON.stringify(source));
  data.weekStart = newMonday;
  data.status = 'planning';

  // 偏移 days 日期
  if (data.days) {
    data.days.forEach((day, i) => {
      const d = new Date(newMonday);
      d.setDate(d.getDate() + i);
      day.date = formatDate(d);
    });
  }

  // 重置任务完成状态
  if (data.tasks) {
    data.tasks.forEach(t => { t.done = false; });
  }

  // 清空风险
  data.risks = [];

  // 保留上一周的 rawBody 作为参考，但标记重建
  data._regenerateBody = true;

  return data;
}

function _createBlankWeek(monday) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    days.push({
      date: formatDate(d),
      type: i >= 5 ? 'off' : 'code',
      label: '',
    });
  }
  return {
    weekStart: monday,
    status: 'planning',
    title: '',
    days,
    tasks: [],
    decisions: [],
    risks: [],
    tags: [],
    rawBody: '',
    _regenerateBody: true,
  };
}

function _createTemplateWeek(monday) {
  const data = _createBlankWeek(monday);
  data.title = '纯开发周';
  data.tasks = [
    { id: 't-001', group: '开发', title: '', done: false },
    { id: 't-002', group: '开发', title: '', done: false },
    { id: 't-003', group: '开发', title: '', done: false },
  ];
  data.tags = ['开发'];
  return data;
}

/** 单例 */
export const store = new Store();
