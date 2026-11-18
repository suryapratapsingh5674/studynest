import { ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { fetchStudyNestAPI } from '../utils/apiClient.js';

export const registerResources = (server) => {
  // 1. List Available Resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    try {
      const data = await fetchStudyNestAPI('/notebooks');
      const notebooks = data?.notebooks || [];

      const resources = [
        {
          uri: 'studynest://notebooks',
          name: 'All StudyNest Notebooks',
          description: 'Catalog of all notebooks belonging to the authenticated student',
          mimeType: 'application/json',
        },
      ];

      for (const nb of notebooks) {
        resources.push({
          uri: `studynest://notebooks/${nb.id}`,
          name: `Notebook: ${nb.title}`,
          description: nb.description || 'Study notebook',
          mimeType: 'application/json',
        });
      }

      return { resources };
    } catch (error) {
      return { resources: [] };
    }
  });

  // 2. Read Specific Resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    if (uri === 'studynest://notebooks') {
      const data = await fetchStudyNestAPI('/notebooks');
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data?.notebooks || [], null, 2),
          },
        ],
      };
    }

    if (uri.startsWith('studynest://notebooks/')) {
      const notebookId = uri.replace('studynest://notebooks/', '');
      const docsData = await fetchStudyNestAPI(`/notebooks/${notebookId}/documents`);
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(docsData?.documents || [], null, 2),
          },
        ],
      };
    }

    throw new Error(`Resource not found: ${uri}`);
  });
};

