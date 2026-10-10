import React, { useState } from 'react';
import { BrandLogo } from '../../components/common/BrandLogo';
import {
  Shield,
  Ship,
  Package,
  FileText,
  Users,
  Layers,
  ArrowRight,
  Lock,
  Mail,
  CheckCircle2,
  Anchor,
  Box,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { initialUsers } from '../../data/mock/usersData';

export const LoginPage = ({ onLoginSuccess }) => {
  const { login, switchUser, usersList } = useAuth();
  const { showToast } = useToast();

  const roleDetails = {
    'USR-001': {
      roleKey: 'super_admin',
      title: 'Super Admin',
      shortLabel: 'Super Admin',
      category: 'Full Access',
      badgeColor: '#0284C7',
      icon: ShieldCheck,
      summary: 'Manage users, permissions & system settings'
    },
    'USR-005': {
      roleKey: 'operations',
      title: 'Operations',
      shortLabel: 'Ops',
      category: 'Consolidation',
      badgeColor: '#059669',
      icon: Ship,
      summary: 'Consolidate cargo into containers & book shipments'
    },
    'USR-002': {
      roleKey: 'documentation',
      title: 'Documentation',
      shortLabel: 'Docs',
      category: 'B/L & Manifests',
      badgeColor: '#8B5CF6',
      icon: FileText,
      summary: 'Review Master & House B/Ls, clear holds & export manifests'
    },
    'USR-003': {
      roleKey: 'warehouse',
      title: 'Warehouse',
      shortLabel: 'Warehouse',
      category: 'Cargo Intake',
      badgeColor: '#D97706',
      icon: Package,
      summary: 'Receive cargo, measure dimensions & print labels'
    },
    'USR-004': {
      roleKey: 'agent',
      title: 'Destination Agent',
      shortLabel: 'Agent',
      category: 'Port Clearance',
      badgeColor: '#EF4444',
      icon: Shield,
      summary: 'Inspect arrivals, clear customs & coordinate delivery'
    }
  };

  const workflowOrder = ['USR-001', 'USR-005', 'USR-002', 'USR-003', 'USR-004'];

  const sortedUsers = workflowOrder.map((code, idx) => {
    const details = roleDetails[code];
    const matched = usersList.find(u => {
      const uCode = u.userCode || u.id;
      return uCode === code || u.roleKey === details.roleKey;
    });
    const fallback = initialUsers.find(u => u.id === code) || initialUsers[0];
    const userObj = matched || fallback;
    return {
      ...userObj,
      personaKey: `persona-${code}-${userObj.id || idx}`,
      details,
      shortLabel: details.shortLabel,
      roleTitle: details.title,
      badgeColor: details.badgeColor
    };
  });

  const [selectedUser, setSelectedUser] = useState(() => sortedUsers[0]);
  const [email, setEmail] = useState(() => sortedUsers[0]?.email || 'marcus.vance@vicustoms.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPersona = (u) => {
    setSelectedUser(u);
    setEmail(u.email);
    setPassword('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loggedUser = await login(email, password);
      setIsLoading(false);
      showToast(
        `Welcome back, ${loggedUser.name}! Logged in as ${loggedUser.role || loggedUser.roleKey}.`,
        'success',
        'Authentication Successful'
      );
      if (onLoginSuccess) {
        onLoginSuccess(loggedUser);
      }
    } catch (err) {
      setIsLoading(false);
      showToast(
        err.message || 'Invalid email or password. Please check your credentials.',
        'danger',
        'Authentication Failed'
      );
    }
  };

  const handleQuickLogin = async (u) => {
    setIsLoading(true);
    try {
      const loggedUser = await switchUser(u.id || u.userCode || u.email);
      setIsLoading(false);
      if (loggedUser) {
        showToast(
          `Signed in as ${loggedUser.name} (${loggedUser.role || loggedUser.roleKey}).`,
          'success',
          'Portal Access Granted'
        );
        if (onLoginSuccess) {
          onLoginSuccess(loggedUser);
        }
      }
    } catch (err) {
      setIsLoading(false);
      showToast(
        err.message || 'Login failed. Please check backend connection.',
        'danger',
        'Authentication Failed'
      );
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-inner-container">
        {/* Top Brand Header */}
        <div className="login-brand-header">
          <div style={{ display: 'inline-block', transform: 'scale(0.95)', marginBottom: '0.25rem' }}>
            <BrandLogo variant="light" size="default" />
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.78rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.3 }}>
            Freight Forwarding, Cargo Consolidation &amp; Logistics Management System
          </p>
        </div>

        {/* Main Dual Box Container */}
        <div className="login-card-container">

          {/* LEFT COLUMN: Standard Form Sign-in */}
          <div className="login-form-pane">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0284C7', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Lock size={13} /> Portal Sign In
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0A192F', marginTop: '0.15rem', marginBottom: '0.15rem' }}>
                Sign In to Your Workspace
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.65rem' }}>
                Select a role icon below or enter your credentials:
              </p>

              {/* Quick 1-Tap Icon Logo Buttons */}
              <div style={{ marginBottom: '0.75rem', background: '#F8FAFC', padding: '0.45rem 0.5rem', borderRadius: '10px', border: '1px solid #E2E8F0', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#D97706', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.15rem', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                    <Sparkles size={12} /> Quick Select Role:
                  </span>
                </div>

                {/* 5-Column Clean Icon Buttons in Single Row */}
                <div className="role-icon-grid">
                  {sortedUsers.map((u) => {
                    const details = u.details || roleDetails[u.userCode] || roleDetails[u.id] || roleDetails['USR-001'];
                    const isSelected = (selectedUser?.userCode || selectedUser?.id) === (u.userCode || u.id) || selectedUser?.email === u.email;
                    const Icon = details.icon;

                    return (
                      <button
                        key={u.personaKey}
                        type="button"
                        onClick={() => handleQuickLogin(u)}
                        className={`role-icon-btn ${isSelected ? 'active' : ''}`}
                        title={`Sign in as ${u.name} (${details.title})`}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: details.badgeColor,
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          flexShrink: 0
                        }}>
                          <Icon size={14} />
                        </div>
                        <span className="role-icon-label">
                          {details.shortLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>Email Address</label>
                <div className="input-with-icon">
                  <Mail size={15} className="input-icon-left" style={{ color: '#94A3B8' }} />
                  <input
                    type="email"
                    className="form-control"
                    placeholder="name@vicustoms.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ paddingLeft: '2.2rem', height: '38px', fontSize: '0.825rem' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, margin: 0 }}>Password</label>
                </div>
                <div className="input-with-icon">
                  <Lock size={15} className="input-icon-left" style={{ color: '#94A3B8' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingLeft: '2.2rem', paddingRight: '2.2rem', height: '38px', fontSize: '0.825rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94A3B8'
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', margin: '0.1rem 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#0A192F', cursor: 'pointer' }}
                  />
                  <span>Remember my login</span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                style={{
                  width: '100%',
                  height: '40px',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  marginTop: '0.2rem',
                  backgroundColor: '#0A192F',
                  borderColor: '#0A192F',
                  boxShadow: '0 4px 10px rgba(10, 25, 47, 0.2)'
                }}
              >
                {isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid #F1F5F9', fontSize: '0.72rem', color: '#94A3B8', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
            <span>VI Logistics System</span>
            <span>CFS &amp; Maritime Hub</span>
          </div>
        </div>

        {/* RIGHT COLUMN: 1-Click Role Login Hub (Demo Switcher) */}
        <div className="login-roles-pane">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem', flexWrap: 'wrap', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0284C7', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Users size={13} /> Workspaces by Role
              </div>
              <span style={{ fontSize: '0.68rem', background: '#E0F2FE', color: '#0369A1', padding: '1px 7px', borderRadius: '4px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                Role-Focused Menus
              </span>
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0A192F', marginBottom: '0.2rem' }}>
              Select a Role to Sign In
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.65rem' }}>
              Choose a role below to access their specific workspace and primary actions:
            </p>

            {/* 5 Persona Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {sortedUsers.map((u) => {
                const details = u.details || roleDetails[u.userCode] || roleDetails[u.id] || roleDetails['USR-001'];
                const Icon = details.icon;
                const isCurrent = (selectedUser?.userCode || selectedUser?.id) === (u.userCode || u.id) || selectedUser?.email === u.email;

                return (
                  <div
                    key={u.personaKey}
                    onClick={() => handleSelectPersona(u)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      backgroundColor: '#FFFFFF',
                      border: isCurrent ? `2px solid ${details.badgeColor}` : '1px solid #E2E8F0',
                      boxShadow: isCurrent ? '0 3px 8px rgba(0,0,0,0.06)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}
                    className="card-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '7px',
                        backgroundColor: details.badgeColor,
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        flexShrink: 0
                      }}>
                        <Icon size={15} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, color: '#0A192F', fontSize: '0.82rem' }}>
                            {details.title}
                          </span>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            color: '#475569',
                            background: '#F1F5F9',
                            padding: '1px 5px',
                            borderRadius: '4px'
                          }}>
                            {u.name}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '0.72rem',
                          color: '#64748B',
                          marginTop: '1px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {details.summary}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickLogin(u);
                      }}
                      className="btn btn-sm btn-outline"
                      style={{
                        padding: '0.25rem 0.55rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: details.badgeColor,
                        borderColor: details.badgeColor,
                        whiteSpace: 'nowrap',
                        marginLeft: 'auto',
                        flexShrink: 0
                      }}
                    >
                      <span>Sign In</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '0.65rem', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.45rem 0.75rem', borderRadius: '8px', fontSize: '0.72rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={15} style={{ color: '#059669', flexShrink: 0 }} />
            <span>
              <strong>Simplified &amp; Role-Focused:</strong> Irrelevant menus are hidden so each user sees only what they need to do their job.
            </span>
          </div>
        </div>

      </div>
    </div>
  </div>
);
};
