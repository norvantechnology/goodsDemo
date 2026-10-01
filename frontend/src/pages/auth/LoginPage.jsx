import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getError } from '../../utils';
import toast from 'react-hot-toast';
import { Cpu } from 'lucide-react';

const demoUsers = [
  { label: 'Admin', email: 'admin@demo.com', password: 'admin123' },
  { label: 'Accountant', email: 'accountant@demo.com', password: 'account123' },
  { label: 'Warehouse A', email: 'wha@demo.com', password: 'wha123' },
  { label: 'Warehouse B', email: 'whb@demo.com', password: 'whb123' },
  { label: 'Warehouse C', email: 'whc@demo.com', password: 'whc123' },
  { label: 'Shop B', email: 'shopb@demo.com', password: 'shopb123' },
  { label: 'Shop C', email: 'shopc@demo.com', password: 'shopc123' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (u) => { setEmail(u.email); setPassword(u.password); };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Cpu size={26} />
          </div>
          <h1>GoodsDemo ERP</h1>
          <p>Electronic Goods Wholesale Management</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-box">{error}</div>}
          <div className="form-group">
            <label className="form-label required">Email</label>
            <input
              type="email" className="form-control" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Enter email"
            />
          </div>
          <div className="form-group">
            <label className="form-label required">Password</label>
            <input
              type="password" className="form-control" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          <button className="btn btn-primary w-100" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600 }}>QUICK LOGIN (Demo)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {demoUsers.map(u => (
              <button key={u.email} className="btn btn-secondary btn-sm" onClick={() => quickLogin(u)}>
                {u.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
