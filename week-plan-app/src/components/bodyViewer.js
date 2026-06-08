/**
 * BodyViewer — Markdown 正文渲染组件
 * 将 rawBody 渲染为 HTML，展示完整计划内容
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
  const rawBody = week?.rawBody || '';

  if (!rawBody.trim()) {
    container.innerHTML = '';
    return;
  }

  const html = `
    <div class="section">
      <div class="section-header">
        <span class="section-label">正文</span>
        <h2 class="section-title">📄 计划详情</h2>
      </div>
      <div class="body-content">
        ${markdownToHtml(rawBody)}
      </div>
    </div>
  `;

  container.innerHTML = html;
}

/**
 * 简易 Markdown → HTML 转换器
 */
function markdownToHtml(md) {
  let html = md;

  // 代码块（先处理，避免内部内容被转义）
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="body-code"><code class="language-${lang || 'plaintext'}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code class="body-inline-code">$1</code>');

  // 标题
  html = html.replace(/^#### (.+)$/gm, '<h4 class="body-h4">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="body-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="body-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="body-h1">$1</h1>');

  // 水平线
  html = html.replace(/^---$/gm, '<hr class="body-hr" />');

  // 粗体+斜体
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Markdown 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // 引用块
  html = html.replace(/^> (.+)$/gm, '<blockquote class="body-blockquote"><p>$1</p></blockquote>');

  // 无序列表
  html = html.replace(/^(\s*)[-*] (.+)$/gm, (_, indent, text) => {
    const level = Math.floor(indent.length / 2);
    const pad = '  '.repeat(level);
    return `${pad}<li>${text}</li>`;
  });

  // 有序列表
  html = html.replace(/^(\s*)\d+\. (.+)$/gm, (_, indent, text) => {
    const level = Math.floor(indent.length / 2);
    const pad = '  '.repeat(level);
    return `${pad}<li>${text}</li>`;
  });

  // 换行 → <br>（保留段落间距）
  // 先不转换，用段落模式

  // 表格
  html = html.replace(/(^\|.+$\n?)+/gm, (tableBlock) => {
    const rows = tableBlock.trim().split('\n');
    if (rows.length < 2) return tableBlock;

    let tableHtml = '<table class="body-table"><tbody>';

    rows.forEach((row, i) => {
      // 跳过分隔行
      if (/^\|[\s\-:|]+\|$/.test(row)) return;
      const cells = row.split('|').filter(c => c.trim());
      const tag = i === 0 ? 'th' : 'td';
      tableHtml += '<tr>';
      cells.forEach(cell => {
        tableHtml += `<${tag}>${cell.trim()}</${tag}>`;
      });
      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';
    return tableHtml;
  });

  // 段落：连续非空行合并为段落
  const lines = html.split('\n');
  const result = [];
  let paragraph = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 跳过已处理的 HTML 标签行
    if (/^<(h[1-4]|hr|pre|table|blockquote|li|ul|ol|div|code)/.test(line.trim()) ||
        /^<\/(pre|table|blockquote|ul|ol|div)>/.test(line.trim())) {
      if (paragraph.length > 0) {
        result.push(`<p>${paragraph.join('<br>')}</p>`);
        paragraph = [];
      }
      result.push(line);
      continue;
    }

    if (line.trim() === '') {
      if (paragraph.length > 0) {
        result.push(`<p>${paragraph.join('<br>')}</p>`);
        paragraph = [];
      }
    } else {
      paragraph.push(line);
    }
  }
  if (paragraph.length > 0) {
    result.push(`<p>${paragraph.join('<br>')}</p>`);
  }

  return result.join('\n');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function destroy() {
  if (unsubscribe) unsubscribe();
  container = null;
}
