import { useEffect } from 'react';

/**
 * Hook to set the document title
 * @param title The title to set for the document
 * @param addAppName Whether to add the app name after the title (defaults to true)
 */
export function useDocumentTitle(title: string, addAppName = true) {
  useEffect(() => {
    const appName = 'Advanced Pilot Training Platform';
    const newTitle = addAppName ? `${title} | ${appName}` : title;
    document.title = newTitle;
    
    // Reset to default when component unmounts
    return () => {
      document.title = appName;
    };
  }, [title, addAppName]);
}