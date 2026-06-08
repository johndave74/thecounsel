// OpenAPI 3.1 description of the Counsel API. Served as JSON at
// /api/openapi.json and rendered by Swagger UI at /api/docs.
import {
  ROLES, CASE_STATUSES, PRIORITIES, HEARING_TYPES, HEARING_STATUSES,
} from './schemas.js'

const ref = (name) => ({ $ref: `#/components/schemas/${name}` })
const dataOf = (name) => ({
  type: 'object',
  properties: { data: ref(name) },
})
const listOf = (name) => ({
  type: 'object',
  properties: { data: { type: 'array', items: ref(name) } },
})

const ok = (schema, description = 'Success') => ({
  description,
  content: { 'application/json': { schema } },
})

// Common error response
const errorResponses = {
  400: { description: 'Validation error' },
  401: { description: 'Authentication required' },
  403: { description: 'Forbidden' },
  404: { description: 'Not found' },
}

const idParam = {
  name: 'id', in: 'path', required: true, schema: { type: 'string' },
}

export const openapiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'The Counsel API',
    version: '1.0.0',
    description: 'Backend for the Counsel law-firm case-management system.',
  },
  servers: [{ url: '/api' }],
  tags: [
    { name: 'Auth' }, { name: 'Users' }, { name: 'Clients' }, { name: 'Cases' },
    { name: 'Hearings' }, { name: 'Documents' }, { name: 'Tasks' },
    { name: 'Notifications' }, { name: 'Dashboard' },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' }, name: { type: 'string' }, initials: { type: 'string' },
          role: { type: 'string', enum: ROLES }, title: { type: 'string' },
          specialty: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' },
          cases: { type: 'integer' }, winRate: { type: ['integer', 'null'] },
          tone: { type: 'integer' }, barNo: { type: 'string' },
        },
      },
      Client: {
        type: 'object',
        properties: {
          id: { type: 'string' }, name: { type: 'string' },
          type: { type: 'string', enum: ['Individual', 'Corporate'] },
          company: { type: ['string', 'null'] }, email: { type: 'string' },
          phone: { type: 'string' }, since: { type: 'string' }, cases: { type: 'integer' },
          tone: { type: 'integer' }, address: { type: 'string' },
        },
      },
      Case: {
        type: 'object',
        properties: {
          id: { type: 'string' }, number: { type: 'string' }, title: { type: 'string' },
          clientId: { type: 'string' }, lawyerIds: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: CASE_STATUSES }, practice: { type: 'string' },
          priority: { type: 'string', enum: PRIORITIES }, opened: { type: 'string' },
          court: { type: 'string' }, judge: { type: 'string' }, progress: { type: 'integer' },
          value: { type: 'string' }, nextHearing: { type: ['string', 'null'] }, desc: { type: 'string' },
        },
      },
      Hearing: {
        type: 'object',
        properties: {
          id: { type: 'string' }, caseId: { type: 'string' }, title: { type: 'string' },
          date: { type: 'string' }, time: { type: 'string' }, court: { type: 'string' },
          judge: { type: 'string' }, type: { type: 'string', enum: HEARING_TYPES },
          status: { type: 'string', enum: HEARING_STATUSES },
        },
      },
      Document: {
        type: 'object',
        properties: {
          id: { type: 'string' }, name: { type: 'string' }, ext: { type: 'string' },
          caseId: { type: 'string' }, category: { type: 'string' }, size: { type: 'string' },
          uploadedBy: { type: 'string' }, date: { type: 'string' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string' }, title: { type: 'string' }, caseId: { type: ['string', 'null'] },
          assigneeId: { type: ['string', 'null'] }, due: { type: ['string', 'null'] },
          priority: { type: 'string', enum: PRIORITIES }, done: { type: 'boolean' },
        },
      },
      Note: {
        type: 'object',
        properties: {
          id: { type: 'string' }, author: { type: 'string' }, initials: { type: 'string' },
          tone: { type: 'integer' }, date: { type: 'string' }, text: { type: 'string' },
        },
      },
      TimelineEvent: {
        type: 'object',
        properties: { date: { type: 'string' }, title: { type: 'string' }, desc: { type: 'string' } },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string' }, kind: { type: 'string', enum: ['warn', 'cal', 'info', 'ok'] },
          title: { type: 'string' }, body: { type: 'string' }, time: { type: 'string' },
          unread: { type: 'boolean' },
        },
      },
      AuthResult: {
        type: 'object',
        properties: {
          user: ref('User'), accessToken: { type: 'string' }, refreshToken: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: { tags: ['Auth'], security: [], summary: 'Health check', responses: { 200: { description: 'OK' } } },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'], security: [], summary: 'Register (Lawyer/Staff only)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object', required: ['name', 'email', 'password'],
            properties: {
              name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string', minLength: 8 },
              role: { type: 'string', enum: ['Lawyer', 'Staff'] },
            },
          } } },
        },
        responses: { 201: ok(ref('AuthResult'), 'Created'), ...errorResponses },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'], security: [], summary: 'Log in',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object', required: ['email', 'password'],
            properties: { email: { type: 'string' }, password: { type: 'string' } },
          } } },
        },
        responses: { 200: ok(ref('AuthResult')), ...errorResponses },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'], security: [], summary: 'Rotate tokens',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } } } },
        responses: { 200: ok(ref('AuthResult')), ...errorResponses },
      },
    },
    '/auth/logout': {
      post: { tags: ['Auth'], security: [], summary: 'Revoke a refresh token', responses: { 200: { description: 'OK' } } },
    },
    '/auth/me': {
      get: { tags: ['Auth'], summary: 'Current user', responses: { 200: ok(dataOf('User')), ...errorResponses } },
    },
    '/auth/change-password': {
      post: { tags: ['Auth'], summary: 'Change password', responses: { 200: { description: 'OK' }, ...errorResponses } },
    },
    '/auth/forgot-password': {
      post: { tags: ['Auth'], security: [], summary: 'Request a reset token', responses: { 200: { description: 'Always OK (no enumeration)' } } },
    },
    '/auth/reset-password': {
      post: { tags: ['Auth'], security: [], summary: 'Reset password with a token', responses: { 200: { description: 'OK' }, ...errorResponses } },
    },

    '/users': {
      get: { tags: ['Users'], summary: 'List users', parameters: [{ name: 'role', in: 'query', schema: { type: 'string', enum: ROLES } }], responses: { 200: ok(listOf('User')), ...errorResponses } },
      post: { tags: ['Users'], summary: 'Create user (Admin)', responses: { 201: ok(dataOf('User')), ...errorResponses } },
    },
    '/users/{id}': {
      get: { tags: ['Users'], parameters: [idParam], summary: 'Get user', responses: { 200: ok(dataOf('User')), ...errorResponses } },
      patch: { tags: ['Users'], parameters: [idParam], summary: 'Update user (Admin)', responses: { 200: ok(dataOf('User')), ...errorResponses } },
      delete: { tags: ['Users'], parameters: [idParam], summary: 'Deactivate user (Admin)', responses: { 200: { description: 'OK' }, ...errorResponses } },
    },

    '/clients': {
      get: { tags: ['Clients'], summary: 'List clients', parameters: [{ name: 'search', in: 'query', schema: { type: 'string' } }, { name: 'type', in: 'query', schema: { type: 'string' } }], responses: { 200: ok(listOf('Client')), ...errorResponses } },
      post: { tags: ['Clients'], summary: 'Create client', responses: { 201: ok(dataOf('Client')), ...errorResponses } },
    },
    '/clients/{id}': {
      get: { tags: ['Clients'], parameters: [idParam], responses: { 200: ok(dataOf('Client')), ...errorResponses } },
      patch: { tags: ['Clients'], parameters: [idParam], responses: { 200: ok(dataOf('Client')), ...errorResponses } },
      delete: { tags: ['Clients'], parameters: [idParam], summary: 'Delete client (Admin)', responses: { 200: { description: 'OK' }, ...errorResponses } },
    },

    '/cases': {
      get: { tags: ['Cases'], summary: 'List cases', parameters: [{ name: 'search', in: 'query', schema: { type: 'string' } }, { name: 'status', in: 'query', schema: { type: 'string', enum: CASE_STATUSES } }, { name: 'practice', in: 'query', schema: { type: 'string' } }], responses: { 200: ok(listOf('Case')), ...errorResponses } },
      post: { tags: ['Cases'], summary: 'Create case', responses: { 201: ok(dataOf('Case')), ...errorResponses } },
    },
    '/cases/{id}': {
      get: { tags: ['Cases'], parameters: [idParam], responses: { 200: ok(dataOf('Case')), ...errorResponses } },
      patch: { tags: ['Cases'], parameters: [idParam], responses: { 200: ok(dataOf('Case')), ...errorResponses } },
      delete: { tags: ['Cases'], parameters: [idParam], summary: 'Delete case (Admin)', responses: { 200: { description: 'OK' }, ...errorResponses } },
    },
    '/cases/{id}/lawyers': {
      post: { tags: ['Cases'], parameters: [idParam], summary: 'Assign a lawyer', responses: { 200: ok(dataOf('Case')), ...errorResponses } },
    },
    '/cases/{id}/lawyers/{lawyerId}': {
      delete: { tags: ['Cases'], parameters: [idParam, { name: 'lawyerId', in: 'path', required: true, schema: { type: 'string' } }], summary: 'Unassign a lawyer', responses: { 200: ok(dataOf('Case')), ...errorResponses } },
    },
    '/cases/{id}/hearings': { get: { tags: ['Cases'], parameters: [idParam], responses: { 200: ok(listOf('Hearing')), ...errorResponses } } },
    '/cases/{id}/documents': { get: { tags: ['Cases'], parameters: [idParam], responses: { 200: ok(listOf('Document')), ...errorResponses } } },
    '/cases/{id}/tasks': { get: { tags: ['Cases'], parameters: [idParam], responses: { 200: ok(listOf('Task')), ...errorResponses } } },
    '/cases/{id}/timeline': { get: { tags: ['Cases'], parameters: [idParam], responses: { 200: ok(listOf('TimelineEvent')), ...errorResponses } } },
    '/cases/{id}/notes': {
      get: { tags: ['Cases'], parameters: [idParam], responses: { 200: ok(listOf('Note')), ...errorResponses } },
      post: { tags: ['Cases'], parameters: [idParam], summary: 'Add a note', responses: { 201: ok(dataOf('Note')), ...errorResponses } },
    },

    '/hearings': {
      get: { tags: ['Hearings'], summary: 'List hearings', parameters: [{ name: 'caseId', in: 'query', schema: { type: 'string' } }, { name: 'type', in: 'query', schema: { type: 'string', enum: HEARING_TYPES } }, { name: 'from', in: 'query', schema: { type: 'string' } }, { name: 'to', in: 'query', schema: { type: 'string' } }], responses: { 200: ok(listOf('Hearing')), ...errorResponses } },
      post: { tags: ['Hearings'], summary: 'Create hearing', responses: { 201: ok(dataOf('Hearing')), ...errorResponses } },
    },
    '/hearings/{id}': {
      get: { tags: ['Hearings'], parameters: [idParam], responses: { 200: ok(dataOf('Hearing')), ...errorResponses } },
      patch: { tags: ['Hearings'], parameters: [idParam], responses: { 200: ok(dataOf('Hearing')), ...errorResponses } },
      delete: { tags: ['Hearings'], parameters: [idParam], responses: { 200: { description: 'OK' }, ...errorResponses } },
    },

    '/documents': {
      get: { tags: ['Documents'], summary: 'List documents', parameters: [{ name: 'caseId', in: 'query', schema: { type: 'string' } }, { name: 'search', in: 'query', schema: { type: 'string' } }, { name: 'category', in: 'query', schema: { type: 'string' } }], responses: { 200: ok(listOf('Document')), ...errorResponses } },
      post: {
        tags: ['Documents'], summary: 'Upload a document (multipart)',
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', required: ['file', 'caseId'], properties: { file: { type: 'string', format: 'binary' }, caseId: { type: 'string' }, category: { type: 'string' } } } } } },
        responses: { 201: ok(dataOf('Document')), ...errorResponses },
      },
    },
    '/documents/{id}': {
      get: { tags: ['Documents'], parameters: [idParam], responses: { 200: ok(dataOf('Document')), ...errorResponses } },
      delete: { tags: ['Documents'], parameters: [idParam], summary: 'Delete (Admin or uploader)', responses: { 200: { description: 'OK' }, ...errorResponses } },
    },
    '/documents/{id}/download': {
      get: { tags: ['Documents'], parameters: [idParam], summary: 'Download the stored file', responses: { 200: { description: 'File stream' }, 404: { description: 'No file' } } },
    },

    '/tasks': {
      get: { tags: ['Tasks'], summary: 'List tasks', parameters: [{ name: 'caseId', in: 'query', schema: { type: 'string' } }, { name: 'assigneeId', in: 'query', schema: { type: 'string' } }, { name: 'done', in: 'query', schema: { type: 'boolean' } }, { name: 'overdue', in: 'query', schema: { type: 'boolean' } }], responses: { 200: ok(listOf('Task')), ...errorResponses } },
      post: { tags: ['Tasks'], summary: 'Create task', responses: { 201: ok(dataOf('Task')), ...errorResponses } },
    },
    '/tasks/{id}': {
      get: { tags: ['Tasks'], parameters: [idParam], responses: { 200: ok(dataOf('Task')), ...errorResponses } },
      patch: { tags: ['Tasks'], parameters: [idParam], responses: { 200: ok(dataOf('Task')), ...errorResponses } },
      delete: { tags: ['Tasks'], parameters: [idParam], responses: { 200: { description: 'OK' }, ...errorResponses } },
    },
    '/tasks/{id}/toggle': {
      post: { tags: ['Tasks'], parameters: [idParam], summary: 'Toggle done', responses: { 200: ok(dataOf('Task')), ...errorResponses } },
    },

    '/notifications': {
      get: { tags: ['Notifications'], summary: 'List notifications', parameters: [{ name: 'unread', in: 'query', schema: { type: 'boolean' } }], responses: { 200: ok({ type: 'object', properties: { data: { type: 'array', items: ref('Notification') }, unreadCount: { type: 'integer' } } }), ...errorResponses } },
    },
    '/notifications/{id}/read': {
      post: { tags: ['Notifications'], parameters: [idParam], responses: { 200: ok(dataOf('Notification')), ...errorResponses } },
    },
    '/notifications/read-all': {
      post: { tags: ['Notifications'], summary: 'Mark all read', responses: { 200: { description: 'OK' }, ...errorResponses } },
    },

    '/dashboard/stats': {
      get: { tags: ['Dashboard'], summary: 'Dashboard analytics', responses: { 200: { description: 'Aggregate stats' }, ...errorResponses } },
    },
  },
}

// Minimal Swagger UI page (assets loaded from CDN — no runtime dependency added).
export const swaggerHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>The Counsel API — Reference</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: '/api/openapi.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis],
    })
  </script>
</body>
</html>`
