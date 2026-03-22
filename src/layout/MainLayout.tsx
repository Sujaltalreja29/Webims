import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <Sidebar />
      <Header />
      <main className="ml-72 pt-16">
        <div className="mx-auto w-full max-w-screen-2xl p-6 lg:p-7">
          <Outlet />
        </div>
      </main>
    </div>
  );
};