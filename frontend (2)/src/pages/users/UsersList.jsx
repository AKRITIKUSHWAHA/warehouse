import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { UserModal } from '../../components/modals/UserModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import {
  ShieldCheck,
  UserPlus,
  Shield,
  Check,
  X,
  Edit2,
  Trash2,
  Plus,
  Search,
  RotateCcw,
  Sparkles,
  Layers,
  FileText,
  Package,
  Ship,
  Settings,
  Activity,
  Users,
  Box,
  Anchor,
  FileSpreadsheet,
  Tag,
  ExternalLink,
  History,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';

const ROLE_DEFINITIONS = [
  {
    roleKey: 'super_admin',
    roleName: 'Super Admin',
    shortTitle: 'Admin',
    color: '#0A192F',
    badgeColor: '#0284C7',
    badgeBg: '#E0F2FE',
    desc: 'Full global system control, role permissions config & user administration',
    testUserId: 'USR-001'
  },
  {
    roleKey: 'operations',
    roleName: 'Operations Coordinator',
    shortTitle: 'Operations',
    color: '#0284C7',
    badgeColor: '#0284C7',
    badgeBg: '#E0F2FE',
    desc: 'Consolidations, ocean freight, cargo movement & tracking',
    testUserId: 'USR-005'
  },
  {
    roleKey: 'warehouse',
    roleName: 'Warehouse Staff',
    shortTitle: 'Warehouse',
    color: '#16A34A',
    badgeColor: '#16A34A',
    badgeBg: '#DCFCE7',
    desc: 'Cargo intake, dimension scanning, 4x6 labels & warehouse receipts',
    testUserId: 'USR-003'
  },
  {
    roleKey: 'documentation',
    roleName: 'Documentation Staff',
    shortTitle: 'Documentation',
    color: '#D97706',
    badgeColor: '#D97706',
    badgeBg: '#FEF3C7',
    desc: 'House B/L, Master B/L, Customs manifests & cargo hold release',
    testUserId: 'USR-002'
  },
  {
    roleKey: 'agent',
    roleName: 'Destination Agent',
    shortTitle: 'Agent',
    color: '#7C3AED',
    badgeColor: '#7C3AED',
    badgeBg: '#EDE9FE',
    desc: 'Dedicated port portal, shipment arrival & manifest download',
    testUserId: 'USR-004'
  }
];

const CATEGORY_META = {
  'Cargo & Intake': {
    title: 'Cargo & Intake Operations',
    icon: Package,
    color: '#0284C7',
    bg: '#F8FAFC',
    badgeBg: '#E0F2FE',
    badgeColor: '#0284C7',
    desc: 'Warehouse receipts, cargo staging, barcode scanning & customer directory'
  },
  'Logistics & Ocean': {
    title: 'Logistics & Ocean Freight',
    icon: Ship,
    color: '#0D9488',
    bg: '#F8FAFC',
    badgeBg: '#CCFBF1',
    badgeColor: '#0F766E',
    desc: 'Consolidation stuffing, ocean shipments, carrier B/Ls, manifests & tracking'
  },
  'System & Governance': {
    title: 'System & Governance',
    icon: ShieldCheck,
    color: '#4F46E5',
    bg: '#F8FAFC',
    badgeBg: '#EEF2FF',
    badgeColor: '#4338CA',
    desc: 'Shipment history archives, activity audit trail logs, users & system config'
  },
  'Operational Authorization': {
    title: 'Operational Authorizations',
    icon: Shield,
    color: '#D97706',
    bg: '#FFFDF5',
    badgeBg: '#FEF3C7',
    badgeColor: '#B45309',
    desc: 'Administrative authority to place or release B/L holds and clear releases'
  }
};

const ROLE_NAME_MAP = {
  super_admin: 'Super Admin',
  operations: 'Operations Coordinator',
  warehouse: 'Warehouse Staff',
  documentation: 'Documentation Staff',
  agent: 'Destination Agent'
};

const MODULE_ICONS = {
  dashboard: LayoutDashboard,
  customers: Users,
  'warehouse-receipts': Package,
  cargo: Box,
  documents: Tag,
  'house-bills': FileText,
  consolidations: Layers,
  shipments: Ship,
  'bills-of-lading': FileSpreadsheet,
  manifests: FileSpreadsheet,
  vessels: Anchor,
  tracking: Search,
  'agent-portal': ExternalLink,
  'hold-authorization': Shield,
  users: ShieldCheck,
  audit: Activity,
  history: History,
  settings: Settings
};

export const UsersList = ({ onNavigate }) => {
  const {
    usersList,
    currentUser,
    switchUser,
    isSuperAdmin,
    rolePermissionsMap,
    systemModules = [],
    toggleRoleModule,
    enableAllForRole,
    resetRoleToDefault,
    resetRolePermissions
  } = useAuth();
  const { createUser, updateUser, deleteUser } = useAppData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'matrix'
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Matrix Filter State
  const [matrixSearch, setMatrixSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const enrichedUsers = useMemo(() => {
    return (usersList || []).map(u => ({
      ...u,
      role: u.role || ROLE_NAME_MAP[u.roleKey] || (u.roleKey ? u.roleKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Staff Member')
    }));
  }, [usersList]);

  // Extract unique categories from system modules
  const categories = useMemo(() => {
    const set = new Set((systemModules || []).map(m => m.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [systemModules]);

  // Filter modules for Matrix display
  const filteredModules = useMemo(() => {
    return (systemModules || []).filter(mod => {
      const matchCat = selectedCategory === 'ALL' || mod.category === selectedCategory;
      const matchQuery = !matrixSearch.trim() ||
        mod.label.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        (mod.description && mod.description.toLowerCase().includes(matrixSearch.toLowerCase())) ||
        mod.id.toLowerCase().includes(matrixSearch.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [systemModules, selectedCategory, matrixSearch]);

  const handleToggle = async (roleKey, module) => {
    if (!isSuperAdmin) {
      showToast('Only Super Admin is authorized to edit role permissions.', 'warning', 'Permission Denied');
      return;
    }

    if (roleKey === 'super_admin' && (module.id === 'users' || module.id === 'settings')) {
      showToast('Super Admin access to Users & Settings is locked to prevent administrative lockout.', 'info', 'Protected Core Module');
      return;
    }

    const currentAllowed = (rolePermissionsMap?.[roleKey] || []).includes(module.id);
    await toggleRoleModule(roleKey, module.id);

    showToast(
      `${module.label} is now ${!currentAllowed ? 'VISIBLE' : 'HIDDEN'} for ${ROLE_NAME_MAP[roleKey] || roleKey}.`,
      !currentAllowed ? 'success' : 'info',
      !currentAllowed ? 'Menu Enabled' : 'Menu Disabled'
    );
  };

  const handleEnableAll = async (roleKey, roleName) => {
    if (!isSuperAdmin) return;
    if (enableAllForRole) {
      await enableAllForRole(roleKey);
      showToast(`All system menus are now visible and enabled for ${roleName}.`, 'success', 'All Menus Enabled');
    }
  };

  const handleResetRole = async (roleKey, roleName) => {
    if (!isSuperAdmin) return;
    if (resetRoleToDefault) {
      await resetRoleToDefault(roleKey);
      showToast(`Permissions for ${roleName} have been restored to operational defaults.`, 'info', 'Role Defaults Restored');
    }
  };

  const handleTestPersona = (roleKey, userId, roleName) => {
    switchUser(userId);
    showToast(`Switched persona to ${roleName}. Notice how the sidebar navigation adapts to this role!`, 'info', 'Persona Preview Active');
    if (roleKey === 'agent') {
      if (onNavigate) onNavigate('agent-dashboard');
    } else {
      if (onNavigate) onNavigate('dashboard');
    }
  };

  const handleResetDefaults = async () => {
    if (!isSuperAdmin) return;
    await resetRolePermissions();
    setShowResetConfirm(false);
    showToast('Role permissions have been restored to initial system defaults.', 'success', 'Defaults Restored');
  };

  const userColumns = [
    {
      header: 'Staff Member',
      accessor: 'name',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: item.roleKey === 'agent' ? '#D97706' : '#0A192F',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.75rem'
          }}>
            {item.avatar || (item.name ? item.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U')}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#0A192F' }}>{item.name}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Assigned Role',
      accessor: 'role',
      render: (item) => (
        <span style={{ fontWeight: 600, color: '#0284C7' }}>
          {item.role || ROLE_NAME_MAP[item.roleKey] || item.roleKey || 'Staff Member'}
        </span>
      )
    },
    {
      header: 'Department / Facility',
      accessor: 'department',
      render: (item) => (
        <span style={{ fontSize: '0.8rem', color: '#334155' }}>{item.department}</span>
      )
    },
    {
      header: 'Last Login',
      accessor: 'lastLogin',
      render: (item) => (
        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{item.lastLogin || 'Recent'}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (item) => <StatusBadge status={item.status || 'Active'} />
    },
    {
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              switchUser(item.id);
              if (item.roleKey === 'agent') onNavigate('agent-dashboard');
              else onNavigate('dashboard');
            }}
            className="btn btn-sm btn-outline"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.45rem' }}
            title="Log in / switch to this persona"
          >
            <span>Switch</span>
          </button>
          <button
            onClick={() => setEditingUser(item)}
            className="btn btn-sm btn-secondary"
            title="Edit User Profile"
            style={{ padding: '0.25rem 0.45rem' }}
          >
            <Edit2 size={13} />
            <span className="hide-mobile">Edit</span>
          </button>
          <button
            onClick={() => setDeletingUser(item)}
            className="btn btn-sm btn-ghost"
            title="Delete User Account"
            style={{ padding: '0.25rem 0.45rem', color: '#EF4444' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PageHeader
        title="Users, Roles &amp; Permissions Matrix"
        subtitle="Manage administrative accounts, role permissions, and customize menu visibility across the operational workflow."
        icon={ShieldCheck}
        breadcrumbs={[
          { label: 'Management', href: '#' },
          { label: 'Users & Roles' }
        ]}
        actions={
          activeTab === 'users' ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary btn-sm"
            >
              <UserPlus size={15} />
              <span>Add Staff Account</span>
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isSuperAdmin && (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="btn btn-secondary btn-sm"
                  title="Reset all role menu permissions to standard defaults"
                >
                  <RotateCcw size={14} />
                  <span>Reset Defaults</span>
                </button>
              )}
            </div>
          )
        }
      />

      <div className="tabs-container">
        <button
          onClick={() => setActiveTab('users')}
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
        >
          <span>Staff &amp; User Accounts ({enrichedUsers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
        >
          <span>Role Permissions Matrix</span>
        </button>
      </div>

      {activeTab === 'users' ? (
        <ResponsiveTable
          columns={userColumns}
          data={enrichedUsers}
          searchPlaceholder="Search staff member, role, email..."
          pageSize={6}
        />
      ) : (
        /* Dynamic Granular Permissions Matrix */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Persona Testing Indicator Banner (if switched to another role) */}
          {currentUser?.roleKey !== 'super_admin' && (
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FCD34D',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <UserCheck size={18} style={{ color: '#D97706' }} />
                <span style={{ fontSize: '0.82rem', color: '#92400E', fontWeight: 600 }}>
                  You are currently previewing as <strong>{currentUser?.name} ({ROLE_NAME_MAP[currentUser?.roleKey] || currentUser?.roleKey})</strong>.
                </span>
              </div>
              <button
                onClick={() => {
                  switchUser('USR-001');
                  showToast('Returned to Super Admin (Marcus Vance).', 'success', 'Admin Session Restored');
                }}
                className="btn btn-sm btn-primary"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
              >
                Return to Super Admin
              </button>
            </div>
          )}

          {/* Admin Access Status Bar */}
          <div style={{
            background: isSuperAdmin ? '#F0FDF4' : '#FFFBEB',
            border: isSuperAdmin ? '1px solid #BBF7D0' : '1px solid #FDE68A',
            borderRadius: '8px',
            padding: '0.65rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.65rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isSuperAdmin ? (
                <Unlock size={15} style={{ color: '#16A34A' }} />
              ) : (
                <Lock size={15} style={{ color: '#D97706' }} />
              )}
              <span style={{ fontSize: '0.78rem', color: isSuperAdmin ? '#166534' : '#92400E', fontWeight: 600 }}>
                {isSuperAdmin
                  ? 'Role Permissions Matrix: Toggle any menu button to show or hide it for that role. Changes sync live to the sidebar.'
                  : 'Role Permissions Matrix (Read-Only Mode): Only Super Admin can change role permissions.'}
              </span>
            </div>

            {isSuperAdmin && (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}
                title="Reset all role menu permissions to standard defaults"
              >
                <RotateCcw size={12} />
                <span>Reset Defaults</span>
              </button>
            )}
          </div>

          {/* Matrix Filter & Search Bar */}
          <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginRight: '0.2rem' }}>Filter Category:</span>
              {categories.map(cat => {
                const count = cat === 'ALL'
                  ? (systemModules || []).length
                  : (systemModules || []).filter(m => m.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.65rem', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <span>{cat === 'ALL' ? 'All Menus' : cat}</span>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '0.05rem 0.35rem',
                      borderRadius: '999px',
                      background: selectedCategory === cat ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                      color: selectedCategory === cat ? '#FFFFFF' : '#475569'
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ position: 'relative', minWidth: '260px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search menu or module (e.g. bills, receipts)..."
                value={matrixSearch}
                onChange={(e) => setMatrixSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.35rem 1.8rem 0.35rem 2rem',
                  fontSize: '0.78rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC'
                }}
              />
              {matrixSearch && (
                <button
                  onClick={() => setMatrixSearch('')}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: 0
                  }}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Interactive Role Permissions Table */}
          <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
            <table className="data-table" style={{ fontSize: '0.8rem', margin: 0, width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  <th style={{
                    width: '32%',
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    position: 'sticky',
                    left: 0,
                    background: '#F8FAFC',
                    zIndex: 2,
                    boxShadow: '2px 0 4px rgba(0,0,0,0.03)'
                  }}>
                    <span style={{ fontWeight: 800, color: '#0A192F', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Menu / Module
                    </span>
                  </th>

                  {ROLE_DEFINITIONS.map(r => {
                    const activeCount = (rolePermissionsMap?.[r.roleKey] || []).length;
                    return (
                      <th
                        key={r.roleKey}
                        style={{
                          textAlign: 'center',
                          padding: '0.65rem 0.5rem',
                          minWidth: '140px',
                          verticalAlign: 'middle',
                          borderLeft: '1px solid #F1F5F9'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontWeight: 700,
                            color: '#0A192F',
                            fontSize: '0.8rem'
                          }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: r.color }} />
                            {r.roleName}
                          </div>

                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: 600,
                            color: r.badgeColor,
                            background: r.badgeBg,
                            padding: '0.1rem 0.45rem',
                            borderRadius: '999px'
                          }}>
                            {activeCount} of {(systemModules || []).length} Visible
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredModules.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748B' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <Search size={24} style={{ color: '#94A3B8' }} />
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>No modules match "{matrixSearch}"</div>
                        <div style={{ fontSize: '0.75rem' }}>Try clearing the search or choosing "All Menus".</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const categoryOrder = [
                      'Cargo & Intake',
                      'Logistics & Ocean',
                      'System & Governance',
                      'Operational Authorization'
                    ];

                    const renderRow = (mod, idx) => {
                      const Icon = MODULE_ICONS[mod.id] || Box;
                      const isSpecialHold = mod.id === 'hold-authorization';

                      return (
                        <tr
                          key={mod.id}
                          style={{
                            background: isSpecialHold ? '#FFFDF5' : (idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'),
                            borderBottom: '1px solid #E2E8F0',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <td style={{
                            padding: '0.75rem 1.15rem',
                            position: 'sticky',
                            left: 0,
                            background: isSpecialHold ? '#FFFDF5' : (idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'),
                            zIndex: 1,
                            boxShadow: '2px 0 4px rgba(0,0,0,0.03)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                              <div style={{
                                marginTop: '2px',
                                padding: '6px',
                                borderRadius: '8px',
                                background: isSpecialHold ? '#FEF3C7' : '#EFF6FF',
                                color: isSpecialHold ? '#D97706' : '#0284C7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <Icon size={16} />
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                  <span style={{ color: isSpecialHold ? '#92400E' : '#0A192F', fontWeight: 800, fontSize: '0.84rem' }}>
                                    {mod.label}
                                  </span>
                                  {mod.category && (
                                    <span style={{
                                      fontSize: '0.62rem',
                                      color: '#475569',
                                      background: '#E2E8F0',
                                      padding: '0.1rem 0.4rem',
                                      borderRadius: '4px',
                                      fontWeight: 600
                                    }}>
                                      {mod.category}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.2rem', lineHeight: 1.35 }}>
                                  {mod.description}
                                </div>
                              </div>
                            </div>
                          </td>

                          {ROLE_DEFINITIONS.map(role => {
                            const isAllowed = (rolePermissionsMap?.[role.roleKey] || []).includes(mod.id);
                            const isLockedAdminCore = role.roleKey === 'super_admin' && (mod.id === 'users' || mod.id === 'settings');

                            return (
                              <td
                                key={role.roleKey}
                                style={{
                                  textAlign: 'center',
                                  padding: '0.55rem 0.65rem',
                                  verticalAlign: 'middle',
                                  borderLeft: '1px solid #F1F5F9'
                                }}
                              >
                                {isLockedAdminCore ? (
                                  <div
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '0.35rem 0.75rem',
                                      borderRadius: '20px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      background: '#EFF6FF',
                                      border: '1px solid #BFDBFE',
                                      color: '#1D4ED8',
                                      cursor: 'not-allowed'
                                    }}
                                    title="Super Admin core module is locked to maintain administrative access."
                                  >
                                    <Lock size={12} />
                                    <span>Admin Locked</span>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleToggle(role.roleKey, mod)}
                                    disabled={!isSuperAdmin}
                                    title={
                                      !isSuperAdmin
                                        ? 'Super Admin access required to change permissions'
                                        : isAllowed
                                          ? `Click to Hide '${mod.label}' for ${role.roleName}`
                                          : `Click to Show '${mod.label}' for ${role.roleName}`
                                    }
                                    style={{
                                      border: isAllowed ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                                      background: isAllowed ? '#ECFDF5' : '#F1F5F9',
                                      color: isAllowed ? '#065F46' : '#64748B',
                                      padding: '0.35rem 0.75rem',
                                      borderRadius: '20px',
                                      cursor: isSuperAdmin ? 'pointer' : 'default',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '6px',
                                      minWidth: '92px',
                                      fontSize: '0.74rem',
                                      fontWeight: 700,
                                      transition: 'all 0.15s ease',
                                      boxShadow: isAllowed ? '0 1px 2px rgba(16, 185, 129, 0.1)' : 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (isSuperAdmin) {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = isAllowed
                                          ? '0 3px 6px rgba(16, 185, 129, 0.2)'
                                          : '0 2px 4px rgba(0,0,0,0.06)';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (isSuperAdmin) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = isAllowed ? '0 1px 2px rgba(16, 185, 129, 0.1)' : 'none';
                                      }
                                    }}
                                  >
                                    {isAllowed ? (
                                      <>
                                        <Check size={14} style={{ strokeWidth: 3, color: '#10B981' }} />
                                        <span>Visible</span>
                                      </>
                                    ) : (
                                      <>
                                        <EyeOff size={13} style={{ color: '#94A3B8' }} />
                                        <span style={{ color: '#64748B' }}>Hidden</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    };

                    if (selectedCategory !== 'ALL' || matrixSearch.trim()) {
                      return filteredModules.map((mod, idx) => renderRow(mod, idx));
                    }

                    return categoryOrder.map(catKey => {
                      const catMods = filteredModules.filter(m => m.category === catKey);
                      if (catMods.length === 0) return null;
                      const meta = CATEGORY_META[catKey] || {
                        title: catKey,
                        icon: Box,
                        color: '#64748B',
                        bg: '#F8FAFC',
                        badgeBg: '#E2E8F0',
                        badgeColor: '#475569',
                        desc: ''
                      };
                      const CatIcon = meta.icon;

                      return (
                        <React.Fragment key={`cat-grp-${catKey}`}>
                          <tr style={{ background: meta.bg, borderTop: '2px solid #E2E8F0', borderBottom: '1px solid #CBD5E1' }}>
                            <td colSpan={6} style={{ padding: '0.65rem 1.15rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                  <div style={{ color: meta.color, display: 'flex', alignItems: 'center' }}>
                                    <CatIcon size={16} />
                                  </div>
                                  <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0A192F', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    {meta.title}
                                  </span>
                                  <span style={{
                                    fontSize: '0.67rem',
                                    fontWeight: 700,
                                    color: meta.badgeColor,
                                    background: meta.badgeBg,
                                    padding: '0.1rem 0.5rem',
                                    borderRadius: '999px'
                                  }}>
                                    {catMods.length} Modules
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                  {meta.desc}
                                </span>
                              </div>
                            </td>
                          </tr>
                          {catMods.map((mod, idx) => renderRow(mod, idx))}
                        </React.Fragment>
                      );
                    });
                  })()
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <UserModal
        isOpen={showAddModal}
        isEdit={false}
        onClose={() => setShowAddModal(false)}
        onSave={async (newUserData) => {
          await createUser(newUserData);
        }}
      />

      {/* Edit User Modal */}
      <UserModal
        isOpen={!!editingUser}
        user={editingUser}
        isEdit={true}
        onClose={() => setEditingUser(null)}
        onSave={async (updates) => {
          await updateUser(editingUser.id, updates);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        itemName={deletingUser?.name}
        itemType="User Account"
        onConfirm={async () => {
          await deleteUser(deletingUser.id);
        }}
      />

      {/* Reset Defaults Confirmation Modal */}
      {showResetConfirm && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 25, 47, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '1.5rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: '#FEF2F2', padding: '10px', borderRadius: '50%', color: '#EF4444' }}>
                <RotateCcw size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0A192F' }}>Reset Role Permissions?</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                  This will restore menu visibility and access permissions for all 5 roles to standard operational defaults.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleResetDefaults}
                style={{ background: '#0284C7', borderColor: '#0284C7' }}
              >
                Confirm &amp; Restore Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
