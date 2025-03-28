# Advanced Pilot Training Platform - Deployment Guide

This guide provides comprehensive instructions for deploying the Advanced Pilot Training Platform to environments outside of Replit, including traditional hosting providers, cloud platforms, and containerized environments.

## Prerequisites

- Node.js v18.x or v20.x LTS
- PostgreSQL 14+ database
- Git
- Basic knowledge of terminal/command line
- A hosting provider with support for Node.js applications

## Step 1: Prepare the Environment

### Database Setup

1. Create a PostgreSQL database for your application:
   ```bash
   createdb advanced_pilot_training
   ```

2. Configure the database connection by setting the `DATABASE_URL` environment variable:
   ```bash
   export DATABASE_URL=postgresql://username:password@localhost:5432/advanced_pilot_training
   ```

### Clone the Repository

```bash
git clone https://github.com/your-username/advanced-pilot-training-platform.git
cd advanced-pilot-training-platform
```

## Step 2: Apply Replit-Independent Files

The repository includes special files designed for non-Replit environments. You'll need to use these files instead of their Replit-specific counterparts:

1. Replace the Vite configuration:
   ```bash
   cp export-vite.config.ts vite.config.ts
   ```

2. Use the standard WebSocket implementation:
   ```bash
   cp client/src/vite-hmr-fix-standard.ts client/src/vite-hmr-fix.ts
   ```

3. Use the standard routes file:
   ```bash
   cp server/routes-standard.ts server/routes.ts
   ```

4. Remove Replit-specific metadata from HTML files:
   ```bash
   node clean-html.js
   node remove-replit-metadata.js
   ```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Set Up Environment Variables

Create a `.env` file in the project root with the following variables:

```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/advanced_pilot_training

# Session
SESSION_SECRET=your-secure-session-secret

# API Keys (if needed)
XAI_API_KEY=your-xai-api-key
```

## Step 5: Initialize the Database

```bash
npm run db:push
```

This will create all necessary tables according to your Drizzle schema.

## Step 6: Build the Application

```bash
npm run build
```

This generates the production build in the `dist` directory.

## Step 7: Start the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run start
```

## Deployment Options

### Option 1: Traditional Node.js Hosting

1. Upload the built application (everything except `node_modules`)
2. Install dependencies on the server: `npm install --production`
3. Start the application: `npm run start`

### Option 2: Docker Deployment

A Dockerfile is included for containerized deployment:

1. Build the Docker image:
   ```bash
   docker build -t advanced-pilot-training .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 -e DATABASE_URL=postgresql://user:password@host:5432/dbname advanced-pilot-training
   ```

### Option 3: Cloud Platform Deployment

#### Vercel

1. Connect your repository to Vercel
2. Set the required environment variables in the Vercel dashboard
3. Deploy using the Vercel dashboard or CLI

#### Railway/Render/Fly.io

These platforms can deploy directly from your repository with minimal configuration:

1. Connect your repository to the platform
2. Configure environment variables
3. Deploy using the platform's dashboard or CLI

## WebSocket Configuration

The WebSocket server is configured to run on the same port as the HTTP server with a path of `/ws`. Make sure your hosting provider supports WebSockets.

For clients connecting to the WebSocket server:

```javascript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const host = window.location.host;
const wsUrl = `${protocol}//${host}/ws`;
const socket = new WebSocket(wsUrl);
```

## Troubleshooting

### Database Connection Issues

- Verify that the `DATABASE_URL` environment variable is set correctly
- Ensure the database user has the necessary permissions
- Check if your hosting provider requires SSL for database connections

### WebSocket Connection Failures

- Verify that your hosting provider supports WebSockets
- Check that the WebSocket path `/ws` isn't blocked by a proxy
- Ensure your client is using the correct WebSocket URL

### Missing Environment Variables

- Double-check that all required environment variables are set
- Some platforms require setting environment variables through their dashboard
- Secret values should never be committed to your repository

## Maintenance

### Database Migrations

When your Drizzle schema changes, run the migration command:

```bash
npm run db:push
```

### Updating the Application

1. Pull the latest changes: `git pull`
2. Install dependencies: `npm install`
3. Build the application: `npm run build`
4. Restart the server: `npm run start`

## Security Considerations

- Always use HTTPS in production
- Keep your `SESSION_SECRET` secure and unique for each environment
- Regularly update dependencies: `npm audit fix`
- Implement rate limiting for API endpoints
- Set up monitoring and logging

## Support

If you encounter issues during deployment, please:

1. Check the application logs for error messages
2. Consult the documentation for your hosting provider
3. Review the troubleshooting section in this guide
4. Contact our support team at support@advancedpilottraining.com