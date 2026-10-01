// Reusable UI Components
import { statusClass } from '../utils';
import { Inbox, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';

// Loading State
export const Loading = ({ text = 'Loading...' }) => (
  <div className="loading-state">
    <div className="spinner" />
    <div className="fs-13 text-muted">{text}</div>
  </div>
);

// Empty State
export const EmptyState = ({ icon, title = 'No data found', description = '', action }) => {
  const renderIcon = () => {
    if (!icon) return <Inbox size={26} />;
    if (typeof icon === 'string') return <span>{icon}</span>;
    return icon;
  };
  return (
    <div className="empty-state">
      <div className="empty-icon">{renderIcon()}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
};

// Error State
export const ErrorState = ({ message, onRetry }) => (
  <div className="error-state">
    <div className="empty-icon"><AlertCircle size={26} color="var(--danger)" /></div>
    <p>{message || 'Something went wrong'}</p>
    {onRetry && <button className="btn btn-secondary btn-sm mt-2" onClick={onRetry}>Retry</button>}
  </div>
);

// Modal Component
export const Modal = ({ isOpen, onClose, title, children, size = '' }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size}`}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Confirm Dialog
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h3>{title || 'Confirm Action'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <p className="text-muted fs-13">{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose(); }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Badge
export const Badge = ({ className, children }) => (
  <span className={`badge ${className || ''}`}>{children}</span>
);

// Card
export const Card = ({ children, className = '', style }) => (
  <div className={`card ${className}`} style={style}>{children}</div>
);

// Table wrapper
export const TableWrapper = ({ children, className = '', minWidth }) => (
  <div className={`table-container ${className}`}>
    <div className="table-scroll-hint">
      <span>⇄ Swipe table horizontally to see full columns</span>
    </div>
    <div className="table-wrapper">
      <table style={minWidth ? { minWidth } : undefined}>{children}</table>
    </div>
  </div>
);

// Pagination
export const Pagination = ({ page, total, limit, onPageChange }) => {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1);
  return (
    <div className="pagination">
      <button className="page-btn" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
        <ChevronLeft size={14} />
      </button>
      {pages.map(p => (
        <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
      ))}
      <button className="page-btn" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        <ChevronRight size={14} />
      </button>
      <span className="text-muted fs-12" style={{ marginLeft: 8 }}>
        {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </span>
    </div>
  );
};

// Form Group
export const FormGroup = ({ label, required, children, className = '' }) => (
  <div className={`form-group ${className}`}>
    {label && <label className={`form-label ${required ? 'required' : ''}`}>{label}</label>}
    {children}
  </div>
);

// Select
export const Select = ({ value, onChange, options, placeholder, className = '', ...rest }) => (
  <select className={`form-select ${className}`} value={value} onChange={onChange} {...rest}>
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(o => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

// Status badge helper
export const StatusBadge = ({ status }) => {
  const labels = {
    active: 'Active', inactive: 'Inactive', pending: 'Pending', approved: 'Approved',
    completed: 'Completed', cancelled: 'Cancelled', received: 'Received', ordered: 'Ordered',
    partially_received: 'Partial', paid: 'Paid', partial: 'Partial', unpaid: 'Unpaid',
    credit: 'Credit', in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock'
  };
  return <span className={`badge ${statusClass(status)}`}>{labels[status] || status}</span>;
};
