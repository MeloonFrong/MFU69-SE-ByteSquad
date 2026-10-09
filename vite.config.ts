import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn, ChildProcess } from 'child_process';

let pythonBackendProcess: ChildProcess | null = null;

function pythonBackendPlugin() {
  return {
    name: 'vite-python-backend',
    configureServer() {
      if (!pythonBackendProcess) {
        console.log('[AI Studio] Launching Python backend on port 5001...');
        pythonBackendProcess = spawn('python3', ['backend/server.py', '--port', '5001'], {
          stdio: 'inherit',
        });

        process.on('exit', () => {
          if (pythonBackendProcess) pythonBackendProcess.kill();
        });
        process.on('SIGINT', () => {
          if (pythonBackendProcess) pythonBackendProcess.kill();
        });
        process.on('SIGTERM', () => {
          if (pythonBackendProcess) pythonBackendProcess.kill();
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), pythonBackendPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
    },
  },
});
