export function getSize(size) {
  let retSize = size;
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
  let unitIndex = 0;
  while (retSize >= 1024 && unitIndex < units.length - 1) {
    retSize /= 1024;
    unitIndex++;
  }
  return `${retSize.toFixed(0)} ${units[unitIndex]}`;
}
export function matchExt(suffix, ext) {
  return ext.some(e => suffix.toLowerCase() === `.${e}`);
}