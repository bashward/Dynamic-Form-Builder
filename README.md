# Dynamic Form Builder

## Overview

Dynamic Form Builder is a full-stack web application designed to generate forms dynamically based on a JSON schema. It allows users to submit data, view submissions in a paginated and sortable table, and manage entries through editing and deletion. The application consists of a Next.js frontend and a Node.js/Express backend.

## Project Structure

- **frontend/**: Contains the Next.js application, including UI components, pages, and client-side logic.
- **backend/**: Contains the Node.js Express server, API endpoints, and in-memory database logic.

## Deployment

- **Backend**: Deployed on Vercel
- **Frontend**: Deployed on Vercel

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (Node Package Manager)

## Getting Started

To run the application, you need to start both the backend and frontend servers.

### 1. Start the Backend

Navigate to the backend directory and start the server:

```bash
cd backend
npm install
npm run dev
```

The backend server will start on `http://localhost:5000`.

### 2. Start the Frontend

Open a new terminal, navigate to the frontend directory, and start the development server:

```bash
cd frontend
npm install
npm run dev
```

The frontend application will be accessible at `http://localhost:3000`.

## Features

- **Dynamic Form Generation**: Renders forms based on a JSON schema fetched from the backend.
- **Form Validation**: Client-side validation using Zod.
- **Submission Management**: View, search, edit, and delete form submissions.
- **Data Export**: Export submission data to CSV format.
- **Responsive Design**: Built with Tailwind CSS and ShadCN UI for a modern, responsive interface.
