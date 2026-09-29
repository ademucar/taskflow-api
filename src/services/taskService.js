const taskRepository = require('../repositories/taskRepository');
const AppError = require('../utils/AppError');
const { normalizeText } = require('../utils/text');
const {
  DEFAULT_STATUS,
  DEFAULT_PRIORITY,
  PRIORITY_RANK,
  STATUS_RANK,
  SORTABLE_FIELDS,
  PAGINATION,
} = require('../constants/task');

// ---------------------------------------------------------------------------
// Sorgulama: filtreleme → arama → sıralama → sayfalama
// ---------------------------------------------------------------------------

function applyFilters(tasks, { status, priority, assignee, keyword }) {
  const statusKey = status?.trim();
  const priorityKey = priority?.trim();
  const assigneeKey = assignee && normalizeText(assignee.trim());
  const keywordKey = keyword && normalizeText(keyword.trim());

  return tasks.filter((task) => {
    if (statusKey && task.status !== statusKey) return false;
    if (priorityKey && task.priority !== priorityKey) return false;
    if (assigneeKey && normalizeText(task.assignee) !== assigneeKey) return false;
    if (keywordKey) {
      const haystack = normalizeText(`${task.title} ${task.description}`);
      if (!haystack.includes(keywordKey)) return false;
    }
    return true;
  });
}

function compareByField(a, b, field) {
  switch (field) {
    case 'priority':
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    case 'status':
      return STATUS_RANK[a.status] - STATUS_RANK[b.status];
    case 'title':
      return a.title.localeCompare(b.title, 'tr');
    default: // createdAt, updatedAt (ISO tarihleri metin olarak sıralanabilir)
      return a[field].localeCompare(b[field]);
  }
}

/**
 * sort parametresini uygular. Örnekler:
 *   sort=createdAt            → eskiden yeniye
 *   sort=-createdAt           → yeniden eskiye
 *   sort=-priority,createdAt  → önce önceliğe (yüksekten), eşitse tarihe göre
 */
function applySort(tasks, sort) {
  if (!sort) return tasks;

  const rules = sort.split(',').map((part) => {
    const raw = part.trim();
    const rule = raw.startsWith('-')
      ? { field: raw.slice(1), direction: -1 }
      : { field: raw, direction: 1 };

    if (!SORTABLE_FIELDS.includes(rule.field)) {
      throw AppError.badRequest(
        `Geçersiz sıralama alanı: "${rule.field}". Kullanılabilir alanlar: ${SORTABLE_FIELDS.join(', ')}.`,
      );
    }
    return rule;
  });

  return [...tasks].sort((a, b) => {
    for (const { field, direction } of rules) {
      const result = compareByField(a, b, field);
      if (result !== 0) return result * direction;
    }
    return a.id - b.id;
  });
}

// page veya limit gönderilmediyse tüm sonuçlar döner.
function applyPagination(tasks, { page, limit }) {
  if (page === undefined && limit === undefined) {
    return { items: tasks, pagination: null };
  }

  const currentPage = Number(page) || PAGINATION.DEFAULT_PAGE;
  const perPage = Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const start = (currentPage - 1) * perPage;

  return {
    items: tasks.slice(start, start + perPage),
    pagination: {
      page: currentPage,
      limit: perPage,
      total: tasks.length,
      totalPages: Math.ceil(tasks.length / perPage),
    },
  };
}

/**
 * GET /tasks, /tasks/search ve /tasks/assignee/:assignee uçlarının ortak sorgu motoru.
 */
async function queryTasks(options = {}) {
  const tasks = await taskRepository.findAll();
  const filtered = applyFilters(tasks, options);
  const sorted = applySort(filtered, options.sort);
  return applyPagination(sorted, options);
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

// Doğrulanmış istek gövdesinden kaydedilecek görev alanlarını oluşturur.
// PUT tam güncelleme olduğu için gönderilmeyen alanlar varsayılana döner.
function buildTaskFields(input) {
  return {
    title: input.title.trim(),
    description: (input.description ?? '').trim(),
    status: input.status?.trim() || DEFAULT_STATUS,
    priority: input.priority?.trim() || DEFAULT_PRIORITY,
    assignee: input.assignee.trim(),
  };
}

const taskNotFound = (id) => AppError.notFound(`${id} id'li görev bulunamadı.`);

// Verilen alanları günceller ve updatedAt'i yeniler.
async function applyUpdate(id, fields) {
  const updated = await taskRepository.update(id, {
    ...fields,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) throw taskNotFound(id);
  return updated;
}

async function getTaskById(id) {
  const task = await taskRepository.findById(id);
  if (!task) throw taskNotFound(id);
  return task;
}

async function createTask(input) {
  const now = new Date().toISOString();
  return taskRepository.create({
    ...buildTaskFields(input),
    createdAt: now,
    updatedAt: now,
  });
}

// PUT: görevin tüm düzenlenebilir alanlarını değiştirir
async function updateTask(id, input) {
  return applyUpdate(id, buildTaskFields(input));
}

// PATCH /tasks/:id/status: yalnızca durumu değiştirir
async function updateTaskStatus(id, status) {
  return applyUpdate(id, { status: status.trim() });
}

// PATCH /tasks/:id/assign: görevi başka bir çalışana atar
async function assignTask(id, assignee) {
  return applyUpdate(id, { assignee: assignee.trim() });
}

async function deleteTask(id) {
  const deleted = await taskRepository.remove(id);
  if (!deleted) throw taskNotFound(id);
  return deleted;
}

module.exports = {
  queryTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  assignTask,
  deleteTask,
};
