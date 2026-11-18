import { Router } from 'express';
import { body } from 'express-validator';
import {
  createNotebook,
  getNotebooks,
  getNotebookById,
  updateNotebook,
  deleteNotebook,
} from '../controllers/notebook.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validate.js';

const router = Router();

// All notebook endpoints require user authentication
router.use(requireAuth);

const notebookValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Notebook title is required')
    .isLength({ max: 100 }).withMessage('Notebook title cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  handleValidationErrors,
];

router.get('/', getNotebooks);
router.post('/', notebookValidation, createNotebook);
router.get('/:id', getNotebookById);
router.patch('/:id', notebookValidation, updateNotebook);
router.delete('/:id', deleteNotebook);

export default router;

