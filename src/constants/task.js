const TASK_STATUSES = ['pending', 'in-progress', 'completed'];
const TASK_PRIORITIES = ['low', 'medium', 'high'];

const DEFAULT_STATUS = 'pending';
const DEFAULT_PRIORITY = 'medium';

// Sıralamada alfabetik değil, mantıksal sıra kullanılır (low < medium < high)
const PRIORITY_RANK = { low: 1, medium: 2, high: 3 };
const STATUS_RANK = { pending: 1, 'in-progress': 2, completed: 3 };

const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'title', 'priority', 'status'];

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

module.exports = {
  TASK_STATUSES,
  TASK_PRIORITIES,
  DEFAULT_STATUS,
  DEFAULT_PRIORITY,
  PRIORITY_RANK,
  STATUS_RANK,
  SORTABLE_FIELDS,
  PAGINATION,
};
