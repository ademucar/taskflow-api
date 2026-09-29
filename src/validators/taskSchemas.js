const { TASK_STATUSES, TASK_PRIORITIES, PAGINATION } = require('../constants/task');

// POST /tasks ve PUT /tasks/:id gövdesi
const taskBodySchema = {
  title: { type: 'string', required: true, minLength: 3, maxLength: 100 },
  description: { type: 'string', maxLength: 500 },
  status: { type: 'string', enum: TASK_STATUSES },
  priority: { type: 'string', enum: TASK_PRIORITIES },
  assignee: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[\p{L}\p{N}._-]+$/u,
    patternMessage: 'yalnızca harf, rakam ve . _ - karakterlerinden oluşabilir (boşluk içeremez).',
  },
};

// /tasks/:id
const taskIdParamSchema = {
  id: { type: 'integer', required: true, min: 1 },
};

// /tasks/assignee/:assignee
const assigneeParamSchema = {
  assignee: { type: 'string', required: true, minLength: 2, maxLength: 50 },
};

// GET /tasks, /tasks/assignee/:assignee sorgu parametreleri
const taskQuerySchema = {
  status: { type: 'string', enum: TASK_STATUSES },
  priority: { type: 'string', enum: TASK_PRIORITIES },
  keyword: { type: 'string', maxLength: 100 },
  sort: { type: 'string', maxLength: 100 },
  page: { type: 'integer', min: 1 },
  limit: { type: 'integer', min: 1, max: PAGINATION.MAX_LIMIT },
};

// GET /tasks/search — keyword zorunlu
const searchQuerySchema = {
  ...taskQuerySchema,
  keyword: { type: 'string', required: true, minLength: 2, maxLength: 100 },
};

module.exports = {
  taskBodySchema,
  taskIdParamSchema,
  assigneeParamSchema,
  taskQuerySchema,
  searchQuerySchema,
};
