import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Heart, LogOut, Shield, Users } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderProps {
  onUsersClick?: () => void;
}

export function Header({ onUsersClick }: HeaderProps) {
  const { role, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="gradient-header py-4 px-4 md:px-6 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="https://i.imgur.com/72sI6FA.jpeg"
            alt="Logo"
            className="h-10 w-10 md:h-12 md:w-12 rounded-full border-2 border-primary-foreground object-cover"
          />
          <div>
            <h1 className="text-xl md:text-2xl font-serif text-primary-foreground font-semibold">
              Wedding Coordinator
            </h1>
            <p className="text-xs md:text-sm text-primary-foreground/80">
              June 19-21, 2026 • Chiara e Fer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          {role === 'admin' && onUsersClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onUsersClick}
              className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground rounded-full"
              title={t('common.manageAuthorizedUsers')}
            >
              <Users className="h-5 w-5" />
            </Button>
          )}

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm">
            {role === 'admin' ? (
              <>
                <Shield className="h-4 w-4" />
                <span>{t('common.admin')}</span>
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                <span>{t('common.coordinator')}</span>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{t('common.logout')}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
