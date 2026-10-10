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
  AlertCircle
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
    desc: 'Full global system control, role permissions config & user administration'
  },
  {
    roleKey: 'operations',
    roleName: 'Operations Coordinator',
    shortTitle: 'Operations',
    color: '#0284C7',
    badgeColor: '#0EA5E9',
    desc: 'Consolidations, ocean voyages, cargo movement & tracking'
  },
  {
    roleKey: 'warehouse',
    roleName: 'Warehouse Staff',
    shortTitle: 'Warehouse',
    color: '#16A34A',
    badgeColor: '#22C55E',
    desc: 'Cargo intake, dimension scanning, 4x6 labels & warehouse receipts'
  },
  {
    roleKey: 'documentation',
    roleName: 'Documentation Staff',
    shortTitle: 'Documentation',
    color: '#D97706',
    badgeColor: '#F59E0B',
    desc: 'House B/L, Master B/L, Customs manifests & cargo hold release'
  },
  {
    roleKey: 'agent',
    roleName: 'Destination Agent',
    shortTitle: 'Agent',
    color: '#7C3AED',
    badgeColor: '#8B5CF6',
    desc: 'Dedicated port portal, container arrival & manifest download'
  }
];

const ROLE_NAME_MAP = {
  super_admin: 'Super Admin',
  operations: 'Operations Coordinator',
  warehouse: 'Warehouse Staff',
  documentation: 'Documentation Staff',
  agent: 'Destination Agent'
};

const MODULE_ICONS = {
  dashboard: Box,
  customers: Users,
  'warehouse-receipts': Package,
  cargo: Box,
  documents: Tag,
  'house-bills': FileText,
  consolidations: Layers,
  shipments: Ship,
  'bills-of-lading': FileText,
  manifests: FileSpreadsheet,
  containers: Box,
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
      showToast('Super Admin access to Users & Settings is required to prevent lockout.', 'info', 'Protected Core Module');
      return;
    }

    const currentAllowed = (rolePermissionsMap?.[roleKey] || []).includes(module.id);
    await toggleRoleModule(roleKey, module.id);

    showToast(
      `${module.label} ${!currentAllowed ? 'enabled' : 'disabled'} for ${ROLE_NAME_MAP[roleKey] || roleKey}.`,
      !currentAllowed ? 'success' : 'info',
      'Permissions Updated'
    );
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
          {/* Admin Access Status Banner */}
          <div style={{
            background: isSuperAdmin ? 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)' : '#FFFBEB',
            border: isSuperAdmin ? '1px solid #BBF7D0' : '1px solid #FDE68A',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {isSuperAdmin ? (
                <div style={{ background: '#16A34A', color: '#FFFFFF', padding: '5px', borderRadius: '50%' }}>
                  <Unlock size={16} />
                </div>
              ) : (
                <div style={{ background: '#D97706', color: '#FFFFFF', padding: '5px', borderRadius: '50%' }}>
                  <Lock size={16} />
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSuperAdmin ? '#166534' : '#92400E' }}>
                  {isSuperAdmin ? 'Admin Access Active: Interactive Role Permissions & Menu Visibility' : 'Read-Only Mode: Role Permissions Matrix'}
                </div>
                <div style={{ fontSize: '0.75rem', color: isSuperAdmin ? '#15803D' : '#B45309' }}>
                  {isSuperAdmin
                    ? 'Click any toggle cell to instantly grant or revoke sidebar menu access and functional module permissions for each role.'
                    : 'Only Super Admin can edit role menu visibility and operational permissions.'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#166534',
                background: '#DCFCE7',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <CheckCircle2 size={12} />
                Live Auto-Synced
              </span>
            </div>
          </div>

          {/* Matrix Filter & Search Bar */}
          <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginRight: '0.25rem' }}>Filter Category:</span>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', borderRadius: '20px' }}
                >
                  {cat === 'ALL' ? 'All Modules' : cat}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search menu or module..."
                value={matrixSearch}
                onChange={(e) => setMatrixSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.35rem 0.65rem 0.35rem 2rem',
                  fontSize: '0.78rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC'
                }}
              />
            </div>
          </div>

          {/* Interactive Role Permissions Table */}
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table" style={{ fontSize: '0.8rem', margin: 0 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  <th style={{ width: '30%', padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 800, color: '#0A192F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Functional Module / Menu
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 400 }}>
                      Showing {filteredModules.length} configurable items
                    </div>
                  </th>
                  {ROLE_DEFINITIONS.map(r => {
                    const activeCount = (rolePermissionsMap?.[r.roleKey] || []).length;
                    return (
                      <th key={r.roleKey} style={{ textAlign: 'center', padding: '0.85rem 0.65rem', minWidth: '130px' }}>
                        <div style={{ fontWeight: 700, color: '#0A192F', fontSize: '0.82rem' }}>{r.roleName}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '0.2rem' }}>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: r.badgeColor,
                            background: 'rgba(2, 132, 199, 0.08)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px'
                          }}>
                            {activeCount} Allowed
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredModules.map((mod, idx) => {
                  const Icon = MODULE_ICONS[mod.id] || Box;
                  const isSpecialHold = mod.id === 'hold-authorization';

                  return (
                    <tr
                      key={mod.id}
                      style={{
                        background: isSpecialHold ? '#FFFBEB' : (idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'),
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                          <div style={{
                            marginTop: '2px',
                            padding: '5px',
                            borderRadius: '6px',
                            background: isSpecialHold ? '#FEF3C7' : '#EFF6FF',
                            color: isSpecialHold ? '#D97706' : '#0284C7'
                          }}>
                            <Icon size={14} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <strong style={{ color: isSpecialHold ? '#92400E' : '#0A192F', fontSize: '0.82rem' }}>
                                {mod.label}
                              </strong>
                              {mod.category && (
                                <span style={{
                                  fontSize: '0.62rem',
                                  color: '#64748B',
                                  background: '#E2E8F0',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '3px',
                                  fontWeight: 600
                                }}>
                                  {mod.category}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.15rem', lineHeight: 1.3 }}>
                              {mod.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      {ROLE_DEFINITIONS.map(role => {
                        const isAllowed = (rolePermissionsMap?.[role.roleKey] || []).includes(mod.id);
                        const isLockedAdminCore = role.roleKey === 'super_admin' && (mod.id === 'users' || mod.id === 'settings');

                        return (
                          <td key={role.roleKey} style={{ textAlign: 'center', padding: '0.5rem 0.65rem' }}>
                            <button
                              onClick={() => handleToggle(role.roleKey, mod)}
                              disabled={!isSuperAdmin || isLockedAdminCore}
                              title={
                                isLockedAdminCore
                                  ? 'Super Admin core module is locked to maintain administrative access.'
                                  : isSuperAdmin
                                    ? `Click to ${isAllowed ? 'revoke' : 'grant'} ${mod.label} for ${role.roleName}`
                                    : 'Super Admin access required to change permissions'
                              }
                              style={{
                                border: isAllowed ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                                background: isAllowed ? '#F0FDF4' : '#F1F5F9',
                                color: isAllowed ? '#16A34A' : '#94A3B8',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                cursor: isSuperAdmin && !isLockedAdminCore ? 'pointer' : 'default',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                minWidth: '85px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                transition: 'all 0.15s ease',
                                boxShadow: isAllowed ? '0 1px 2px rgba(22, 163, 74, 0.1)' : 'none'
                              }}
                              onMouseEnter={(e) => {
                                if (isSuperAdmin && !isLockedAdminCore) {
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                  e.currentTarget.style.borderColor = isAllowed ? '#22C55E' : '#CBD5E1';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.borderColor = isAllowed ? '#86EFAC' : '#E2E8F0';
                              }}
                            >
                              {isAllowed ? (
                                <>
                                  <Check size={14} style={{ strokeWidth: 3 }} />
                                  <span>Enabled</span>
                                </>
                              ) : (
                                <>
                                  <X size={14} style={{ strokeWidth: 2 }} />
                                  <span style={{ color: '#94A3B8' }}>Hidden</span>
                                </>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
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
