const { Router } = require('express');
const taskRoutes = require('./taskRoutes');
const reportRoutes = require('./reportRoutes');
const { version } = require('../../package.json');

const router = Router();

// API hakkında kısa bilgi ve mevcut endpoint'ler
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'TaskFlow API',
      description: 'Görev ve Proje Yönetim Sistemi REST API',
      version,
      endpoints: {
        tasks: {
          list: 'GET /tasks',
          detail: 'GET /tasks/:id',
          create: 'POST /tasks',
          update: 'PUT /tasks/:id',
          delete: 'DELETE /tasks/:id',
          search: 'GET /tasks/search?keyword=',
          byAssignee: 'GET /tasks/assignee/:assignee',
          queryParams: 'status, priority, sort, page, limit',
        },
        reports: {
          completed: 'GET /reports/completed',
          pending: 'GET /reports/pending',
          summary: 'GET /reports/summary',
        },
      },
    },
  });
});

router.use('/tasks', taskRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
