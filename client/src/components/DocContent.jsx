import React from "react";
import { useParams } from "react-router-dom";

const CodeBlock = ({ children, language = "javascript" }) => (
  <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto my-4 border border-zb-cyan/10">
    <code className="text-white/90 font-mono text-sm">{children}</code>
  </pre>
);

const Section = ({ title, content, code, subsections }) => (
  <div className="mb-12">
    <h2 className="text-xl font-outfit text-white mb-4">{title}</h2>
    <p className="text-white/80 mb-4">{content}</p>
    {code && <CodeBlock>{code}</CodeBlock>}
    {subsections && (
      <div className="space-y-6 mt-6 pl-4 border-l-2 border-zb-cyan/20">
        {subsections.map((sub, index) => (
          <div key={index}>
            <h3 className="text-lg font-outfit text-white/90 mb-2">
              {sub.title}
            </h3>
            <p className="text-white/70 mb-2">{sub.content}</p>
            {sub.code && <CodeBlock>{sub.code}</CodeBlock>}
          </div>
        ))}
      </div>
    )}
  </div>
);

const docContent = {
  "getting-started": {
    title: "Getting Started",
    sections: [
      {
        title: "Installation",
        content: "Install the ZeroBase SDK using npm or yarn:",
        code: `npm install @zerobase/sdk

# or using yarn
yarn add @zerobase/sdk`,
      },
      {
        title: "Project Setup",
        content: "Initialize the SDK with your project credentials:",
        code: `import { ZeroBaseClient, DatabaseClient, AuthClient } from '@zerobase/sdk';

const client = new ZeroBaseClient({
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  url: 'https://api.example.com'  // Optional: defaults to production URL
});

// Initialize services
const db = new DatabaseClient(client);
const auth = new AuthClient(client);`,
      },
    ],
  },
  database: {
    title: "Database Management",
    sections: [
      {
        title: "Collections",
        content: "Manage database collections and their structure",
        subsections: [
          {
            title: "Create Collection",
            content: "Create a new collection in your database",
            code: `const db = new DatabaseClient(client);

// Create a new collection
await db.createTable('products');

// Create collection with initial columns
await db.createTable('users');
await db.addColumn('users', 'name', 'text');
await db.addColumn('users', 'age', 'integer');`,
          },
          {
            title: "List Collections",
            content: "Retrieve all collections in your database",
            code: `const tables = await db.getTables();
console.log(tables);
/* Output:
[
  { 
    table_name: 'users',
    columns: [
      { column_name: 'id', data_type: 'uuid' },
      { column_name: 'name', data_type: 'text' },
      { column_name: 'age', data_type: 'integer' }
    ]
  }
]
*/`,
          },
        ],
      },
      {
        title: "Documents",
        content: "Work with documents in your collections",
        subsections: [
          {
            title: "Create Document",
            content: "Add new documents to a collection",
            code: `// Add a single document
await db.createDocument('users', {
  name: 'John Doe',
  age: 25,
  email: 'john@example.com'
});`,
          },
          {
            title: "Query Documents",
            content: "Retrieve documents from a collection",
            code: `// Get all documents
const documents = await db.getDocuments('users');

// Get specific document
const user = await db.getDocument('users', 'user-id');`,
          },
        ],
      },
    ],
  },
  auth: {
    title: "Authentication",
    sections: [
      {
        title: "User Management",
        content: "Manage users and authentication in your application",
        subsections: [
          {
            title: "Create User",
            content: "Register a new user in your application",
            code: `const auth = new AuthClient(client);

// Create user with email/password
const user = await auth.createUser({
  email: 'user@example.com',
  password: 'securePassword123',
  name: 'John Doe'  // optional
});`,
          },
          {
            title: "User Authentication",
            content: "Authenticate users with various methods",
            code: `// Email/Password login
const session = await auth.loginUser(
  'user@example.com',
  'password123'
);

// Google OAuth login
const googleSession = await auth.googleLogin(googleCredential);

// Get current user
const currentUser = await auth.getCurrentUser(session.token);`,
          },
        ],
      },
    ],
  },
  storage: {
    title: "File Storage",
    sections: [
      {
        title: "File Operations",
        content: "Manage file uploads and storage",
        subsections: [
          {
            title: "Upload Files",
            content: "Upload files to your storage",
            code: `const storage = new StorageClient(client);

// Upload a file
const file = new File(['content'], 'example.txt');
const result = await storage.uploadFile(file);

console.log(result.url); // Access the file URL`,
          },
        ],
      },
    ],
  },
};

export default function DocContent() {
  const { section } = useParams();
  const content = docContent[section];

  if (!content) {
    return (
      <div className="text-white/60 text-center py-12">
        Documentation not found
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-outfit font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-8">
        {content.title}
      </h1>

      {content.sections.map((section, index) => (
        <Section key={index} {...section} />
      ))}
    </div>
  );
}
