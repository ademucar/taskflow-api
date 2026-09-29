const { Router } = require('express');
const taskController = require('../controllers/taskController');
const validate = require('../middlewares/validate');
const {
  taskBodySchema,
  taskIdParamSchema,
  assigneeParamSchema,
  taskQuerySchema,
  searchQuerySchema,
} = require('../validators/taskSchemas');

const router = Router();

// Sabit yollar, /:id'den önce tanımlanmalı; aksi halde "search" bir id sanılır.
router.get('/search', validate(searchQuerySchema, 'query'), taskController.searchTasks);

router.get(
  '/assignee/:assignee',
  validate(assigneeParamSchema, 'params'),
  validate(taskQuerySchema, 'query'),
  taskController.getTasksByAssignee,
);

router
  .route('/')
  .get(validate(taskQuerySchema, 'query'), taskController.getAllTasks)
  .post(validate(taskBodySchema), taskController.createTask);

router
  .route('/:id')
  .all(validate(taskIdParamSchema, 'params'))
  .get(taskController.getTaskById)
  .put(validate(taskBodySchema), taskController.updateTask)
  .delete(taskController.deleteTask);

module.exports = router;
