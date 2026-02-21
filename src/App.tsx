import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './app/router';
import { useAuthStore } from './store/authStore';
import { seedData } from './core/services/seed-data';

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    // Seed data on first load
    seedData();
    
    // Initialize auth from localStorage
    initAuth();
  }, [initAuth]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;