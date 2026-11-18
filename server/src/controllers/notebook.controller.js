import mongoose from 'mongoose';
import Notebook from '../models/Notebook.js';
import Document from '../models/Document.js';

/**
 * Create a new notebook for the authenticated user.
 * POST /api/notebooks
 */
export const createNotebook = async (req, res) => {
  try {
    const { title, description } = req.body;

    const notebook = await Notebook.create({
      userId: req.user._id,
      title: title.trim(),
      description: description ? description.trim() : '',
    });

    return res.status(201).json({
      success: true,
      message: 'Notebook created successfully',
      data: {
        notebook: {
          id: notebook._id,
          title: notebook.title,
          description: notebook.description,
          documentCount: 0,
          createdAt: notebook.createdAt,
          updatedAt: notebook.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('[Create Notebook Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create notebook.',
    });
  }
};

/**
 * Get all notebooks belonging to the authenticated user.
 * GET /api/notebooks
 */
export const getNotebooks = async (req, res) => {
  try {
    // Find all notebooks for this user, sorted newest first
    const notebooks = await Notebook.find({ userId: req.user._id }).sort({ updatedAt: -1 });

    // Aggregate document counts for each notebook belonging to the user
    const docCounts = await Document.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$notebookId', count: { $sum: 1 } } },
    ]);

    // Build a map of notebookId -> count
    const countMap = {};
    docCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    // Format notebook objects with documentCount
    const formattedNotebooks = notebooks.map((nb) => ({
      id: nb._id,
      title: nb.title,
      description: nb.description,
      documentCount: countMap[nb._id.toString()] || 0,
      createdAt: nb.createdAt,
      updatedAt: nb.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        notebooks: formattedNotebooks,
      },
    });
  } catch (error) {
    console.error('[Get Notebooks Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load notebooks.',
    });
  }
};

/**
 * Get a single notebook by ID (ensuring user ownership).
 * GET /api/notebooks/:id
 */
export const getNotebookById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notebook identifier.',
      });
    }

    const notebook = await Notebook.findOne({ _id: id, userId: req.user._id });
    if (!notebook) {
      return res.status(404).json({
        success: false,
        message: 'Notebook not found or you do not have permission to access it.',
      });
    }

    // Load documents associated with this notebook
    const documents = await Document.find({ notebookId: notebook._id, userId: req.user._id })
      .select('originalFilename fileSize mimeType status pageCount chunkCount createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        notebook: {
          id: notebook._id,
          title: notebook.title,
          description: notebook.description,
          documentCount: documents.length,
          documents,
          createdAt: notebook.createdAt,
          updatedAt: notebook.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('[Get Notebook By ID Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notebook.',
    });
  }
};

/**
 * Update notebook title or description.
 * PATCH /api/notebooks/:id
 */
export const updateNotebook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notebook identifier.',
      });
    }

    const notebook = await Notebook.findOne({ _id: id, userId: req.user._id });
    if (!notebook) {
      return res.status(404).json({
        success: false,
        message: 'Notebook not found or you do not have permission to edit it.',
      });
    }

    if (title !== undefined) notebook.title = title.trim();
    if (description !== undefined) notebook.description = description.trim();

    await notebook.save();

    return res.status(200).json({
      success: true,
      message: 'Notebook updated successfully',
      data: {
        notebook: {
          id: notebook._id,
          title: notebook.title,
          description: notebook.description,
          updatedAt: notebook.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('[Update Notebook Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notebook.',
    });
  }
};

/**
 * Delete a notebook and its associated documents.
 * DELETE /api/notebooks/:id
 */
export const deleteNotebook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notebook identifier.',
      });
    }

    const notebook = await Notebook.findOne({ _id: id, userId: req.user._id });
    if (!notebook) {
      return res.status(404).json({
        success: false,
        message: 'Notebook not found or you do not have permission to delete it.',
      });
    }

    // Remove associated documents from MongoDB
    await Document.deleteMany({ notebookId: notebook._id, userId: req.user._id });

    // Remove notebook
    await notebook.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Notebook and associated metadata removed successfully.',
    });
  } catch (error) {
    console.error('[Delete Notebook Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notebook.',
    });
  }
};

