import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
    getUserActivityHistory,
    getAllActivityHistory,
    getActivityStats
} from '../controllers/loggerController/loggerController.controller.js';

const router = express.Router();

// Protected routes - require authentication
router.get('/activity/user/:userId', getUserActivityHistory);
router.get('/activity/all', getAllActivityHistory);
router.get('/activity/stats', getActivityStats);

export default router;