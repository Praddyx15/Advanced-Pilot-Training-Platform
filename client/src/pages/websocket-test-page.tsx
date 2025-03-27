import React from 'react';
import { Helmet } from 'react-helmet';
import { PageHeader } from '@/components/shared/page-header';
import WebSocketTester from '@/components/shared/websocket-tester';
import { LogsViewer } from '@/components/shared/logs-viewer';

/**
 * WebSocket Test Page
 * This page provides utilities for testing WebSocket functionality
 */
export default function WebSocketTestPage() {
  const [logs, setLogs] = React.useState<string[]>([]);
  
  // Override console.log to capture WebSocket logs
  React.useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    // Only capture WebSocket-related logs
    console.log = (...args) => {
      originalConsoleLog(...args);
      if (args[0] && typeof args[0] === 'string' && args[0].includes('[WebSocket]')) {
        setLogs(prev => [...prev, `LOG: ${args.join(' ')}`]);
      }
    };
    
    console.error = (...args) => {
      originalConsoleError(...args);
      if (args[0] && typeof args[0] === 'string' && args[0].includes('[WebSocket]')) {
        setLogs(prev => [...prev, `ERROR: ${args.join(' ')}`]);
      }
    };
    
    console.warn = (...args) => {
      originalConsoleWarn(...args);
      if (args[0] && typeof args[0] === 'string' && args[0].includes('[WebSocket]')) {
        setLogs(prev => [...prev, `WARN: ${args.join(' ')}`]);
      }
    };
    
    // Reset console.log on unmount
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);
  
  // Clear logs
  const handleClearLogs = () => {
    setLogs([]);
  };
  
  return (
    <>
      <Helmet>
        <title>WebSocket Testing | Aviation Training Platform</title>
      </Helmet>
      
      <div className="container mx-auto py-8 px-4">
        <PageHeader 
          title="WebSocket Testing"
          description="Test and debug WebSocket connections and events"
          className="mb-8"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <WebSocketTester />
          </div>
          
          <div>
            <LogsViewer 
              logs={logs} 
              title="WebSocket Logs" 
              onClear={handleClearLogs}
              maxHeight="md:h-[500px]"
            />
          </div>
        </div>
      </div>
    </>
  );
}