const reportService = require('../services/reportService');

// GET /reports/completed
async function getCompletedReport(req, res) {
  res.status(200).json({ success: true, data: await reportService.getCompletedReport() });
}

// GET /reports/pending
async function getPendingReport(req, res) {
  res.status(200).json({ success: true, data: await reportService.getPendingReport() });
}

// GET /reports/summary
async function getSummaryReport(req, res) {
  res.status(200).json({ success: true, data: await reportService.getSummaryReport() });
}

module.exports = {
  getCompletedReport,
  getPendingReport,
  getSummaryReport,
};
