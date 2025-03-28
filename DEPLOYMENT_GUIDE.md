# Advanced Pilot Training Platform - Deployment Guide

This guide provides comprehensive instructions for deploying the Advanced Pilot Training Platform (APTP) to different environments.

## Table of Contents
- [Replit Deployment](#replit-deployment)
- [GitHub Deployment](#github-deployment)
- [Vercel Deployment](#vercel-deployment)
- [DigitalOcean Deployment](#digitalocean-deployment)
- [Self-Hosted Deployment](#self-hosted-deployment)
- [Environment Variables](#environment-variables)
- [PostgreSQL Database Setup](#postgresql-database-setup)
- [Troubleshooting](#troubleshooting)

## Replit Deployment

The simplest way to deploy APTP is directly from the Replit environment:

1. Open the current Replit project
2. Click the "Deploy" button in the Replit UI
3. Follow the prompts to configure your deployment:
   - Choose a deployment name
   - Configure custom domain (optional)
   - Select deployment region
4. Wait for the deployment to complete
5. Your application will be available at `https://[deployment-name].replit.app`

## GitHub Deployment

To deploy APTP to GitHub and prepare for deployment to other platforms:

1. Run the export script to prepare the project:
   ```bash
   ./export-project.sh
   ```

2. Extract the resulting ZIP file on your local machine:
   ```bash
   unzip export-*.zip
   cd export-*
   ```

3. Initialize a Git repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of APTP"
   ```

4. Create a new repository on GitHub and push your code:
   ```bash
   git remote add origin https://github.com/your-username/advanced-pilot-training-platform.git
   git push -u origin main
   ```

## Vercel Deployment

For deploying to Vercel:

1. Complete the GitHub Deployment steps above
2. Log in to your Vercel account
3. Create a new project and select your GitHub repository
4. Configure the following settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Add the necessary environment variables in Vercel's dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SESSION_SECRET`: Random string for securing sessions
   - Any other API keys needed for features
6. Deploy your application
7. After deployment, set up the PostgreSQL database:
   - Connect to Vercel CLI: `vercel login`
   - Run database migrations: `vercel run npm run db:push`

## DigitalOcean Deployment

For deploying to DigitalOcean App Platform:

1. Complete the GitHub Deployment steps
2. Log in to your DigitalOcean account
3. Go to "Apps" and click "Create App"
4. Connect your GitHub repository
5. Configure the build settings:
   - Build Command: `npm run build`
   - Run Command: `npm start`
6. Add environment variables from the [Environment Variables](#environment-variables) section
7. Select an appropriate plan
8. Deploy your application

## Self-Hosted Deployment

For deploying to your own server:

1. Run the export script as described in GitHub Deployment
2. Extract the ZIP file on your server:
   ```bash
   unzip export-*.zip
   cd export-*
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file with the required environment variables (see `.env.example`)

5. Set up a PostgreSQL database (see [PostgreSQL Database Setup](#postgresql-database-setup))

6. Run database migrations:
   ```bash
   npm run db:push
   ```

7. Build the project:
   ```bash
   npm run build
   ```

8. Set up a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start npm --name "aptp" -- start
   pm2 save
   pm2 startup
   ```

9. Set up a reverse proxy with Nginx:
   ```nginx
   server {
     listen 80;
     server_name yourdomain.com;

     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

10. Set up SSL with Let's Encrypt:
    ```bash
    sudo certbot --nginx -d yourdomain.com
    ```

## Environment Variables

Create a `.env` file with the following variables:

```
# Database
DATABASE_URL=postgresql://username:password@hostname:5432/database_name

# Session
SESSION_SECRET=your-secure-random-string

# API Keys (as needed)
XAI_API_KEY=your-xai-api-key

# App Configuration
NODE_ENV=production
PORT=3000
```

## PostgreSQL Database Setup

### Local Development

1. Install PostgreSQL on your machine
2. Create a new database:
   ```sql
   CREATE DATABASE advanced_pilot_training;
   CREATE USER aptp_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE advanced_pilot_training TO aptp_user;
   ```
3. Update your `.env` file with the connection string:
   ```
   DATABASE_URL=postgresql://aptp_user:your_password@localhost:5432/advanced_pilot_training
   ```

### Production

For production, we recommend using a managed PostgreSQL service:

#### Neon Database
1. Create an account at https://neon.tech
2. Create a new project
3. Create a new database
4. Get the connection string from the dashboard
5. Add it to your environment variables

#### Supabase
1. Create an account at https://supabase.com
2. Create a new project
3. Go to Project Settings → Database
4. Get the connection string
5. Add it to your environment variables

## Troubleshooting

### WebSocket Connection Issues
- Ensure your server supports WebSocket connections
- For Nginx, make sure you have the WebSocket proxy settings:
  ```nginx
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection 'upgrade';
  ```

### Database Connection Issues
- Verify your PostgreSQL connection string is correct
- Check that your database user has the correct permissions
- Ensure your server's firewall allows connections to the database port

### Build Errors
- Try cleaning the node_modules and reinstalling:
  ```bash
  rm -rf node_modules
  npm install
  ```
- Check node version (should be >= 18.0.0):
  ```bash
  node -v
  ```

### Runtime Errors
- Check server logs:
  ```bash
  pm2 logs aptp
  ```
- Verify environment variables are correctly set
- Ensure database migrations have been applied

## Additional Notes

- The exported project automatically removes Replit-specific dependencies and configurations
- The WebSocket implementation is replaced with a standard version that works in any environment
- The 3D Risk Assessment Matrix visualization will work in modern browsers supporting WebGL
- For optimal performance, we recommend a server with at least 1 GB RAM
- Keep your Node.js version up to date (minimum version: 18.0.0)