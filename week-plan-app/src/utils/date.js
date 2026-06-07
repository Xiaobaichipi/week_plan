/**
 * 日期工具函数
 * 处理周一起始的周计划日期计算
 */

const WEEKDAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const WEEKDAY_NAMES_FULL = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

/**
 * 获取某个日期所在周的周一日期
 * @param {Date} date
 * @returns {Date}
 */
export function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=周日
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 获取周一后的第n天
 * @param {Date} monday
 * @param {number} offset 0-6
 * @returns {Date}
 */
export function getDayFromMonday(monday, offset) {
  const d = new Date(monday);
  d.setDate(d.getDate() + offset);
  return d;
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 格式化周范围字符串
 * @param {Date} monday
 * @returns {string} e.g. "2026-06-08 ~ 2026-06-14"
 */
export function formatWeekRange(monday) {
  const end = getDayFromMonday(monday, 6);
  return `${formatDate(monday)} ~ ${formatDate(end)}`;
}

/**
 * 获取星期几的中文名
 * @param {Date} date
 * @returns {string}
 */
export function getWeekdayCN(date) {
  return WEEKDAY_NAMES[date.getDay() === 0 ? 6 : date.getDay() - 1];
}

/**
 * 判断两个日期是否为同一天
 * @param {Date} a
 * @param {Date} b
 * @returns {boolean}
 */
export function isSameDay(a, b) {
  return formatDate(a) === formatDate(b);
}

/**
 * 从文件名提取周一日期
 * @param {string} filename e.g. "week_plan_2026-06-08.md"
 * @returns {Date|null}
 */
export function parseWeekStartFromFilename(filename) {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  const d = new Date(match[1] + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * 生成周计划文件名
 * @param {Date} monday
 * @returns {string}
 */
export function generateFilename(monday) {
  return `week_plan_${formatDate(monday)}.md`;
}
