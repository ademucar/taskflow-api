const { Router } = require('express');
const reportController = require('../controllers/reportController');

const router = Router();

router.get('/completed', reportController.getCompletedReport);
router.get('/pending', reportController.getPendingReport);
router.get('/summary', reportController.getSummaryReport);

module.exports = router;
