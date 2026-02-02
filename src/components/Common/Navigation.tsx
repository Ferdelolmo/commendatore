import { useTranslation } from 'react-i18next';
import { TaskDay } from '@/types';
import { cn } from '@/lib/utils';
import { Calendar, LayoutDashboard, Users, Clock, PartyPopper, Sunset, Sun, Archive, PiggyBank, Briefcase } from 'lucide-react';

interface NavigationProps {
  activeTab: TaskDay | 'overview' | 'timeline' | 'team' | 'calendar' | 'users' | 'cajon-sastre' | 'budget' | 'suppliers';
  onTabChange: (tab: TaskDay | 'overview' | 'timeline' | 'team' | 'calendar' | 'users' | 'cajon-sastre' | 'budget' | 'suppliers') => void;
  showOverview?: boolean;
}

const days: { key: TaskDay; labelKey: string; date: string; icon: any }[] = [
  { key: 'Friday', labelKey: 'days.Friday', date: 'Jun 19', icon: Sunset },
  { key: 'Saturday', labelKey: 'days.Saturday', date: 'Jun 20', icon: PartyPopper },
  { key: 'Sunday', labelKey: 'days.Sunday', date: 'Jun 21', icon: Sun },
];

export function Navigation({ activeTab, onTabChange, showOverview = false }: NavigationProps) {
  const { t } = useTranslation();

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-2 -mb-px">
          {showOverview && (
            <button
              onClick={() => onTabChange('overview')}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              {t('nav.overview')}
            </button>
          )}

          <button
            onClick={() => onTabChange('timeline')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
              activeTab === 'timeline'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Clock className="h-4 w-4" />
            {t('nav.timeline')}
          </button>

          <button
            onClick={() => onTabChange('team')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
              activeTab === 'team'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Users className="h-4 w-4" />
            {t('nav.team')}
          </button>

          {days.map((day) => {
            const Icon = day.icon;
            return (
              <button
                key={day.key}
                onClick={() => onTabChange(day.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                  activeTab === day.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{t(day.labelKey)}</span>
                <span className="text-xs opacity-70">({day.date})</span>
              </button>
            );
          })}

          <button
            onClick={() => onTabChange('cajon-sastre')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
              activeTab === 'cajon-sastre'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Archive className="h-4 w-4" />
            {t('nav.cajonSastre')}
          </button>

          <button
            onClick={() => onTabChange('calendar')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
              activeTab === 'calendar'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Calendar className="h-4 w-4" />
            {t('nav.calendar')}
          </button>

          <button
            onClick={() => onTabChange('budget')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
              activeTab === 'budget'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <PiggyBank className="h-4 w-4" />
            {t('nav.budget')}
          </button>

          <button
            onClick={() => onTabChange('suppliers')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
              activeTab === 'suppliers'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Briefcase className="h-4 w-4" />
            {t('nav.suppliers')}
          </button>
        </div>
      </div>
    </nav >
  );
}
