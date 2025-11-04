import express from 'express';
import { createBusiness, getBusinessAnalytics, getTimeRangeAnalytics } from '../controller/businessController.js';

const router = express.Router();

router.post('/createBusiness', createBusiness);

// New analytics routes
router.post('/analytics', getBusinessAnalytics);
router.post('/analytics/timerange', getTimeRangeAnalytics);

export default router;


// Remeber to:

// Finish the business creation contoller
// Create a way to add products -> need to be associated to the business
