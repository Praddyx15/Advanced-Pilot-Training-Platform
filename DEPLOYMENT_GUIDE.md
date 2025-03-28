# Advanced Pilot Training Platform - Deployment Guide

This guide provides instructions for deploying the Advanced Pilot Training Platform outside of Replit.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git
- Basic knowledge of terminal/command line

## Export Process

1. Run the export script (from within Replit):
   ```
   chmod +x export-project.sh
   ./export-project.sh
   ```

2. Download the exported project from the `export-project` directory.

## Deployment Steps

### Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables (create a `.env` file):
   ```
   DATABASE_URL=postgresql://username:password@hostname:port/database
   SESSION_SECRET=your-secure-random-string
   ```

3. Run database migrations:
   ```
   npm run db:push
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Access the application at http://localhost:3000

### Production Deployment

#### Option 1: Traditional Hosting

1. Build the application:
   ```
   npm run build
   ```

2. Start the production server:
   ```
   npm start
   ```

#### Option 2: Docker Deployment

1. Create a Dockerfile in the project root:
   ```dockerfile
   FROM node:18-alpine as builder

   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM node:18-alpine

   WORKDIR /app
   COPY --from=builder /app/package*.json ./
   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/node_modules ./node_modules

   ENV NODE_ENV=production
   EXPOSE 3000

   CMD ["npm", "start"]
   ```

2. Build and run the Docker container:
   ```
   docker build -t advanced-pilot-training .
   docker run -p 3000:3000 --env-file .env advanced-pilot-training
   ```

#### Option 3: Platform as a Service (Render, Railway, etc.)

1. Connect your Git repository to the platform
2. Configure the build settings:
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
3. Set environment variables (DATABASE_URL, SESSION_SECRET, etc.)
4. Deploy the application

## Common Issues and Solutions

### WebSocket Connection Problems

If you encounter WebSocket connection issues:

1. Check that the WebSocket server is properly set up in `server/routes-standard.ts`
2. Ensure the client is connecting to the correct WebSocket URL in `client/src/vite-hmr-fix-standard.ts`
3. Verify that your hosting provider supports WebSockets

### THREE.js Visualization Issues

The 3D visualizations use THREE.js and React Three Fiber. If you encounter rendering issues:

1. Make sure the browser supports WebGL
2. Check browser console for errors related to THREE.js
3. The application has fallback mechanisms for when 3D rendering fails, but you can further customize these in the visualization components

### Database Connection Issues

1. Verify your DATABASE_URL is correct
2. Ensure the PostgreSQL server is running and accessible
3. Check firewall settings if connecting to a remote database

## Customization

### Styling and Theme

The application uses Tailwind CSS with ShadCN UI components. You can customize the theme in:

1. The `theme.json` file at the root
2. Tailwind configuration in `tailwind.config.ts`

### Adding Features

The application is structured as follows:

- `client/src` - Frontend code
  - `components` - UI components
  - `hooks` - React hooks
  - `lib` - Utility functions
  - `pages` - Page components
- `server` - Backend code
- `shared` - Shared types and utilities

Follow the existing patterns when adding new features. Use the standard development practices for React and Express applications.

## Conclusion

This guide provides the basics for deploying the Advanced Pilot Training Platform. For more detailed information, refer to the documentation specific to your chosen deployment platform.

For questions or support, contact the development team.