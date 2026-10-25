import React from 'react';
import { 
  X, 
  MapPin, 
  ExternalLink, 
  Compass, 
  Navigation, 
  AlertCircle, 
  CheckCircle2, 
  Copy,
  Info
} from 'lucide-react';

export default function GoogleMapModal({ isOpen, onClose, courierData }) {
  if (!isOpen || !courierData) return null;

  const destination = courierData.destination || courierData.customer_address || 'New Delhi, India';
  const origin = courierData.origin || 'Central Logistics Hub, Okhla';
  const preferredRoute = courierData.preferred_route || 'Direct route via main arterial road';
  const trackingCode = courierData.tracking_code || 'SHIPMENT';
  const customerName = courierData.customer_name || 'Valued Customer';
  const customerPhone = courierData.customer_phone || '';

  // Google Maps Directions Universal URL
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;

  // Safe OpenStreetMap interactive embed for in-app map view
  const embedMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=77.10%2C28.50%2C77.35%2C28.70&layer=mapnik&marker=28.6139%2C77.2090`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard: ' + text);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem'
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Navigation size={22} color="#60a5fa" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>
                Delivery Route Navigation & Google Maps
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                Tracking ID: <strong style={{ color: '#60a5fa' }}>{trackingCode}</strong> • Customer: {customerName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              padding: '0.5rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Customer Stated Route Callout - CRITICAL REQUIREMENT */}
          <div style={{
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start'
          }}>
            <Compass size={24} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  color: '#fbbf24', 
                  letterSpacing: '0.05em' 
                }}>
                  Customer's Specified Route & Landmark Advice:
                </span>
                <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>Zero Route Confusion</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#fef3c7', fontWeight: 500, lineHeight: 1.5 }}>
                "{preferredRoute}"
              </p>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: '#d97706' }}>
                  Destination Address: <strong>{destination}</strong>
                </span>
                {customerPhone && (
                  <a 
                    href={`tel:${customerPhone}`}
                    style={{
                      fontSize: '0.75rem',
                      color: '#60a5fa',
                      textDecoration: 'underline'
                    }}
                  >
                    Call Customer ({customerPhone})
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action Button: Directly Open in Google Maps */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            backgroundColor: 'rgba(30, 41, 59, 0.6)',
            padding: '1rem',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f8fafc' }}>
                Turn-by-Turn GPS Navigation
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Launches Google Maps directly with origin, destination, and live GPS routing.
              </div>
            </div>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '0.75rem 1.4rem',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.92rem',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              <ExternalLink size={18} />
              <span>Open in Google Maps</span>
            </a>
          </div>

          {/* Interactive Map Preview Window */}
          <div style={{
            borderRadius: '14px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative'
          }}>
            <div style={{
              backgroundColor: '#1e293b',
              padding: '0.6rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: '#94a3b8'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={14} color="#60a5fa" />
                Live Route Map Preview (GPS Pin: {destination})
              </span>
              <button
                onClick={() => copyToClipboard(destination)}
                style={{
                  background: 'none',
                  color: '#60a5fa',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.72rem'
                }}
              >
                <Copy size={12} />
                Copy Address
              </button>
            </div>

            <iframe
              title="Delivery Map Preview"
              width="100%"
              height="280"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              src={embedMapUrl}
              style={{ display: 'block', filter: 'invert(90%) hue-rotate(180deg) contrast(1.1)' }}
            />
          </div>

          {/* Route Milestones Quick Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.85rem'
          }}>
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              padding: '0.85rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Origin Hub</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginTop: '0.2rem' }}>
                {origin}
              </div>
            </div>

            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              padding: '0.85rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Current Milestone</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8', marginTop: '0.2rem' }}>
                {courierData.current_checkpoint || 'Out for Delivery'}
              </div>
            </div>

            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              padding: '0.85rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Final Destination</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4ade80', marginTop: '0.2rem' }}>
                {destination}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          backgroundColor: '#0f172a'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            Close Navigation
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1.25rem',
              borderRadius: '10px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.85rem',
              textDecoration: 'none'
            }}
          >
            <ExternalLink size={15} />
            <span>Launch Google Maps GPS</span>
          </a>
        </div>

      </div>
    </div>
  );
}
