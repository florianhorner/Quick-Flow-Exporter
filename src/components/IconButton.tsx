import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  tone?: 'neutral' | 'danger' | 'purple' | 'ghost';
  size?: 'sm' | 'md';
};

const toneClasses = {
  neutral:
    'border border-slate-200 dark:border-midnight-700 bg-white/80 dark:bg-midnight-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-midnight-700',
  danger:
    'border border-transparent text-red-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
  purple:
    'border border-transparent text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/20',
  ghost:
    'border border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-midnight-700',
};

const sizeClasses = {
  sm: 'h-9 w-9',
  md: 'h-10 w-10',
};

export default function IconButton({
  icon: Icon,
  label,
  tone = 'ghost',
  size = 'sm',
  className = '',
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${toneClasses[tone]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}
