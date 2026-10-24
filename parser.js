/* Разбор реальных сообщений склада. Не требует подключения к сети. */
(function (root) {
  'use strict';
  const tidy = value => String(value ?? '').trim();
  const addressPattern = /\b[A-Z]+\d+-\d+[A-Z]\d*(?:[A-Z]\d+)?\b/i;
  const fullAddress = /^([A-Z]+)(\d+)-(\d+)([A-Z])(\d*)(?:([A-Z])(\d+))?$/i;
  const anPattern = /\bAN\d{6,15}\b/ig;
  const supplyPattern = /\b\d{6,15}\b/;
  const countPattern = /(?:^|\s)(\d{1,5})\s*[кk](?=\s|$)/iu;
  const normalizeAddress = addr => tidy(addr).replace(/\s+/g, '').toUpperCase();
  function sortKey(addr) {
    const m = normalizeAddress(addr).match(fullAddress);
    if (!m) return null;
    return m[1].toUpperCase() + m[2].padStart(6, '0') + '-' + m[3].padStart(6, '0') + '-' +
      m[4].toUpperCase() + (m[5] || '0').padStart(6, '0') + '-' +
      (m[6] || '').toUpperCase() + (m[7] || '0').padStart(6, '0');
  }
  function uniqueAN(text) {
    return [...new Set((tidy(text).toUpperCase().match(anPattern) || []).map(x => x.toUpperCase()))];
  }
  function appendNote(oldNote, part) {
    const parts = [oldNote, part].map(tidy).filter(Boolean);
    return [...new Set(parts)].join('; ').slice(0, 800);
  }
  function parseRow(input) {
    const original = tidy(input);
    if (!original) return null;
    const locationMatch = original.match(addressPattern);
    if (!locationMatch) return {error: 'Не найден адрес ячейки', original};
    const location = normalizeAddress(locationMatch[0]);
    const key = sortKey(location);
    if (!key) return {error: 'Неверный адрес', original};

    // Скобки — дополнительная информация (часто номера товаров и количество).
    const parentheses = [...original.matchAll(/\([^)]*\)/g)].map(m => tidy(m[0]));
    let core = original.replace(/\([^)]*\)/g, ' ').replace(locationMatch[0], ' ');
    const anCodes = uniqueAN(core);
    core = core.replace(anPattern, ' ').replace(/[,;|\t]/g, ' ');
    const supplyMatch = core.match(supplyPattern);
    if (!supplyMatch) return {error: 'Не найден номер поставки', original};
    const supply = supplyMatch[0];  // строка: нули в начале НЕ отбрасываем
    core = core.replace(supplyMatch[0], ' ');
    const countMatch = core.match(countPattern);
    const boxCount = countMatch ? Number(countMatch[1]) : null;
    if (countMatch) core = core.replace(countMatch[0], ' ');
    const notes = appendNote(
      core.replace(/^[\s,;|–—-]+|[\s,;|–—-]+$/g, '').replace(/\s+/g, ' '),
      parentheses.join(' ')
    );
    const an = anCodes.join(', ');
    if (an.length > 4000) return {error: 'Слишком длинный список AN', original};
    return {location, sort_key:key, supply, an, notes, box_count:boxCount};
  }
  function parseBatch(input) {
    const lines=String(input ?? '').split(/\r?\n/);
    const good=[],bad=[];
    let groupStart=0, skipped=0, continued=0;
    const seen=new Map();
    function mergeRow(item) {
      const idxKey=item.location+'|'+item.supply;
      if (!seen.has(idxKey)) {seen.set(idxKey,good.length);good.push(item);return;}
      const prior=good[seen.get(idxKey)];
      prior.an=[...new Set([...uniqueAN(prior.an),...uniqueAN(item.an)])].join(', ');
      prior.notes=appendNote(prior.notes,item.notes);
      if (item.box_count!=null) prior.box_count=(prior.box_count||0)+item.box_count;
      continued++;
    }
    lines.forEach((raw,i)=>{
      const line=tidy(raw);
      if(!line){groupStart=good.length;return;}
      const row=parseRow(line);
      if(row && !row.error){mergeRow(row);return;}
      // Перенос длинного перечня AN на следующую строку: только AN + знаки препинания.
      const onlyAN = line.replace(anPattern, '').replace(/[\s,;|.]+/g, '') === '' && uniqueAN(line).length>0;
      if(onlyAN && good.length){const prior=good[good.length-1];prior.an=[...new Set([...uniqueAN(prior.an),...uniqueAN(line)])].join(', ');continued++;return;}
      // Отдельная строка ФОТО / К НАМ ПОЖАЛУЙСТА — комментарий ко всему текущему блоку.
      if(!addressPattern.test(line) && !/\b\d{6,}\b/.test(line) && /^[\p{L}\s.,!?:;()–—-]+$/u.test(line)){
        if(groupStart<good.length){for(let j=groupStart;j<good.length;j++)good[j].notes=appendNote(good[j].notes,line);continued++}
        else skipped++;
        return;
      }
      bad.push({num:i+1, error:row?.error||'Строка не распознана',original:line});
    });
    return {good,bad,lines:lines.filter(s=>tidy(s)).length,skipped,continued};
  }
  root.RichParser={parseRow,parseBatch,sortKey,uniqueAN,normalizeAddress};
})(typeof window === 'undefined' ? globalThis : window);
