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

// GET /tasks
async function getAllTasks(req, res) {
  const tasks = await taskService.listTasks();
  res.status(200).json({ success: true, count: tasks.length, data: tasks });
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
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
