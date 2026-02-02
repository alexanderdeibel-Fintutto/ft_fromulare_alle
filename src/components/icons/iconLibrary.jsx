/**
 * Custom Icon Library
 * Centralized icon mapping for consistent usage
 */

import {
  Home, Settings, Users, BarChart3, FileText, Bell, Search,
  Menu, X, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, Info, AlertTriangle, Clock,
  Download, Upload, Share2, Copy, Trash2, Edit2, Eye, EyeOff,
  Plus, Minus, MoreHorizontal, MoreVertical, Filter, ArrowUpDown,
  Calendar, Mail, Phone, MapPin, Link, ExternalLink,
  Moon, Sun, LogOut, LogIn, Lock, Unlock, Shield,
  Zap, Wifi, WifiOff, ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  Loader, Loader2, RefreshCw, Save, Inbox, Send
} from 'lucide-react';

export const Icons = {
  // Navigation
  home: Home,
  settings: Settings,
  users: Users,
  charts: BarChart3,
  documents: FileText,
  notifications: Bell,
  search: Search,
  menu: Menu,
  close: X,
  
  // Navigation Arrows
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  
  // Status
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader,
  spinner: Loader2,
  clock: Clock,
  
  // Actions
  download: Download,
  upload: Upload,
  share: Share2,
  copy: Copy,
  delete: Trash2,
  edit: Edit2,
  view: Eye,
  hide: EyeOff,
  add: Plus,
  remove: Minus,
  more: MoreHorizontal,
  moreVertical: MoreVertical,
  
  // Filters & Sort
  filter: Filter,
  sort: ArrowUpDown,
  
  // Contact
  calendar: Calendar,
  email: Mail,
  phone: Phone,
  location: MapPin,
  link: Link,
  externalLink: ExternalLink,
  
  // Theme
  moon: Moon,
  sun: Sun,
  
  // Auth
  logout: LogOut,
  login: LogIn,
  lock: Lock,
  unlock: Unlock,
  shield: Shield,
  
  // Utility
  zap: Zap,
  wifi: Wifi,
  wifiOff: WifiOff,
  refresh: RefreshCw,
  save: Save,
  inbox: Inbox,
  send: Send
};

/**
 * Get icon by key
 * @param {string} key - Icon key
 * @param {object} props - Props to pass to icon
 */
export function getIcon(key, props = {}) {
  const IconComponent = Icons[key];
  
  if (!IconComponent) {
    console.warn(`Icon "${key}" not found in library`);
    return null;
  }
  
  return <IconComponent {...props} />;
}

/**
 * Custom icon component wrapper
 */
export function Icon({ name, size = 'md', className = '' }) {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const IconComponent = Icons[name];
  
  if (!IconComponent) {
    return null;
  }
  
  return (
    <IconComponent className={`${sizeMap[size]} ${className}`} />
  );
}

export default Icons;