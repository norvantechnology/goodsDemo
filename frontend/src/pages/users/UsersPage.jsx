import { useState, useEffect } from 'react';
import { settingsService } from '../../services';
import { Loading, EmptyState, TableWrapper, Modal } from '../../components';
import { fmtDate, getError, roleLabel } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, ShieldCheck, Edit2, Trash2, X } from 'lucide-react';

const INITIAL_USER = { name: '', email: '', password: '', role: 'warehouse_user', locationIds: [], permissions: {} };

const rolePermissions = {
  admin: { view: true, create: true, edit: true, delete: true, approve: true, transfer: true, sell: true, purchase: true, reports: true, accounting: true, allowExceptionTransfer: true },
  accountant: { view: true, create: true, edit: true, delete: false, approve: true, transfer: false, sell: false, purchase: true, reports: true, accounting: true, allowExceptionTransfer: false },
  warehouse_user: { view: true, create: true, edit: true, delete: false, approve: false, transfer: true, sell: false, purchase: true, reports: true, accounting: false, allowExceptionTransfer: false },
  shop_user: { view: true, create: true, edit: false, delete: false, approve: false, transfer: false, sell: true, purchase: false, reports: true, accounting: false, allowExceptionTransfer: false }
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(INITIAL_USER);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await settingsService.getUsers();
      setUsers(res.data.data);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchUsers();
    settingsService.getLocations().then(r => setLocations(r.data.data));
  }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm({ ...INITIAL_USER, permissions: rolePermissions['warehouse_user'] });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ ...u, password: '', locationIds: u.locationIds?.map(l => l._id || l) || [] });
    setShowModal(true);
  };

  const handleRoleChange = (role) => {
    setForm(f => ({ ...f, role, permissions: rolePermissions[role] || {} }));
  };

  const toggleLocation = (locId) => {
    setForm(f => {
      const ids = f.locationIds.includes(locId) ? f.locationIds.filter(id => id !== locId) : [...f.locationIds, locId];
      return { ...f, locationIds: ids };
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('Name and email are required');
    if (!editUser && !form.password) return toast.error('Password is required for new user');
    setSaving(true);
    try {
      if (editUser) {
        await settingsService.updateUser(editUser._id, form);
        toast.success('User updated');
      } else {
        await settingsService.createUser(form);
        toast.success('User created');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await settingsService.deleteUser(id);
      toast.success('User deactivated');
      fetchUsers();
    } catch (err) { toast.error(getError(err)); }
  };

  const roleColors = { admin: 'badge-danger', accountant: 'badge-info', warehouse_user: 'badge-purple', shop_user: 'badge-cyan' };

  return (
    <div>
      <div className="page-header">
        <h1>Users & Permissions</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={14} /> Add User
        </button>
      </div>

      <div className="card">
        {loading ? <Loading /> : users.length === 0 ? (
          <EmptyState icon={<ShieldCheck size={26} />} title="No users" />
        ) : (
          <TableWrapper minWidth="800px">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th className="th-center">Role</th>
                <th>Locations</th>
                <th className="th-center">Status</th>
                <th>Created</th>
                <th className="th-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0, color: '#ffffff' }}>
                        {u.name?.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{u.name}</span>
                      {u._id === currentUser?._id && <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>You</span>}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td className="td-center"><span className={`badge ${roleColors[u.role] || 'badge-gray'}`}>{roleLabel(u.role)}</span></td>
                  <td>
                    {u.locationIds?.length > 0 ? (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {u.locationIds.map(l => (
                          <span key={l._id} className="badge badge-gray" style={{ fontSize: '0.65rem' }}>{l.name}</span>
                        ))}
                      </div>
                    ) : <span className="text-muted fs-12">All Locations</span>}
                  </td>
                  <td className="td-center"><span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{u.status}</span></td>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{fmtDate(u.createdAt)}</td>
                  <td className="td-center">
                    <div className="table-actions">
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(u)} title="Edit User">
                        <Edit2 size={14} />
                      </button>
                      {u._id !== currentUser?._id && (
                        <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleDelete(u._id)} title="Deactivate User">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        )}
      </div>

      {/* User Form Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editUser ? 'Edit User' : 'New User'} size="modal-lg">
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Full Name</label>
              <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label required">Email</label>
              <input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" style={!editUser ? { fontWeight: 600 } : {}}>{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input type="password" className="form-control" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={editUser ? 'Leave blank to keep current' : 'Enter password'} />
            </div>
            <div className="form-group">
              <label className="form-label required">Role</label>
              <select className="form-select" value={form.role} onChange={e => handleRoleChange(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="accountant">Accountant</option>
                <option value="warehouse_user">Warehouse User</option>
                <option value="shop_user">Shop User</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Locations</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 0' }}>
              {locations.map(l => {
                const selected = form.locationIds.includes(l._id);
                return (
                  <label
                    key={l._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      padding: '5px 12px',
                      background: selected ? 'var(--primary)' : 'var(--bg-card)',
                      border: `1px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      fontSize: '0.82rem',
                      color: selected ? '#ffffff' : 'var(--text)',
                      fontWeight: selected ? 600 : 500,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input type="checkbox" checked={selected} onChange={() => toggleLocation(l._id)} style={{ display: 'none' }} />
                    {l.name}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Permissions</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 0' }}>
              {Object.entries(form.permissions || {}).map(([key, val]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '5px 12px', background: val ? 'var(--primary-light)' : 'var(--bg)', border: `1px solid ${val ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius)', fontSize: '0.78rem', color: val ? 'var(--primary-dark)' : 'var(--text-muted)', fontWeight: val ? 600 : 400, transition: 'all 0.15s ease' }}>
                  <input type="checkbox" checked={!!val} onChange={e => setForm(f => ({ ...f, permissions: { ...f.permissions, [key]: e.target.checked } }))} />
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save User'}</button>
        </div>
      </Modal>
    </div>
  );
}
