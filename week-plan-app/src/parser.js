/**
 * Markdown + YAML frontmatter 解析器
 * 将 .md 文件解析为结构化数据
 */

const TYPE_MAP = {
  'code': 'code',
  'content': 'content',
  'travel': 'travel',
  'training': 'training',
  'off': 'off',
  '开发': 'code',
  '内容': 'content',
  '出差': 'travel',
  '培训': 'training',
  '休息': 'off',
};

/**
 * 解析 YAML frontmatter
 * @param {string} raw frontmatter 文本
 * @returns {object}
 */
function parseFrontmatter(raw) {
  const data = {};
  const lines = raw.trim().split('\n');

  let currentKey = null;
  let currentArray = null;
  let currentObj = null;

  for (const line of lines) {
    // 跳过空行
    if (!line.trim()) continue;

    // 检测顶层 key: value
    const kvMatch = line.match(/^(\w[\w]*)\s*:\s*(.+)$/);
    // 检测顶层 key:
    const kMatch = line.match(/^(\w[\w]*)\s*:\s*$/);

    if (kMatch && !kvMatch) {
      currentKey = kMatch[1];
      currentArray = null;
      currentObj = null;
      // 下一行判断是数组还是对象
      continue;
    }

    if (kvMatch && !kMatch) {
      const key = kvMatch[1];
      const value = kvMatch[2].trim();

      if (currentKey) {
        // 在对象内
        if (!currentObj) {
          currentObj = {};
          data[currentKey] = currentObj;
        }
        currentObj[key] = parseValue(value);
      } else {
        data[key] = parseValue(value);
      }
      continue;
    }

    // 数组项: - key: value 或 - value
    const arrayItemMatch = line.match(/^\s*-\s+(.+)$/);
    if (arrayItemMatch) {
      const item = arrayItemMatch[1].trim();
      const itemKv = item.match(/^(\w[\w]*)\s*:\s*(.+)$/);
      if (itemKv) {
        // 对象数组项
        if (!currentArray) {
          currentArray = [];
          if (currentKey) {
            data[currentKey] = currentArray;
          }
        }
        const obj = { [itemKv[1]]: parseValue(itemKv[2]) };
        // 找最近的数组，看最后一项
        if (currentArray.length > 0 && typeof currentArray[currentArray.length - 1] === 'object') {
          // 检查是否同层级缩进——如果 item 有缩进，可能是上一个对象的属性
          const indent = line.match(/^(\s*)-/)[1].length;
          if (indent > 2) {
            Object.assign(currentArray[currentArray.length - 1], obj);
            continue;
          }
        }
        currentArray.push(obj);
      } else {
        // 简单值数组
        if (!currentArray) {
          currentArray = [];
          if (currentKey) {
            data[currentKey] = currentArray;
          }
        }
        currentArray.push(parseValue(item));
      }
      continue;
    }

    // 对象内子属性（缩进）
    const subMatch = line.match(/^\s{2,}(\w[\w]*)\s*:\s*(.+)$/);
    if (subMatch && currentArray && currentArray.length > 0) {
      const last = currentArray[currentArray.length - 1];
      if (typeof last === 'object') {
        last[subMatch[1]] = parseValue(subMatch[2].trim());
      }
      continue;
    }
  }

  return data;
}

/**
 * 解析 YAML 值
 * @param {string} value
 * @returns {any}
 */
function parseValue(value) {
  // 移除尾部注释
  value = value.replace(/\s*#.*$/, '').trim();

  // 布尔
  if (value === 'true') return true;
  if (value === 'false') return false;

  // null
  if (value === 'null' || value === '~') return null;

  // 数字
  if (/^-?\d+\.?\d*$/.test(value)) return Number(value);

  // 去掉引号
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}

/**
 * 从 Markdown 中提取 YAML frontmatter
 * @param {string} markdown
 * @returns {{ frontmatter: object, body: string }}
 */
function extractFrontmatter(markdown) {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (match) {
    return {
      frontmatter: parseFrontmatter(match[1]),
      body: markdown.slice(match[0].length),
    };
  }
  return { frontmatter: {}, body: markdown };
}

/**
 * 从 Markdown body 中解析天数信息（兼容无 frontmatter 的旧格式）
 * 支持两种表格格式：
 *   1. 按行（日=行）：第一列含周X
 *   2. 按列（日=列）：表头行含周X，数据行按列对应
 * @param {string} body
 * @returns {Array}
 */
function parseDaysFromBody(body) {
  const days = [];
  const tableRegex = /\|.*\|.*\|.*\|/g;
  const tables = body.match(tableRegex);
  if (!tables) return days;

  // 收集所有表格行
  const allRows = [];
  for (const row of tables) {
    const cells = row.split('|').filter(c => c.trim());
    if (cells.length < 3) continue;
    allRows.push(cells.map(c => c.replace(/\*\*/g, '').trim()));
  }

  if (allRows.length === 0) return days;

  // 判断格式：第一行第一个单元格是否含周X
  const firstCell = allRows[0][0];
  if (/周[一二三四五六日]/.test(firstCell)) {
    // 格式 1：行式（日=行）
    return parseRowOriented(allRows);
  }

  // 格式 2：列式（日=列）— 表头行含周X
  return parseColumnOriented(allRows);
}

/**
 * 行式解析：每行 = 一天
 * | **周一** | 💻 代码 | 画布 MVP |
 */
function parseRowOriented(rows) {
  const days = [];
  for (const cells of rows) {
    if (cells[0].startsWith('---')) continue;
    if (cells[0].startsWith('类型') && !/[周一二三四五六日]/.test(cells[0])) continue;

    const weekdayMatch = cells[0].match(/周[一二三四五六日]/);
    if (!weekdayMatch) continue;

    const typeLabel = (cells[1] || '');
    const taskLabel = (cells[2] || '');

    days.push({
      label: taskLabel !== '-' ? taskLabel : '',
      type: TYPE_MAP[typeLabel] || inferType(typeLabel) || 'off',
    });
  }
  return days;
}

/**
 * 列式解析：表头行含周X，每行=一种类别
 * | | 周一 06/08 | 周二 06/09 | ... |
 * | **类型** | 💻 代码 | 💻 代码 | ... |
 * | **DDLabs** | 画布 MVP | Docker + README | ... |
 */
function parseColumnOriented(rows) {
  if (rows.length < 2) return [];

  // 查找表头行（含周X）
  let headerIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i];
    const weekdayCount = cells.filter(c => /周[一二三四五六日]/.test(c)).length;
    if (weekdayCount >= 3) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) return [];

  // 从表头提取每天的类型和标签
  const header = rows[headerIdx];
  const dayMap = []; // [{weekday: '周一', colIdx: 1}, ...]
  for (let i = 1; i < header.length; i++) {
    const m = header[i].match(/周[一二三四五六日]/);
    if (m) {
      dayMap.push({ weekday: m[0], colIdx: i });
    }
  }

  // 初始化每天的数据
  const dayData = dayMap.map(d => ({ label: '', type: 'off', weekday: d.weekday }));

  // 解析数据行
  const TYPE_ROW_LABELS = ['类型', 'type'];
  for (const cells of rows) {
    if (cells === rows[headerIdx]) continue;
    if (cells[0].startsWith('---')) continue;
    if (cells.length < 2) continue;

    const rowLabel = cells[0].toLowerCase();

    // 类型行
    if (TYPE_ROW_LABELS.some(l => rowLabel.includes(l))) {
      for (const dm of dayMap) {
        const val = cells[dm.colIdx] || '';
        dayData[dayMap.indexOf(dm)].type = TYPE_MAP[val] || inferType(val) || 'off';
      }
      continue;
    }

    // 内容行（DDLabs、视频 等） — 填充 label
    for (const dm of dayMap) {
      const val = cells[dm.colIdx] || '';
      if (val && val !== '-') {
        const idx = dayMap.indexOf(dm);
        if (dayData[idx].label) {
          dayData[idx].label += ' / ' + val;
        } else {
          dayData[idx].label = val;
        }
      }
    }
  }

  return dayData.map(d => ({ label: d.label, type: d.type }));
}

/**
 * 从包含 emoji 和中文字符的类型字符串推断类型
 */
function inferType(label) {
  if (!label) return null;
  if (/代码|💻|开发|code|画布|MVP|Docker/i.test(label)) return 'code';
  if (/制作|🎬|视频|脚本|剪辑|录制|content/i.test(label)) return 'content';
  if (/出差|🚄|travel|杭州/i.test(label)) return 'travel';
  if (/培训|🏢|training/i.test(label)) return 'training';
  if (/休息|😴|off/i.test(label)) return 'off';
  return null;
}

/**
 * 解析 Markdown 正文获取归档分割信息
 * @param {string} body
 * @returns {{ title: string, description: string }}
 */
function parseHeadings(body) {
  const title = '';
  const description = '';

  const h1Match = body.match(/^# (.+)$/m);
  const h2Match = body.match(/^## (.+)$/m);

  return {
    title: h1Match ? h1Match[1] : '',
    description: h2Match ? h2Match[1] : '',
  };
}

/**
 * 完整解析一个周计划 Markdown 文件
 * @param {string} markdown 完整的 Markdown 文本
 * @param {string} fallbackWeekStart 如果没有 frontmatter，用文件名推断的日期
 * @returns {object} 结构化后的周计划数据
 */
export function parseWeekPlan(markdown, fallbackWeekStart = null) {
  const { frontmatter, body } = extractFrontmatter(markdown);
  const headings = parseHeadings(body);

  // 确保 days 存在
  let days = frontmatter.days || [];
  if (days.length === 0 && body) {
    days = parseDaysFromBody(body);
  }

  // 确保 tasks 存在
  const tasks = (frontmatter.tasks || []).map((t, i) => ({
    id: t.id || `t-${String(i + 1).padStart(3, '0')}`,
    group: t.group || '其他',
    title: t.title || t.text || '',
    done: t.done || false,
  }));

  // 确保 decisions 存在
  const decisions = frontmatter.decisions || [];

  // 确保 risks 存在
  const risks = frontmatter.risks || [];

  // 周起始日期（验证有效性）
  let weekStart = null;
  if (frontmatter.weekStart) {
    const d = new Date(frontmatter.weekStart + 'T00:00:00');
    weekStart = isNaN(d.getTime()) ? null : d;
  }
  if (!weekStart && fallbackWeekStart) {
    const d = new Date(fallbackWeekStart);
    weekStart = isNaN(d.getTime()) ? null : d;
  }

  return {
    weekStart,
    status: frontmatter.status || 'planning',
    title: headings.title || frontmatter.title || '',
    description: headings.description || frontmatter.description || '',
    days,
    tasks,
    decisions: decisions.map((d, i) => ({
      id: d.id || `d-${String(i + 1).padStart(3, '0')}`,
      category: d.category || '',
      title: d.title || '',
      value: d.value || '',
    })),
    risks,
    tags: frontmatter.tags || [],
    rawBody: body,
  };
}

