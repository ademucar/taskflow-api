const { Router } = require('express');
const taskRoutes = require('./taskRoutes');
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
        tasks: '/tasks',
      },
    },
  });
});

router.use('/tasks', taskRoutes);

module.exports = router;
