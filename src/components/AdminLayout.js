import React from 'react';
import { Outlet } from 'react-router-dom';

function AdminLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
