# Dynamic Form Builder - Backend

## Overview

The backend of the Dynamic Form Builder is a Node.js application using the Express framework. It serves the form schema and handles the storage and retrieval of form submissions.

## Technologies Used

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Utilities**: CORS, Zod, UUID

## Features

- **Schema API**: Provides the JSON schema definition for the frontend form.
- **Submission API**: Handles creation, retrieval, updating, and deletion of form submissions.
- **In-Memory Storage**: Uses a temporary in-memory data structure to store submissions during the runtime of the server.
- **Server-Side Validation**: Validates incoming submission data against the defined schema.

## API Endpoints

### GET /form-schema
Returns the JSON schema used to generate the frontend form.

### POST /submissions
Creates a new submission.
- **Body**: JSON object containing form field values.
- **Response**: The created submission object.

### GET /submissions
Retrieves a paginated list of submissions.
- **Query Parameters**:
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)
    - `sortBy`: Field to sort by (default: 'createdAt')
    - `sortOrder`: 'asc' or 'desc' (default: 'desc')
    - `search`: Search term to filter submissions.

### GET /submissions/:id
Retrieves a single submission by ID.

### PUT /submissions/:id
Updates an existing submission.
- **Body**: JSON object containing updated form field values.

### DELETE /submissions/:id
Deletes a submission by ID.

## Installation and Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

The server will start on `http://localhost:5000`.

## Scripts

- `npm run dev`: Starts the server in development mode with hot-reloading (using nodemon).
- `npm start`: Starts the server using ts-node.
- `npm run lint`: Runs ESLint to check for code quality issues.
