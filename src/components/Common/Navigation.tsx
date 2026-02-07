import { useTranslation } from 'react-i18next';
import { TaskDay } from '@/types';
import { cn } from '@/lib/utils';
import { Calendar, LayoutDashboard, Users, Clock, PartyPopper, Sunset, Sun, Archive, PiggyBank, Briefcase, ChevronDown, ListCheck, Table } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavigationProps {
  activeTab: TaskDay | 'overview' | 'timeline' | 'team' | 'calendar' | 'users' | 'cajon-sastre' | 'budget' | 'suppliers' | 'days' | 'guests' | 'tables';
  onTabChange: (tab: TaskDay | 'overview' | 'timeline' | 'team' | 'calendar' | 'users' | 'cajon-sastre' | 'budget' | 'suppliers' | 'days' | 'guests' | 'tables') => void;
  showOverview?: boolean;
  isAdmin?: boolean;
}

const days: { key: TaskDay; labelKey: string; date: string; icon: any }[] = [
  { key: 'Friday', labelKey: 'days.Friday', date: 'Jun 19', icon: Sunset },
  { key: 'Saturday', labelKey: 'days.Saturday', date: 'Jun 20', icon: PartyPopper },
  { key: 'Sunday', labelKey: 'days.Sunday', date: 'Jun 21', icon: Sun },
];

export function Navigation({ activeTab, onTabChange, showOverview = false, isAdmin = false }: NavigationProps) {
  const { t } = useTranslation();

  const isDaySelected = days.some(d => d.key === activeTab);
  const currentDay = days.find(d => d.key === activeTab);

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-10 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-2 -mb-px no-scrollbar">
          {showOverview && (
            <button
              onClick={() => onTabChange('overview')}
              title={t('nav.overview')}
              className={cn(
                'flex items-center justify-center px-3 py-3 text-sm font-medium border-b-2 transition-all',
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <LayoutDashboard className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={() => onTabChange('timeline')}
            title={t('nav.timeline')}
            className={cn(
              'flex items-center justify-center px-3 py-3 text-sm font-medium border-b-2 transition-all',
              activeTab === 'timeline'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Clock className="h-5 w-5" />
          </button>

          <button
            onClick={() => onTabChange('team')}
            title={t('nav.team')}
            className={cn(
              'flex items-center justify-center px-3 py-3 text-sm font-medium border-b-2 transition-all',
              activeTab === 'team'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Users className="h-5 w-5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                title={isDaySelected && currentDay ? t(currentDay.labelKey) : t('nav.days')}
                className={cn(
                  'flex items-center justify-center px-3 py-3 text-sm font-medium border-b-2 transition-all outline-none',
                  isDaySelected
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {isDaySelected && currentDay ? (
                  <currentDay.icon className="h-5 w-5" />
                ) : (
                  <Calendar className="h-5 w-5" />
                )}
                <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {days.map((day) => {
                const Icon = day.icon;
                return (
                  <DropdownMenuItem
                    key={day.key}
                    onClick={() => onTabChange(day.key)}
                    className="gap-2 cursor-pointer"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{t(day.labelKey)}</span>
                    <span className="text-xs opacity-70">({day.date})</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>



          <button
            onClick={() => onTabChange('calendar')}
            title={t('nav.calendar')}
            className={cn(
              'flex items-center justify-center px-3 py-3 text-sm font-medium border-b-2 transition-all',
              activeTab === 'calendar'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Calendar className="h-5 w-5" />
          </button>

          <button
            onClick={() => onTabChange('budget')}
            title={t('nav.budget')}
            className={cn(
              'flex items-center justify-center px-3 py-3 text-sm font-medium border-b-2 transition-all',
              activeTab === 'budget'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <PiggyBank className="h-5 w-5" />
          </button>

          <button
            onClick={() => onTabChange('guests')}
            title={t('nav.guests')}
            className={cn(
              'flex items-center justify-center px-3 py-3 text-sm font-medium border-b-2 transition-all',
              activeTab === 'guests'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <ListCheck className="h-5 w-5" />
          </button>

          {isAdmin && (
            <button
              onClick={() => onTabChange('tables')}
              title={t('nav.tables')}
              className={cn(
                'flex items-center justify-center px-3 py-3 text-sm font-medium border-b-2 transition-all',
                activeTab === 'tables'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <Table className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={() => onTabChange('suppliers')}
            title={t('nav.suppliers')}
            className={cn(
              'flex items-center justify-center px-3 py-3 text-sm font-medium border-b-2 transition-all',
              activeTab === 'suppliers'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Briefcase className="h-5 w-5" />
          </button>
        </div>
      </div>
    </nav >
  );
}
