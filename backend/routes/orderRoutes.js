import express from 'express';
import { completeUserOrder, getUserOrders } from '../controller/orderController.js';

const router = express.Router();

// Complete checkout and create order(s)
router.post('/completeOrder', completeUserOrder);

// Get user's order history
router.get('/getUserOrders', getUserOrders);

export default router
