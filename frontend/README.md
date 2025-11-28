# Dynamic Form Builder - Frontend

## Overview

The frontend of the Dynamic Form Builder is built with Next.js and TypeScript. It provides the user interface for rendering dynamic forms, validating user input, and managing submissions.

## Technologies Used

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI
- **State Management & Data Fetching**: TanStack Query (React Query)
- **Form Handling**: TanStack Form
- **Validation**: Zod
- **Table Management**: TanStack Table
- **Icons**: Lucide React

## Features

- **Dynamic Form Rendering**: Automatically generates form fields (Text, Number, Select, Multi-Select, Date, Textarea, Switch) based on the schema provided by the backend.
- **Real-time Validation**: Validates inputs against rules defined in the schema using Zod.
- **Submissions Dashboard**: Displays submitted data in a table with server-side pagination and sorting.
- **Search**: Debounced search functionality to filter submissions.
- **Edit & Delete**: Functionality to update or remove existing submissions.
- **CSV Export**: Allows users to download submission data as a CSV file.

## Installation and Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:3000`.

## Key Components

- `app/components/DynamicForm.tsx`: The core component responsible for rendering form fields and handling submissions.
- `app/components/SubmissionsTable.tsx`: Displays the list of submissions with sorting, pagination, search, and action buttons.
- `app/submission/[id]/page.tsx`: The page for editing an existing submission.
- `hooks/use-toast.ts`: Custom hook for displaying toast notifications.

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code quality issues.
