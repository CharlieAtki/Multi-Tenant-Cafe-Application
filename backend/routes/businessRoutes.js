import express from 'express';
import { createBusiness, getBusinessAnalytics, getTimeRangeAnalytics, fetchCurrentBusinessInfo, joinBusiness, acceptOnboardingRequest, rejectOnboardingRequest, removeEmployeeFromBusiness } from '../controller/businessController.js';

const router = express.Router();

router.post('/createBusiness', createBusiness);

// New analytics routes
router.post('/analytics', getBusinessAnalytics);
router.post('/analytics/timerange', getTimeRangeAnalytics);

router.post('/fetchCurrentBusinessInfo', fetchCurrentBusinessInfo);

// Routes for managing business joining and onboarding
router.post('/joinBusiness', joinBusiness);
router.post('/removeEmployeeFromBusiness', removeEmployeeFromBusiness);
router.post('/acceptOnboardingRequest', acceptOnboardingRequest);
router.post('/rejectOnboardingRequest', rejectOnboardingRequest);

export default router;


// Remeber to:

// Finish the business creation contoller
// Create a way to add products -> need to be associated to the business
