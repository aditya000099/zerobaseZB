# ZeroBase SDK

Official JavaScript/TypeScript SDK for ZeroBase Backend as a Service.

## Installation

```bash
npm install @zerobase/sdk
```

## Quick Start

```typescript
import { ZeroBaseClient, DatabaseClient, AuthClient } from "zerobase";

const client = new ZeroBaseClient({
  projectId: "your-project-id",
  apiKey: "your-api-key",
});

// Initialize services
const db = new DatabaseClient(client);
const auth = new AuthClient(client);

// Use the SDK
await db.createTable("users");
await auth.createUser({
  email: "user@example.com",
  password: "password123",
});
```

## Features

- Database Management
- Authentication
- File Storage
- User Management
- TypeScript Support

## Documentation

Visit our [documentation](https://docs.zerobase.dev) for complete API reference.
