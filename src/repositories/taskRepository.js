const fs = require('fs/promises');
const path = require('path');
const config = require('../config');

/**
 * Görev verilerini fs modülü ile JSON dosyasında saklar.
 *
 * Dosya formatı: { "lastId": 12, "tasks": [ ... ] }
 * lastId sayesinde silinen görevlerin id'leri tekrar kullanılmaz.
 */

const EMPTY_STORE = { lastId: 0, tasks: [] };

async function readStore() {
  try {
    const raw = await fs.readFile(config.dataFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return structuredClone(EMPTY_STORE);
    throw err;
  }
}

/**
 * Atomik yazma: veri önce geçici bir dosyaya yazılır, ardından asıl dosyanın
 * yerine taşınır. Böylece yazma sırasında sunucu kapansa bile tasks.json
 * yarım kalıp bozulmaz.
 */
async function writeStore(store) {
  await fs.mkdir(path.dirname(config.dataFile), { recursive: true });
  const tempFile = `${config.dataFile}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(store, null, 2) + '\n', 'utf8');
  await renameWithRetry(tempFile, config.dataFile);
}

// Windows'ta dosya başka bir program tarafından kısa süreliğine açıksa
// rename EPERM/EBUSY verebilir; birkaç kez tekrar denenir.
async function renameWithRetry(from, to, attempts = 5) {
  for (let i = 1; ; i++) {
    try {
      return await fs.rename(from, to);
    } catch (err) {
      const retryable = err.code === 'EPERM' || err.code === 'EBUSY';
      if (!retryable || i === attempts) throw err;
      await new Promise((resolve) => setTimeout(resolve, 20 * i));
    }
  }
}

/**
 * Yazma işlemlerini sıraya sokar. Aynı anda iki istek gelse bile
 * "oku → değiştir → yaz" adımları birbirine karışmaz, veri kaybolmaz.
 */
let queue = Promise.resolve();

function mutate(changeFn) {
  const run = queue.then(async () => {
    const store = await readStore();
    const result = changeFn(store);
    await writeStore(store);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

async function findAll() {
  const { tasks } = await readStore();
  return tasks;
}

async function findById(id) {
  const tasks = await findAll();
  return tasks.find((task) => task.id === id) || null;
}

function create(data) {
  return mutate((store) => {
    store.lastId += 1;
    const task = { id: store.lastId, ...data };
    store.tasks.push(task);
    return task;
  });
}

function update(id, data) {
  return mutate((store) => {
    const index = store.tasks.findIndex((task) => task.id === id);
    if (index === -1) return null;
    store.tasks[index] = { ...store.tasks[index], ...data, id };
    return store.tasks[index];
  });
}

function remove(id) {
  return mutate((store) => {
    const index = store.tasks.findIndex((task) => task.id === id);
    if (index === -1) return null;
    const [deleted] = store.tasks.splice(index, 1);
    return deleted;
  });
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
