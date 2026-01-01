import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const UKFlag = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 60 30" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 L30,30 M0,15 L60,15" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 L30,30 M0,15 L60,15" stroke="#C8102E" strokeWidth="6" />
    </svg>
);

const ESFlag = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 60 30" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="30" fill="#AA151B" />
        <rect y="7.5" width="60" height="15" fill="#F1BF00" />
    </svg>
);

const ITFlag = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 60 30" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="30" fill="#fff" />
        <rect width="20" height="30" fill="#009246" />
        <rect x="40" width="20" height="30" fill="#CE2B37" />
    </svg>
);

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const getCurrentFlag = () => {
        switch (i18n.language) {
            case 'es': return <ESFlag className="h-4 w-6 rounded-sm shadow-sm" />;
            case 'it': return <ITFlag className="h-4 w-6 rounded-sm shadow-sm" />;
            default: return <UKFlag className="h-4 w-6 rounded-sm shadow-sm" />;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-10 h-10 px-0 rounded-full hover:bg-muted/20">
                    {getCurrentFlag()}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage('en')} className="gap-2">
                    <UKFlag className="h-3 w-5 rounded-[2px]" /> English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('es')} className="gap-2">
                    <ESFlag className="h-3 w-5 rounded-[2px]" /> Español
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('it')} className="gap-2">
                    <ITFlag className="h-3 w-5 rounded-[2px]" /> Italiano
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
