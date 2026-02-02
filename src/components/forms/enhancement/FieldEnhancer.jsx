import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Field Enhancer
 * Wrapper-Komponente für alle Feldverbesserungen
 * - Icons, Hints, Validation Feedback, Grouping
 */

export function FieldIcon({ icon: Icon, label }) {
  if (!Icon) return null;
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-600" />
      <span>{label}</span>
    </div>
  );
}

export function FieldHint({ text, important = false }) {
  if (!text) return null;
  return (
    <div className={`text-xs flex items-start gap-1 mt-1 ${
      important ? 'text-amber-600' : 'text-gray-500'
    }`}>
      {important && <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />}
      <span>{text}</span>
    </div>
  );
}

export function FieldImportance({ importance = 'optional' }) {
  const styles = {
    required: 'text-red-500 font-bold',
    recommended: 'text-amber-500 font-medium',
    optional: 'text-gray-400 text-xs'
  };

  const labels = {
    required: '* Erforderlich',
    recommended: '◆ Empfohlen',
    optional: '○ Optional'
  };

  return (
    <span className={styles[importance]}>
      {labels[importance]}
    </span>
  );
}

export function FieldGroup({ title, icon: Icon, children, collapsed = false }) {
  const [isCollapsed, setIsCollapsed] = React.useState(collapsed);

  return (
    <div className="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-4 space-y-4">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-2 font-semibold text-blue-900 hover:text-blue-700"
      >
        {Icon && <Icon className="w-5 h-5" />}
        {title}
        <span className="ml-auto text-sm">
          {isCollapsed ? '▶' : '▼'}
        </span>
      </button>

      {!isCollapsed && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

export function FieldState({ state = 'idle', message = '' }) {
  const styles = {
    idle: 'bg-gray-50 border-gray-200',
    loading: 'bg-blue-50 border-blue-200',
    valid: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200'
  };

  const textStyles = {
    idle: 'text-gray-700',
    loading: 'text-blue-700',
    valid: 'text-green-700',
    error: 'text-red-700',
    warning: 'text-yellow-700'
  };

  if (!message) return null;

  return (
    <div className={`p-2 rounded border ${styles[state]}`}>
      <p className={`text-sm ${textStyles[state]}`}>{message}</p>
    </div>
  );
}

export function RequiredIndicator({ required = false, show = true }) {
  if (!show || !required) return null;
  return (
    <span className="text-red-500 font-bold ml-1" title="Erforderlich">
      *
    </span>
  );
}

export function FieldWrapper({
  label,
  required,
  hint,
  importance,
  icon,
  children,
  error,
  validation,
  grouped = false,
  groupTitle
}) {
  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          {icon && React.cloneElement(icon, { className: 'w-4 h-4 text-gray-600' })}
          {label}
          <RequiredIndicator required={required} />
        </label>
        {importance && <FieldImportance importance={importance} />}
      </div>

      {/* Input */}
      <div className="relative">
        {children}
      </div>

      {/* Error */}
      {error && (
        <FieldState state="error" message={error} />
      )}

      {/* Hint */}
      {hint && (
        <FieldHint text={hint} important={importance === 'recommended'} />
      )}

      {/* Validation */}
      {validation && !error && (
        <FieldState state="valid" message={validation} />
      )}
    </div>
  );
}

export default FieldWrapper;