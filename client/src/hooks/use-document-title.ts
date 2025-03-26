import { useEffect } from 'react';

/**
 * Hook to set the document title with an optional suffix
 * @param title The title to set
 * @param suffix Optional suffix to append to the title, defaults to '| Aviation Training'
 */
export function useDocumentTitle(title: string, suffix: string = '| Aviation Training') {
  useEffect(() => {
    // Save the original title to restore it when the component unmounts
    const originalTitle = document.title;
    
    // Set the new title with suffix
    document.title = `${title} ${suffix}`;
    
    // Cleanup function to restore the original title when the component unmounts
    return () => {
      document.title = originalTitle;
    };
  }, [title, suffix]); // Re-run the effect if title or suffix changes
}