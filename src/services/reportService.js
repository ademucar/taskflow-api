const taskRepository = require('../repositories/taskRepository');
const { normalizeText } = require('../utils/text');
const { TASK_STATUSES, TASK_PRIORITIES } = require('../constants/task');

// Tamamlanmamış (pending + in-progress) görevler "bekleyen" sayılır.
const isCompleted = (task) => task.status === 'completed';

// Yüzdeyi bir ondalık basamakla döndürür: (4, 12) → 33.3
function percentage(part, total) {
  return total === 0 ? 0 : Math.round((part / total) * 1000) / 10;
}

// ['a','b'] → { a: 0, b: 0 } şeklinde sayaç nesnesi
function countBy(tasks, field, keys) {
  const counts = Object.fromEntries(keys.map((key) => [key, 0]));
  for (const task of tasks) counts[task[field]] += 1;
  return counts;
}

/**
 * Görevleri bir alana göre (assignee, project) gruplar ve her grup için
 * toplam, tamamlanan, bekleyen sayılarını hesaplar. En çok görevi olan en üstte.
 * Projesi olmayan görevler "project: null" grubunda toplanır.
 */
function groupBy(tasks, field) {
  const groups = new Map();

  for (const task of tasks) {
    const value = task[field] ?? null;
    const key = value === null ? '' : normalizeText(value);
    if (!groups.has(key)) {
      groups.set(key, { [field]: value, total: 0, completed: 0, pending: 0 });
    }
    const group = groups.get(key);
    group.total += 1;
    if (isCompleted(task)) group.completed += 1;
    else group.pending += 1;
  }

  const byName = (a, b) => {
    if (a[field] === null) return 1; // projesiz grup en sonda
    if (b[field] === null) return -1;
    return a[field].localeCompare(b[field], 'tr');
  };

  return [...groups.values()]
    .map((group) => ({ ...group, completionRate: percentage(group.completed, group.total) }))
    .sort((a, b) => b.total - a.total || byName(a, b));
}

// GET /reports/completed
async function getCompletedReport() {
  const tasks = await taskRepository.findAll();
  const count = tasks.filter(isCompleted).length;

  return {
    count,
    total: tasks.length,
    percentage: percentage(count, tasks.length),
  };
}

// GET /reports/pending
async function getPendingReport() {
  const tasks = await taskRepository.findAll();
  const pendingTasks = tasks.filter((task) => !isCompleted(task));

  return {
    count: pendingTasks.length,
    total: tasks.length,
    percentage: percentage(pendingTasks.length, tasks.length),
    breakdown: {
      pending: pendingTasks.filter((task) => task.status === 'pending').length,
      'in-progress': pendingTasks.filter((task) => task.status === 'in-progress').length,
    },
    highPriority: pendingTasks.filter((task) => task.priority === 'high').length,
  };
}

// GET /reports/summary
async function getSummaryReport() {
  const tasks = await taskRepository.findAll();
  const completed = tasks.filter(isCompleted).length;

  return {
    totalTasks: tasks.length,
    completedTasks: completed,
    pendingTasks: tasks.length - completed,
    completionRate: percentage(completed, tasks.length),
    byStatus: countBy(tasks, 'status', TASK_STATUSES),
    byPriority: countBy(tasks, 'priority', TASK_PRIORITIES),
    byAssignee: groupBy(tasks, 'assignee'),
    byProject: groupBy(tasks, 'project'),
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getCompletedReport,
  getPendingReport,
  getSummaryReport,
};
