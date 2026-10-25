import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Package, 
  Truck, 
  User, 
  Phone, 
  MapPin, 
  Compass, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Send,
  Navigation
} from 'lucide-react';

export default function CustomerPortal({ onOpenMap }) {
  const [trackingInput, setTrackingInput] = useState('TRK-98241');
  const [courierData, setCourierData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sampleShipments, setSampleShipments] = useState([]);

  // Problem Filing Form State
  const [issueType, setIssueType] = useState('Wrong Route / Gate Confusion');
  const [description, setDescription] = useState('');
  const [submittingProblem, setSubmittingProblem] = useState(false);
  const [problemSuccess, setProblemSuccess] = useState(null);

  // Fetch sample shipments on mount
  useEffect(() => {
    fetch('/api/customer/recent-shipments')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSampleShipments(data.shipments || []);
        }
      })
      .catch(console.error);

    // Initial load with default shipment
    handleTrack('TRK-98241');
  }, []);

  const handleTrack = async (codeToTrack) => {
    const code = (codeToTrack || trackingInput).trim();
    if (!code) return;

    setLoading(true);
    setError(null);
    setProblemSuccess(null);

    try {
      const res = await fetch(`/api/customer/track/${encodeURIComponent(code)}`);
      const data = await res.json();

      if (data.success) {
        setCourierData(data.data);
      } else {
        setError(data.error || 'Tracking code not found in courier database.');
        setCourierData(null);
      }
    } catch (err) {
      setError('Unable to connect to logistics database. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileProblem = async (e) => {
    e.preventDefault();
    if (!description.trim() || !courierData) return;

    setSubmittingProblem(true);
    setProblemSuccess(null);

    try {
      const res = await fetch('/api/customer/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courier_id: courierData.id,
          customer_id: courierData.customer_id,
          issue_type: issueType,
          description: description.trim()
        })
      });

      const result = await res.json();
      if (result.success) {
        setProblemSuccess(result.message);
        setDescription('');
        // Refresh tracking data to show newly filed complaint
        handleTrack(courierData.tracking_code);
      } else {
        alert(result.error || 'Failed to file problem.');
      }
    } catch (err) {
      alert('Error submitting issue: ' + err.message);
    } finally {
      setSubmittingProblem(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Hero Tracking Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(88, 28, 135, 0.4) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          <span className="badge badge-blue" style={{ marginBottom: '0.75rem' }}>
            Open Public Tracking Portal
          </span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
            Live Courier & Route Tracker
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
            Real-time checkpoint tracking, direct personal contact with your delivery rider, route guidance, and instant problem filing.
          </p>

          {/* Search Bar */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleTrack(); }}
            style={{
              display: 'flex',
              gap: '0.5rem',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              padding: '0.4rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '1rem', color: '#60a5fa' }}>
              <Search size={20} />
            </div>
            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="Enter Tracking ID (e.g. TRK-98241)..."
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                color: '#ffffff',
                fontSize: '1rem',
                padding: '0.75rem 0.5rem'
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '0.75rem 1.75rem',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
              }}
            >
              {loading ? 'Searching...' : 'Track Package'}
            </button>
          </form>

          {/* Quick Click Samples */}
          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Try live sample shipments:</span>
            {sampleShipments.map((shipment) => (
              <button
                key={shipment.tracking_code}
                onClick={() => {
                  setTrackingInput(shipment.tracking_code);
                  handleTrack(shipment.tracking_code);
                }}
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: trackingInput === shipment.tracking_code ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                  color: trackingInput === shipment.tracking_code ? '#60a5fa' : '#cbd5e1',
                  border: trackingInput === shipment.tracking_code ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                  padding: '0.2rem 0.55rem',
                  cursor: 'pointer'
                }}
              >
                {shipment.tracking_code} ({shipment.status})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '14px',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#f87171'
        }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Tracking Details View */}
      {courierData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Main Status & Header Grid */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Package size={24} color="#60a5fa" />
                  <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#f8fafc' }}>
                    Shipment #{courierData.tracking_code}
                  </h2>
                  <span className={`badge ${
                    courierData.status === 'Delivered' ? 'badge-emerald' : 
                    courierData.status === 'Out for Delivery' ? 'badge-blue' : 'badge-amber'
                  }`}>
                    <span className="pulse-dot" style={{ backgroundColor: 'currentColor' }} />
                    {courierData.status}
                  </span>
                </div>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                  Item: <strong style={{ color: '#e2e8f0' }}>{courierData.package_type}</strong> • Weight: {courierData.weight_kg} kg • Estimated Delivery: <strong style={{ color: '#38bdf8' }}>{courierData.estimated_delivery}</strong>
                </p>
              </div>

              {/* Action: Open Route in Google Maps */}
              <button
                onClick={() => onOpenMap(courierData)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#60a5fa',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <Compass size={17} />
                <span>Open Google Map Route</span>
                <ExternalLink size={14} />
              </button>
            </div>

            {/* Core Info 3-Column Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              
              {/* Card 1: WHO IS DELIVERING (Delivery Guy Name + PERSONAL NUMBER) */}
              <div style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '16px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Assigned Delivery Partner
                  </span>
                  <span className="badge badge-purple" style={{ fontSize: '0.62rem' }}>
                    Personal Contact
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <User size={24} color="#c084fc" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>
                      {courierData.delivery_guy_name || 'Assigned to Depot Agent'}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {courierData.vehicle_type} ({courierData.vehicle_no || 'Express Fleet'}) • Rating: ⭐ {courierData.delivery_guy_rating || '4.9'}
                    </div>
                  </div>
                </div>

                {/* Personal Number of Delivery Guy - REQUIREMENT */}
                <div style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  borderRadius: '12px',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={16} color="#34d399" />
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Personal Phone Number:</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                        {courierData.delivery_guy_personal_phone || '+91 98765 43210'}
                      </div>
                    </div>
                  </div>

                  <a
                    href={`tel:${courierData.delivery_guy_personal_phone || '+919876543210'}`}
                    style={{
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Phone size={13} />
                    <span>Call Now</span>
                  </a>
                </div>
              </div>

              {/* Card 2: WHERE HE HAS REACHED (Current Checkpoint) */}
              <div style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '16px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Where Package Has Reached
                  </span>
                  <span className="badge badge-blue" style={{ fontSize: '0.62rem' }}>
                    Live GPS Status
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <MapPin size={20} color="#38bdf8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#38bdf8', lineHeight: 1.3 }}>
                      {courierData.current_checkpoint}
                    </div>
                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                      En route to: {courierData.customer_address}
                    </p>
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  borderRadius: '12px',
                  padding: '0.75rem',
                  fontSize: '0.75rem',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.68rem', marginBottom: '0.2rem' }}>Origin & Destination:</div>
                  <div>📍 <strong>From:</strong> {courierData.origin}</div>
                  <div>🎯 <strong>To:</strong> {courierData.destination}</div>
                </div>
              </div>

              {/* Card 3: ROUTE GUIDANCE SPECIFIED BY CUSTOMER */}
              <div style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '16px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700 }}>
                    Customer's Stated Route
                  </span>
                  <span className="badge badge-amber" style={{ fontSize: '0.62rem' }}>
                    Zero Confusion
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#fef3c7', lineHeight: 1.45 }}>
                  "{courierData.preferred_route || 'Enter via main society gate near security desk.'}"
                </div>

                <button
                  onClick={() => onOpenMap(courierData)}
                  style={{
                    marginTop: 'auto',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: '#fbbf24',
                    padding: '0.55rem',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                >
                  <Navigation size={14} />
                  <span>Click to Open Route in Google Maps</span>
                </button>
              </div>

            </div>

            {/* Checkpoints Timeline Progression */}
            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} color="#60a5fa" />
                Checkpoint History & Milestones
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingLeft: '0.5rem' }}>
                {courierData.checkpoints && courierData.checkpoints.map((cp, idx) => (
                  <div key={cp.id || idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: cp.is_completed ? '#10b981' : 'rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0
                    }}>
                      {cp.is_completed ? <CheckCircle2 size={16} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#94a3b8' }} />}
                    </div>
                    <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.65rem 0.95rem', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.88rem', color: '#f1f5f9' }}>{cp.status_label}</strong>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{cp.timestamp}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '0.15rem' }}>
                        📍 {cp.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* SECTION: A SPACE TO FILE THE PROBLEM FACED BY CUSTOMER & VIEW ADMIN REPLIES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem' }}>
            
            {/* Space 1: File A Problem Form */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                <ShieldAlert size={22} color="#f43f5e" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>
                  File a Problem Faced With Delivery
                </h3>
              </div>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                Having an issue with route, delivery guy communication, or delayed parcel? Report below directly to Operations Admin.
              </p>

              {problemSuccess && (
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.82rem',
                  color: '#34d399',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle2 size={16} />
                  <span>{problemSuccess}</span>
                </div>
              )}

              <form onSubmit={handleFileProblem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Type of Problem Faced:
                  </label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="Wrong Route / Gate Confusion">Wrong Route / Gate Confusion</option>
                    <option value="Delivery Guy Unreachable">Delivery Guy Unreachable / Not Picking Phone</option>
                    <option value="Delayed Shipment">Delay Beyond Estimated Time</option>
                    <option value="Package Damaged / Open">Package Damaged or Open</option>
                    <option value="Urgent Delivery Priority">Urgent Delivery Expedite Request</option>
                    <option value="Other Issue">Other Complaint</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Explain the problem in detail:
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. The delivery guy went to Gate 1 instead of Gate 3 near Metro Pillar 188. Please direct him to Gate 3..."
                    style={{ width: '100%', resize: 'vertical' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingProblem}
                  style={{
                    backgroundColor: '#e11d48',
                    color: '#ffffff',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(225, 29, 72, 0.4)'
                  }}
                >
                  <Send size={16} />
                  <span>{submittingProblem ? 'Submitting to Admin...' : 'Submit Problem to Admin'}</span>
                </button>
              </form>
            </div>

            {/* Space 2: Admin Replies to Filed Problems */}
            <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                <MessageSquare size={22} color="#60a5fa" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>
                  Admin Replies & Resolution Status
                </h3>
              </div>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                Live replies and actions taken by the Admin team regarding your filed complaints.
              </p>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '380px' }}>
                {courierData.problems && courierData.problems.length > 0 ? (
                  courierData.problems.map((prob) => (
                    <div
                      key={prob.id}
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '14px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f43f5e' }}>
                          ⚠️ {prob.issue_type}
                        </span>
                        <span className={`badge ${
                          prob.status === 'RESOLVED' ? 'badge-emerald' : 'badge-amber'
                        }`} style={{ fontSize: '0.62rem' }}>
                          {prob.status}
                        </span>
                      </div>

                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#e2e8f0', fontStyle: 'italic' }}>
                        "{prob.description}"
                      </p>

                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Filed on: {prob.created_at}
                      </div>

                      {/* Admin's Official Reply */}
                      <div style={{
                        marginTop: '0.35rem',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderLeft: '3px solid #3b82f6',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '0 8px 8px 0'
                      }}>
                        <div style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                          🛡️ Operations Admin Reply:
                        </div>
                        {prob.admin_reply ? (
                          <>
                            <div style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>
                              {prob.admin_reply}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                              Replied at: {prob.replied_at}
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: '0.78rem', color: '#fbbf24', fontStyle: 'italic' }}>
                            ⏳ Under investigation by Admin. Response will appear here shortly.
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    textAlign: 'center',
                    padding: '2rem'
                  }}>
                    <CheckCircle2 size={36} color="#10b981" style={{ marginBottom: '0.5rem', opacity: 0.8 }} />
                    <div style={{ fontWeight: 600, color: '#f1f5f9' }}>No Issues Reported</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Shipment is moving on schedule without customer complaints.
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
