const taskService = require('../services/taskService');

// Girdiler route seviyesinde validate middleware'i ile doğrulandığı için
// controller'lar yalnızca service'i çağırıp yanıtı oluşturur.

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
  sendList(res, await taskService.queryTasks(req.query));
}

// GET /tasks/assignee/:assignee
async function getTasksByAssignee(req, res) {
  sendList(res, await taskService.queryTasks({ ...req.query, assignee: req.params.assignee }));
}

// GET /tasks/:id
async function getTaskById(req, res) {
  const task = await taskService.getTaskById(Number(req.params.id));
  res.status(200).json({ success: true, data: task });
}

// POST /tasks
async function createTask(req, res) {
  const task = await taskService.createTask(req.body);
  res.status(201).json({ success: true, message: 'Görev oluşturuldu.', data: task });
}

// PUT /tasks/:id
async function updateTask(req, res) {
  const task = await taskService.updateTask(Number(req.params.id), req.body);
  res.status(200).json({ success: true, message: 'Görev güncellendi.', data: task });
}

// PATCH /tasks/:id/status
async function updateTaskStatus(req, res) {
  const task = await taskService.updateTaskStatus(Number(req.params.id), req.body.status);
  res.status(200).json({ success: true, message: `Görev durumu "${task.status}" olarak güncellendi.`, data: task });
}

// PATCH /tasks/:id/assign
async function assignTask(req, res) {
  const task = await taskService.assignTask(Number(req.params.id), req.body.assignee);
  res.status(200).json({ success: true, message: `Görev "${task.assignee}" kullanıcısına atandı.`, data: task });
}

// DELETE /tasks/:id
async function deleteTask(req, res) {
  const task = await taskService.deleteTask(Number(req.params.id));
  res.status(200).json({ success: true, message: 'Görev silindi.', data: task });
}

module.exports = {
  getAllTasks,
  searchTasks,
  getTasksByAssignee,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  assignTask,
  deleteTask,
};
