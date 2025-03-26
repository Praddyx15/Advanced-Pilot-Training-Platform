import { useEffect, useRef } from 'react';

/**
 * Custom hook to set the document title safely, with cleanup
 * @param title The title to set for the document
 * @param prefix An optional prefix to add before the title
 */
export function useDocumentTitle(title: string, prefix?: string) {
  const originalTitle = useRef(document.title);

  useEffect(() => {
    // Skip update if title is empty or undefined
    if (!title) return;

    // Set the document title
    document.title = prefix ? `${prefix} | ${title}` : title;

    // Cleanup function to restore original title when component unmounts
    return () => {
      document.title = originalTitle.current;
    };
  }, [title, prefix]);
}