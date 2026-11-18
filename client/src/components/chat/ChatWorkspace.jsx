import React, { useState, useRef, useEffect } from 'react';
import { useConversations, useMessages, useSendMessage, useDeleteConversation } from '../../hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { CitationModal } from './CitationModal';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Loader2, 
  Sparkles, 
  BookOpen, 
  HelpCircle,
  Lightbulb,
  AlertCircle
} from 'lucide-react';

export const ChatWorkspace = ({ notebookId, notebookTitle, documentCount }) => {
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const messagesEndRef = useRef(null);

  // Queries & Mutations
  const { data: conversations, isLoading: convsLoading } = useConversations(notebookId);
  const { data: messagesData, isLoading: msgsLoading } = useMessages(activeConversationId);
  const sendMessageMutation = useSendMessage(notebookId);
  const deleteConvMutation = useDeleteConversation(notebookId);

  // Set default active conversation if none selected
  useEffect(() => {
    if (!activeConversationId && conversations && conversations.length > 0) {
      setActiveConversationId(conversations[0]._id);
    }
  }, [conversations, activeConversationId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.messages, sendMessageMutation.isPending]);

  const handleSendMessage = async (text) => {
    try {
      const res = await sendMessageMutation.mutateAsync({
        message: text,
        conversationId: activeConversationId,
      });

      if (!activeConversationId && res.conversationId) {
        setActiveConversationId(res.conversationId);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to send message');
    }
  };

  const handleStartNewChat = () => {
    setActiveConversationId(null);
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation thread?')) {
      await deleteConvMutation.mutateAsync(convId);
      if (activeConversationId === convId) {
        setActiveConversationId(null);
      }
    }
  };

  const messages = activeConversationId ? messagesData?.messages || [] : [];

  const suggestedQuestions = [
    'Explain the most important concepts from these notes in beginner-friendly terms.',
    'What are the key differences between the core ideas discussed in this document?',
    'Summarize the main principles with a practical real-world analogy.',
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[580px] max-h-[750px]">
      {/* Left Sidebar: Conversations List */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Chat Threads</span>
          </span>
          <button
            onClick={handleStartNewChat}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium transition-colors border border-indigo-200/60"
            title="Start new conversation"
          >
            <Plus className="w-3 h-3" />
            <span>New</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-48 md:max-h-none">
          {convsLoading ? (
            <div className="p-4 text-center text-xs text-slate-400">Loading threads...</div>
          ) : conversations && conversations.length > 0 ? (
            conversations.map((conv) => {
              const isActive = activeConversationId === conv._id;
              return (
                <div
                  key={conv._id}
                  onClick={() => setActiveConversationId(conv._id)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <span className="truncate pr-2">{conv.title || 'Untitled Chat'}</span>
                  <button
                    onClick={(e) => handleDeleteConversation(conv._id, e)}
                    className={`p-1 rounded hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity ${
                      isActive ? 'text-white' : 'text-slate-400 hover:text-rose-600'
                    }`}
                    title="Delete thread"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              No conversations yet. Ask a question below to start your first thread!
            </div>
          )}
        </div>
      </div>

      {/* Right Area: Messages Stream & Input */}
      <div className="flex-1 flex flex-col bg-slate-50/20">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {msgsLoading && activeConversationId ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              <p className="text-xs text-slate-400 mt-2">Loading conversation...</p>
            </div>
          ) : messages.length > 0 ? (
            <>
              {messages.map((msg) => (
                <ChatMessage
                  key={msg._id}
                  message={msg}
                  onCitationClick={(cit) => setSelectedCitation(cit)}
                />
              ))}

              {sendMessageMutation.isPending && (
                <div className="py-4 flex items-center gap-3 text-slate-500">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl flex items-center gap-2 text-xs text-slate-600 shadow-sm">
                    <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                    <span>Searching document chunks &amp; synthesizing grounded answer with Llama 3.2...</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="py-12 sm:py-16 text-center max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm shadow-indigo-100">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Ask Questions Grounded in {notebookTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                {documentCount > 0
                  ? `Your question will search across ${documentCount} indexed document(s). Answers include exact page citations.`
                  : 'Upload documents in the "Documents" tab first to provide course context for RAG.'}
              </p>

              {documentCount > 0 && (
                <div className="mt-6 space-y-2 text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Suggested Questions</span>
                  </span>
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="w-full text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-xs text-slate-700 transition-colors shadow-2xs"
                    >
                      &ldquo;{q}&rdquo;
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <ChatInput
            onSend={handleSendMessage}
            disabled={sendMessageMutation.isPending}
            placeholder={
              documentCount === 0
                ? 'Upload documents in the Documents tab to enable RAG chat...'
                : 'Ask a question about your study documents...'
            }
          />
        </div>
      </div>

      {/* Citation Modal */}
      <CitationModal
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />
    </div>
  );
};

