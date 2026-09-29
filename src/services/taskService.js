const taskRepository = require('../repositories/taskRepository');
const AppError = require('../utils/AppError');
const { DEFAULT_STATUS, DEFAULT_PRIORITY } = require('../constants/task');

// İstemciden gelen veriden kaydedilecek görev alanlarını oluşturur.
// PUT tam güncelleme olduğu için gönderilmeyen alanlar varsayılana döner.
function buildTaskFields(input) {
  return {
    title: input.title.trim(),
    description: (input.description ?? '').trim(),
    status: input.status ?? DEFAULT_STATUS,
    priority: input.priority ?? DEFAULT_PRIORITY,
    assignee: input.assignee.trim(),
  };
}

function assertRequiredFields(input) {
  const missing = ['title', 'assignee'].filter(
    (field) => typeof input[field] !== 'string' || input[field].trim() === '',
  );
  if (missing.length > 0) {
    throw AppError.badRequest(
      'Eksik alan gönderildi.',
      missing.map((field) => ({ field, message: `${field} alanı zorunludur.` })),
    );
  }
}

async function listTasks() {
  return taskRepository.findAll();
}

async function getTaskById(id) {
  const task = await taskRepository.findById(id);
  if (!task) throw AppError.notFound(`${id} id'li görev bulunamadı.`);
  return task;
}

async function createTask(input) {
  assertRequiredFields(input);
  const now = new Date().toISOString();
  return taskRepository.create({
    ...buildTaskFields(input),
    createdAt: now,
    updatedAt: now,
  });
}

async function updateTask(id, input) {
  assertRequiredFields(input);
  const updated = await taskRepository.update(id, {
    ...buildTaskFields(input),
    updatedAt: new Date().toISOString(),
  });
  if (!updated) throw AppError.notFound(`${id} id'li görev bulunamadı.`);
  return updated;
}

async function deleteTask(id) {
  const deleted = await taskRepository.remove(id);
  if (!deleted) throw AppError.notFound(`${id} id'li görev bulunamadı.`);
  return deleted;
}

module.exports = {
  listTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
