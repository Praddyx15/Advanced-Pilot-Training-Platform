import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';

export function setupThemeRoutes(app: Express) {
  // API route for updating theme.json
  app.post('/api/update-theme', (req, res) => {
    try {
      const { appearance } = req.body;
      
      if (!appearance || !['light', 'dark', 'system'].includes(appearance)) {
        return res.status(400).json({ error: 'Invalid theme appearance value' });
      }
      
      // Read the current theme.json
      const themePath = path.resolve(process.cwd(), 'theme.json');
      const themeContent = JSON.parse(fs.readFileSync(themePath, 'utf8'));
      
      // Update the appearance
      themeContent.appearance = appearance;
      
      // Write back to file
      fs.writeFileSync(themePath, JSON.stringify(themeContent, null, 2));
      
      return res.status(200).json({ success: true, theme: themeContent });
    } catch (error) {
      console.error('Error updating theme:', error);
      return res.status(500).json({ error: 'Failed to update theme' });
    }
  });
  
  // API route for getting current theme
  app.get('/api/theme', (req, res) => {
    try {
      const themePath = path.resolve(process.cwd(), 'theme.json');
      const themeContent = JSON.parse(fs.readFileSync(themePath, 'utf8'));
      return res.status(200).json(themeContent);
    } catch (error) {
      console.error('Error getting theme:', error);
      return res.status(500).json({ error: 'Failed to get theme' });
    }
  });
}