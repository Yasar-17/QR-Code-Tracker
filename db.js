const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data.json');

let data = { campaigns: [], scans: [], _nextCampaignId: 1, _nextScanId: 1 };

function load() {
  if (fs.existsSync(dbPath)) {
    data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  }
}

function save() {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function getTable(name) {
  return data[name] || [];
}

function nextId(name) {
  const key = `_next${name.charAt(0).toUpperCase() + name.slice(1)}Id`;
  return data[key]++;
}

function queryAll(table, filterFn) {
  const rows = data[table] || [];
  return filterFn ? rows.filter(filterFn) : [...rows];
}

function queryOne(table, filterFn) {
  return (data[table] || []).find(filterFn) || null;
}

function insert(table, record) {
  const idKey = table === 'campaigns' ? '_nextCampaignId' : '_nextScanId';
  const id = data[idKey]++;
  record.id = id;
  if (!data[table]) data[table] = [];
  data[table].push(record);
  save();
  return id;
}

function count(table, filterFn) {
  const rows = data[table] || [];
  return filterFn ? rows.filter(filterFn).length : rows.length;
}

function countDistinct(table, filterFn, distinctKey) {
  const rows = data[table] || [];
  const filtered = filterFn ? rows.filter(filterFn) : rows;
  const unique = new Set(filtered.map(r => r[distinctKey]));
  return unique.size;
}

function initDb() {
  load();
}

module.exports = { initDb, queryAll, queryOne, insert, count, countDistinct };
