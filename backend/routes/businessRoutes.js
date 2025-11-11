import express from 'express';
import { createBusiness, getBusinessAnalytics, getTimeRangeAnalytics, fetchCurrentBusinessInfo, joinBusiness, acceptOnboardingRequest } from '../controller/businessController.js';

const router = express.Router();

router.post('/createBusiness', createBusiness);

// New analytics routes
router.post('/analytics', getBusinessAnalytics);
router.post('/analytics/timerange', getTimeRangeAnalytics);

router.post('/fetchCurrentBusinessInfo', fetchCurrentBusinessInfo);

router.post('/joinBusiness', joinBusiness);
router.post('/acceptOnboardingRequest', acceptOnboardingRequest);

export default router;


// Remeber to:

// Finish the business creation contoller
// Create a way to add products -> need to be associated to the business
