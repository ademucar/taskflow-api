const taskService = require('../services/taskService');
const AppError = require('../utils/AppError');

// URL'deki :id parametresini pozitif tam sayıya çevirir.
function parseId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    throw AppError.badRequest(`Geçersiz görev id'si: "${req.params.id}". Pozitif bir tam sayı olmalıdır.`);
  }
  return id;
}

// Listeleme yanıtı; sayfalama istendiyse pagination bilgisi eklenir.
function sendList(res, { items, pagination }) {
  const body = { success: true, count: items.length };
  if (pagination) body.pagination = pagination;
  body.data = items;
  res.status(200).json(body);
}

// GET /tasks?status=&priority=&sort=&page=&limit=
async function getAllTasks(req, res) {
  sendList(res, await taskService.queryTasks(req.query));
}

// GET /tasks/search?keyword=
async function searchTasks(req, res) {
  if (!req.query.keyword || !String(req.query.keyword).trim()) {
    throw AppError.badRequest('Arama için keyword parametresi gereklidir. Örnek: /tasks/search?keyword=backend');
  }
  sendList(res, await taskService.queryTasks(req.query));
}

// GET /tasks/assignee/:assignee
async function getTasksByAssignee(req, res) {
  sendList(res, await taskService.queryTasks({ ...req.query, assignee: req.params.assignee }));
}

// GET /tasks/:id
async function getTaskById(req, res) {
  const task = await taskService.getTaskById(parseId(req));
  res.status(200).json({ success: true, data: task });
}

// POST /tasks
async function createTask(req, res) {
  const task = await taskService.createTask(req.body ?? {});
  res.status(201).json({ success: true, message: 'Görev oluşturuldu.', data: task });
}

// PUT /tasks/:id
async function updateTask(req, res) {
  const task = await taskService.updateTask(parseId(req), req.body ?? {});
  res.status(200).json({ success: true, message: 'Görev güncellendi.', data: task });
}

// DELETE /tasks/:id
async function deleteTask(req, res) {
  const task = await taskService.deleteTask(parseId(req));
  res.status(200).json({ success: true, message: 'Görev silindi.', data: task });
}

module.exports = {
  getAllTasks,
  searchTasks,
  getTasksByAssignee,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
