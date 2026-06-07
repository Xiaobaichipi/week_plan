/**
 * File System Access API 封装
 * 读写本地 Markdown 文件
 */

/** @type {FileSystemDirectoryHandle|null} */
let directoryHandle = null;

/**
 * 请求用户选择计划数据目录
 * @returns {Promise<FileSystemDirectoryHandle|null>}
 */
export async function selectDirectory() {
  try {
    directoryHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
    });
    return directoryHandle;
  } catch (err) {
    if (err.name === 'AbortError') return null;
    throw err;
  }
}

/**
 * 获取当前目录句柄
 * @returns {FileSystemDirectoryHandle|null}
 */
export function getDirectoryHandle() {
  return directoryHandle;
}

/**
 * 设置目录句柄（恢复时使用）
 * @param {FileSystemDirectoryHandle} handle
 */
export function setDirectoryHandle(handle) {
  directoryHandle = handle;
}

/**
 * 扫描目录下所有 week_plan_*.md 文件
 * @returns {Promise<Array<{name: string, handle: FileSystemFileHandle}>>}
 */
export async function scanWeekFiles() {
  if (!directoryHandle) return [];

  const files = [];
  for await (const [name, handle] of directoryHandle.entries()) {
    if (handle.kind === 'file' && name.startsWith('week_plan_') && name.endsWith('.md')) {
      files.push({ name, handle });
    }
  }
  // 按文件名倒序（最新在前）
  files.sort((a, b) => b.name.localeCompare(a.name));
  return files;
}

/**
 * 读取文件内容
 * @param {FileSystemFileHandle} fileHandle
 * @returns {Promise<string>}
 */
export async function readFile(fileHandle) {
  const file = await fileHandle.getFile();
  return await file.text();
}

/**
 * 写入文件内容
 * @param {string} filename
 * @param {string} content
 * @returns {Promise<void>}
 */
export async function writeFile(filename, content) {
  if (!directoryHandle) throw new Error('未选择数据目录');

  const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

/**
 * 删除文件
 * @param {string} filename
 * @returns {Promise<void>}
 */
export async function deleteFile(filename) {
  if (!directoryHandle) throw new Error('未选择数据目录');
  await directoryHandle.removeEntry(filename);
}

/**
 * 读取特定周计划文件
 * @param {string} filename
 * @returns {Promise<string|null>}
 */
export async function readWeekFile(filename) {
  if (!directoryHandle) return null;
  try {
    const fileHandle = await directoryHandle.getFileHandle(filename);
    return await readFile(fileHandle);
  } catch {
    return null;
  }
}

/**
 * 检查浏览器是否支持 File System Access API
 * @returns {boolean}
 */
export function isSupported() {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}
