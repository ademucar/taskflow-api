// Görev endpoint'lerinin controller'ları. İş mantığı bir sonraki aşamada eklenecek.

function notImplemented(req, res) {
  res.status(501).json({ success: false, message: 'Bu endpoint henüz uygulanmadı.' });
}

module.exports = {
  getAllTasks: notImplemented,
  getTaskById: notImplemented,
  createTask: notImplemented,
  updateTask: notImplemented,
  deleteTask: notImplemented,
};
