import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Notebook from '../models/Notebook.js';
import { executeRAGChat } from '../services/rag/chat.service.js';

/**
 * Send a question to RAG Chat in a notebook.
 * POST /api/notebooks/:id/chat
 */
export const sendChatMessage = async (req, res) => {
  try {
    const { id: notebookId } = req.params;
    const { message, conversationId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A non-empty question message is required.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(notebookId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notebook identifier.',
      });
    }

    const result = await executeRAGChat({
      notebookId,
      userId: req.user._id,
      question: message.trim(),
      conversationId,
    });

    return res.status(200).json({
      success: true,
      data: {
        conversationId: result.conversationId,
        userMessage: result.userMessage,
        assistantMessage: result.assistantMessage,
        citations: result.citations,
      },
    });
  } catch (error) {
    console.error('[Chat Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process chat message.',
    });
  }
};

/**
 * Get all conversations for a specific notebook.
 * GET /api/notebooks/:id/conversations
 */
export const getNotebookConversations = async (req, res) => {
  try {
    const { id: notebookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notebookId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notebook identifier.',
      });
    }

    const notebook = await Notebook.findOne({ _id: notebookId, userId: req.user._id });
    if (!notebook) {
      return res.status(404).json({
        success: false,
        message: 'Notebook not found.',
      });
    }

    const conversations = await Conversation.find({
      notebookId: notebook._id,
      userId: req.user._id,
    }).sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      data: { conversations },
    });
  } catch (error) {
    console.error('[Get Notebook Conversations Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversations.',
    });
  }
};

/**
 * Get all messages for a specific conversation.
 * GET /api/conversations/:id/messages
 */
export const getConversationMessages = async (req, res) => {
  try {
    const { id: conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation identifier.',
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or you do not have permission to view it.',
      });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
      userId: req.user._id,
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: {
        conversation,
        messages,
      },
    });
  } catch (error) {
    console.error('[Get Conversation Messages Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load conversation messages.',
    });
  }
};

/**
 * Delete a conversation and its messages.
 * DELETE /api/conversations/:id
 */
export const deleteConversation = async (req, res) => {
  try {
    const { id: conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation identifier.',
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversationId: conversation._id });

    // Delete the conversation
    await conversation.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Conversation and messages deleted successfully.',
    });
  } catch (error) {
    console.error('[Delete Conversation Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete conversation.',
    });
  }
};

