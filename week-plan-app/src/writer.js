/**
 * Markdown 写入器
 * 将结构化数据生成 Markdown + YAML frontmatter
 */

import { formatDate, formatWeekRange, getDayFromMonday } from './utils/date.js';
import { getWeekdayCN } from './utils/date.js';

/**
 * YAML 值转字符串
 * @param {any} value
 * @param {number} indent
 * @returns {string}
 */
function yamlValue(value, indent = 0) {
  const pad = '  '.repeat(indent);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (value === null || value === undefined) return '~';
  if (typeof value === 'string') {
    // 如果包含特殊字符，加引号
    if (/[:\n\{\}\[\],&*?|#<>@!`'"]/.test(value) || value.includes('#')) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map(v => {
      if (typeof v === 'object' && !Array.isArray(v)) {
        const lines = Object.entries(v).map(([k, val]) =>
          `    ${k}: ${yamlValue(val, 0)}`
        );
        return `  - ${lines[0].trim()}\n` + lines.slice(1).map(l => '  ' + l).join('\n');
      }
      return `${pad}  - ${yamlValue(v, 0)}`;
    });
    return '\n' + items.join('\n');
  }
  if (typeof value === 'object') {
    const lines = Object.entries(value).map(([k, v]) =>
      `${pad}  ${k}: ${yamlValue(v, indent + 1)}`
    );
    return '\n' + lines.join('\n');
  }
  return String(value);
}

const DAY_TYPE_CN = {
  code: '💻 代码',
  content: '🎬 制作',
  travel: '🚄 出差',
  training: '🏢 培训',
  off: '😴 休息',
};

/**
 * 生成 YAML frontmatter 字符串
 * @param {object} data
 * @returns {string}
 */
function generateFrontmatter(data) {
  const lines = ['---'];

  lines.push(`weekStart: ${formatDate(data.weekStart)}`);
  lines.push(`status: ${data.status || 'planning'}`);

  if (data.title) {
    lines.push(`title: "${data.title}"`);
  }

  if (data.tags && data.tags.length > 0) {
    lines.push(`tags:`);
    data.tags.forEach(t => lines.push(`  - ${t}`));
  }

  // Days
  if (data.days && data.days.length > 0) {
    lines.push('days:');
    data.days.forEach(day => {
      if (typeof day === 'object' && day.date) {
        lines.push(`  - date: ${day.date}`);
        lines.push(`    type: ${day.type || 'off'}`);
        lines.push(`    label: "${(day.label || '').replace(/"/g, '\\"')}"`);
      }
    });
  }

  // Tasks
  if (data.tasks && data.tasks.length > 0) {
    lines.push('tasks:');
    data.tasks.forEach(task => {
      lines.push(`  - id: ${task.id}`);
      lines.push(`    group: "${(task.group || '').replace(/"/g, '\\"')}"`);
      lines.push(`    title: "${(task.title || '').replace(/"/g, '\\"')}"`);
      lines.push(`    done: ${task.done ? 'true' : 'false'}`);
    });
  }

  // Decisions
  if (data.decisions && data.decisions.length > 0) {
    lines.push('decisions:');
    data.decisions.forEach(d => {
      lines.push(`  - id: ${d.id}`);
      lines.push(`    category: "${(d.category || '').replace(/"/g, '\\"')}"`);
      lines.push(`    title: "${(d.title || '').replace(/"/g, '\\"')}"`);
      lines.push(`    value: "${(d.value || '').replace(/"/g, '\\"')}"`);
    });
  }

  // Risks
  if (data.risks && data.risks.length > 0) {
    lines.push('risks:');
    data.risks.forEach(r => lines.push(`  - "${String(r).replace(/"/g, '\\"')}"`));
  }

  lines.push('---');
  lines.push('');
  return lines.join('\n');
}

/**
 * 生成 Markdown 正文（人类可读部分）
 * @param {object} data
 * @returns {string}
 */
function generateBody(data) {
  const lines = [];

  // 标题
  const title = data.title || `周计划 ${formatWeekRange(data.weekStart)}`;
  lines.push(`# 📋 ${title}`);
  lines.push('');

  // 生成日期
  const generatedDate = formatDate(new Date());
  lines.push(`> 生成日期：${generatedDate} | 状态：${data.status === 'done' ? '✅ 完成' : data.status === 'active' ? '🔄 进行中' : '📋 规划中'}`);
  lines.push('');

  // 时间分配表
  lines.push('## 🗓 时间分配');
  lines.push('');
  lines.push('| | 周一 | 周二 | 周三 | 周四 | 周五 | 周六 | 周日 |');
  lines.push('|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|');
  lines.push('| **类型** | ' + Array.from({ length: 7 }, (_, i) => {
    const day = (data.days || [])[i];
    return day ? DAY_TYPE_CN[day.type] || day.type : '-';
  }).join(' | ') + ' |');
  lines.push('| **任务** | ' + Array.from({ length: 7 }, (_, i) => {
    const day = (data.days || [])[i];
    return day ? (day.label || '-') : '-';
  }).join(' | ') + ' |');
  lines.push('');

  // 任务列表
  if (data.tasks && data.tasks.length > 0) {
    const groups = {};
    data.tasks.forEach(t => {
      const g = t.group || '其他';
      if (!groups[g]) groups[g] = [];
      groups[g].push(t);
    });

    for (const [group, tasks] of Object.entries(groups)) {
      lines.push(`## ${group}`);
      lines.push('');
      tasks.forEach(t => {
        const check = t.done ? '[x]' : '[ ]';
        lines.push(`- ${check} ${t.title}`);
      });
      lines.push('');
    }
  }

  // 决策表
  if (data.decisions && data.decisions.length > 0) {
    lines.push('## 📐 架构决策速查');
    lines.push('');
    lines.push('| # | 分类 | 决策项 | 结论 |');
    lines.push('|---|------|--------|------|');
    data.decisions.forEach(d => {
      lines.push(`| ${d.id} | ${d.category} | ${d.title} | ${d.value} |`);
    });
    lines.push('');
  }

  // 风险
  if (data.risks && data.risks.length > 0) {
    lines.push('## ⚠️ 风险 & 注意事项');
    lines.push('');
    data.risks.forEach(r => lines.push(`- ${r}`));
    lines.push('');
  }

  // 备注
  if (data.rawBody && data.rawBody.trim()) {
    lines.push('---');
    lines.push('');
    lines.push(data.rawBody.trim());
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 生成完整的 Markdown 文件内容
 * @param {object} data 结构化周计划数据
 * @returns {string}
 */
export function generateMarkdown(data) {
  const frontmatter = generateFrontmatter(data);

  // 检查是否需要重新生成 body
  if (!data.rawBody || data._regenerateBody) {
    return frontmatter + generateBody(data);
  }

  return frontmatter + (data.rawBody || '');
}
