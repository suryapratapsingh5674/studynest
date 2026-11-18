import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { fetchStudyNestAPI } from '../utils/apiClient.js';

export const TOOLS = [
  {
    name: 'list_notebooks',
    description: 'Lists all StudyNest study notebooks belonging to the authenticated user.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_documents',
    description: 'Lists all study documents (PDFs, notes) inside a specific authorized notebook.',
    inputSchema: {
      type: 'object',
      properties: {
        notebookId: {
          type: 'string',
          description: 'The MongoDB ObjectId of the notebook',
        },
      },
      required: ['notebookId'],
    },
  },
  {
    name: 'search_notebook',
    description: 'Performs semantic vector search across all documents in a notebook using StudyNest precision retrieval.',
    inputSchema: {
      type: 'object',
      properties: {
        notebookId: {
          type: 'string',
          description: 'The MongoDB ObjectId of the notebook to search',
        },
        query: {
          type: 'string',
          description: 'The search query or concept to look for',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of relevant chunks to retrieve (default 5)',
        },
      },
      required: ['notebookId', 'query'],
    },
  },
  {
    name: 'get_document_excerpt',
    description: 'Retrieves raw text excerpt from a specific document page with page metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: 'The MongoDB ObjectId of the document',
        },
        page: {
          type: 'number',
          description: 'The 1-based page number to inspect (default 1)',
        },
      },
      required: ['documentId'],
    },
  },
  {
    name: 'get_notebook_summary',
    description: 'Retrieves an existing synthesized executive summary and key takeaways for a document.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: 'The MongoDB ObjectId of the document',
        },
      },
      required: ['documentId'],
    },
  },
];

/**
 * Registers all MCP tool handlers onto the Server instance.
 * @param {Server} server
 */
export const registerTools = (server) => {
  // 1. Tool Listing
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // 2. Tool Execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result;

      switch (name) {
        case 'list_notebooks': {
          const data = await fetchStudyNestAPI('/notebooks');
          result = data?.notebooks || [];
          break;
        }

        case 'list_documents': {
          const data = await fetchStudyNestAPI(`/notebooks/${args.notebookId}/documents`);
          result = data?.documents || [];
          break;
        }

        case 'search_notebook': {
          const data = await fetchStudyNestAPI(`/notebooks/${args.notebookId}/search`, {
            method: 'POST',
            body: JSON.stringify({
              query: args.query,
              limit: args.limit || 5,
            }),
          });
          result = data?.results || [];
          break;
        }

        case 'get_document_excerpt': {
          const pageParam = args.page ? `?page=${args.page}` : '';
          const data = await fetchStudyNestAPI(`/documents/${args.documentId}/excerpt${pageParam}`);
          result = data;
          break;
        }

        case 'get_notebook_summary': {
          const data = await fetchStudyNestAPI(`/documents/${args.documentId}/summary`);
          result = data;
          break;
        }

        default:
          throw new Error(`Unknown MCP tool: "${name}"`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error executing tool "${name}": ${error.message}`,
          },
        ],
      };
    }
  });
};

