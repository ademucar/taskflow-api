const { Router } = require('express');
const taskController = require('../controllers/taskController');

const router = Router();

// Sabit yollar, /:id'den önce tanımlanmalı; aksi halde "search" bir id sanılır.
router.get('/search', taskController.searchTasks);
router.get('/assignee/:assignee', taskController.getTasksByAssignee);

router
  .route('/')
  .get(taskController.getAllTasks)
  .post(taskController.createTask);

router
  .route('/:id')
  .get(taskController.getTaskById)
  .put(taskController.updateTask)
  .delete(taskController.deleteTask);

module.exports = router;
