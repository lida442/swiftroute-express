import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import GoogleMapModal from './components/GoogleMapModal';
import SqlInspectorModal from './components/SqlInspectorModal';
import CustomerPortal from './pages/CustomerPortal';
import DeliveryPortal from './pages/DeliveryPortal';
import AdminPortal from './pages/AdminPortal';
import { Database, ShieldCheck, Truck, Bike } from 'lucide-react';

export default function App() {
  const [mapCourierData, setMapCourierData] = useState(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isSqlInspectorOpen, setIsSqlInspectorOpen] = useState(false);

  const handleOpenMap = (courier) => {
    setMapCourierData(courier);
    setIsMapOpen(true);
  };

  const handleCloseMap = () => {
    setIsMapOpen(false);
    setMapCourierData(null);
  };

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        
        {/* Navigation Bar */}
        <Navbar 
          onOpenSqlInspector={() => setIsSqlInspectorOpen(true)}
        />

        {/* Main Application Routes */}
        <main style={{ flex: 1 }}>
          <Routes>
            {/* Customer Portal: Open to everyone without password */}
            <Route 
              path="/" 
              element={<CustomerPortal onOpenMap={handleOpenMap} />} 
            />
            <Route 
              path="/customer" 
              element={<CustomerPortal onOpenMap={handleOpenMap} />} 
            />

            {/* Delivery Portal: Protected by Delivery Guy Name and Password */}
            <Route 
              path="/delivery" 
              element={<DeliveryPortal onOpenMap={handleOpenMap} />} 
            />

            {/* Admin Portal: Protected by Admin Password */}
            <Route 
              path="/admin" 
              element={
                <AdminPortal 
                  onOpenMap={handleOpenMap} 
                  onOpenSqlInspector={() => setIsSqlInspectorOpen(true)}
                />
              } 
            />

            {/* Fallback to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Google Maps Route Navigation Modal */}
        <GoogleMapModal
          isOpen={isMapOpen}
          onClose={handleCloseMap}
          courierData={mapCourierData}
        />

        {/* Global SQL JOIN Query & RDBMS Inspector Modal */}
        <SqlInspectorModal
          isOpen={isSqlInspectorOpen}
          onClose={() => setIsSqlInspectorOpen(false)}
        />

        {/* Footer */}
        <footer style={{
          backgroundColor: 'rgba(10, 14, 23, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          marginTop: 'auto'
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#93c5fd' }}>
                <Truck size={14} /> React & React Router v7
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc' }}>
                <Database size={14} /> Relational SQLite RDBMS with JOIN Queries
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399' }}>
                <Bike size={14} /> Live Driver Availability & GPS Google Maps
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24' }}>
                <ShieldCheck size={14} /> Admin Issue Resolution Console
              </span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              SwiftRoute Courier Logistics Management System • Built with 3 distinct portals: Admin (Password), Customer (Public), Delivery Rider (Name & Password).
            </p>
          </div>
        </footer>

      </div>
    </BrowserRouter>
  );
}
