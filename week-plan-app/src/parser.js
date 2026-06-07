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
 * @param {string} body
 * @returns {Array}
 */
function parseDaysFromBody(body) {
  const days = [];
  const tableRegex = /\|.*\|.*\|.*\|/g;
  const tables = body.match(tableRegex);
  if (!tables) return days;

  for (const row of tables) {
    const cells = row.split('|').filter(c => c.trim());
    if (cells.length < 3) continue;
    // 跳过表头
    if (cells[0].trim().startsWith('**类型**') || cells[0].trim().startsWith('---')) continue;

    const dayLabel = cells[0].replace(/\*\*/g, '').trim();
    const typeLabel = cells[1].replace(/\*\*/g, '').trim();
    const taskLabel = cells[2].replace(/\*\*/g, '').trim();

    const weekdayMatch = dayLabel.match(/周[一二三四五六日]/);
    if (!weekdayMatch) continue;

    days.push({
      weekday: weekdayMatch[0],
      label: taskLabel !== '-' ? taskLabel : '',
      type: TYPE_MAP[typeLabel] || 'off',
    });
  }
  return days;
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

  // 周起始日期
  let weekStart = null;
  if (frontmatter.weekStart) {
    weekStart = new Date(frontmatter.weekStart + 'T00:00:00');
  } else if (fallbackWeekStart) {
    weekStart = new Date(fallbackWeekStart);
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

