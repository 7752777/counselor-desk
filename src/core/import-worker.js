/* v4 import worker. The release builder replaces the marker with the offline
 * SheetJS runtime so Excel parsing never blocks the renderer main thread. */
/*__XLSX_SOURCE__*/

'use strict';

if (typeof XLSX === 'undefined' && typeof importScripts === 'function') {
  // Source-mode workers are loaded from src/core/import-worker.js, so the
  // offline SheetJS bundle lives two levels above (vendor/). The release
  // builder embeds SheetJS at the marker and never takes this branch.
  try { importScripts('../../vendor/xlsx.full.min.js'); } catch (_) {}
}

function rowsToCSV(rows) {
  return (rows || []).map(row => (row || []).map(cell => {
    const value = cell == null ? '' : String(cell);
    return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }).join(',')).join('\n');
}

function parseExcel(buffer, options) {
  if (typeof XLSX === 'undefined') throw new Error('IMPORT_XLSX_UNAVAILABLE');
  const workbook = XLSX.read(buffer, { type:'array', cellDates:false, raw:false });
  let sheetName = options.sheetName && workbook.Sheets[options.sheetName] ? options.sheetName : workbook.SheetNames[0];
  if (!sheetName) return { rows:[], sheetNames:[] };
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header:1, defval:'', raw:false });
  return { rows, sheetNames:workbook.SheetNames.slice(), sheetName };
}

self.onmessage = async event => {
  const request = event.data || {};
  try {
    if (request.kind === 'excel') {
      const result = parseExcel(request.buffer, request);
      self.postMessage({ id:request.id, ok:true, ...result });
      return;
    }
    const bytes = new Uint8Array(request.buffer || new ArrayBuffer(0));
    let encoding = String(request.encoding || 'utf-8').toLowerCase();
    if (encoding === 'auto') encoding = bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF ? 'utf-8' : 'utf-8';
    let text;
    try { text = new TextDecoder(encoding === 'gbk' ? 'gb18030' : encoding).decode(bytes); }
    catch (_) { text = new TextDecoder('utf-8').decode(bytes); encoding = 'utf-8'; }
    self.postMessage({ id:request.id, ok:true, text, encoding });
  } catch (error) {
    self.postMessage({ id:request.id, ok:false, error:String(error && error.message || error) });
  }
};
