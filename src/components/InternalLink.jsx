import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function InternalLink({ 
  to, 
  children, 
  className = '',
  ...props 
}) {
  return (
    <Link 
      to={createPageUrl(to)}
      className={className}
      {...props}
    >
      {children}
    </Link>
  );
}