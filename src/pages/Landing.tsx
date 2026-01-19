
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Check, ListTodo, Users, CalendarDays, Heart, ShieldCheck, UserPlus, Play, HelpCircle, Star } from 'lucide-react';

export default function Landing() {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
            {/* Abstract Background Element */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4" />

            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-8 animate-fade-in">
                {/* Logo/Brand Area */}
                <div className="flex flex-col items-center gap-6">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white shadow-elevated p-1 border border-border">
                        <img
                            src="https://i.imgur.com/72sI6FA.jpeg"
                            alt="Commendatore Logo"
                            className="w-full h-full object-cover rounded-full"
                        />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-serif font-bold text-primary tracking-tight">
                        Commendatore
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto">
                        Plan your wedding with confidence and grace.
                    </p>
                </div>

                {/* Trusted By */}
                <div className="py-8 animate-fade-in text-center" style={{ animationDelay: '200ms' }}>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest opacity-70">
                        {t('landing.trustedBy')}
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 text-left">
                    <div className="p-6 bg-white/50 backdrop-blur-sm rounded-xl border border-white/40 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                            <ListTodo className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-serif text-lg font-semibold mb-2 text-primary">{t('landing.feature1Title', 'Task Management')}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {t('landing.feature1Desc', 'Stay on top of every detail with our intuitive tracking system.')}
                        </p>
                    </div>
                    <div className="p-6 bg-white/50 backdrop-blur-sm rounded-xl border border-white/40 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                            <Users className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-serif text-lg font-semibold mb-2 text-primary">{t('landing.feature2Title', 'Vendor Coordination')}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {t('landing.feature2Desc', 'Manage contracts, payments, and contacts in one secure place.')}
                        </p>
                    </div>
                    <div className="p-6 bg-white/50 backdrop-blur-sm rounded-xl border border-white/40 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                            <CalendarDays className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-serif text-lg font-semibold mb-2 text-primary">{t('landing.feature3Title', 'Timeline Planning')}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {t('landing.feature3Desc', 'Visualize your big day minute-by-minute with smart timelines.')}
                        </p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="py-16 w-full text-center">
                    <h2 className="text-3xl font-serif font-bold text-primary mb-12">{t('landing.howItWorksTitle')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative max-w-5xl mx-auto">
                        <div className="hidden md:block absolute top-[2rem] left-1/6 right-1/6 h-0.5 bg-primary/20 -z-10" />
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-background border-4 border-secondary flex items-center justify-center mb-6 shadow-sm z-10">
                                <span className="font-serif text-2xl font-bold text-primary">1</span>
                            </div>
                            <h3 className="font-serif text-xl font-bold mb-2">{t('landing.step1Title')}</h3>
                            <p className="text-muted-foreground text-sm max-w-xs">{t('landing.step1Desc')}</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-background border-4 border-secondary flex items-center justify-center mb-6 shadow-sm z-10">
                                <span className="font-serif text-2xl font-bold text-primary">2</span>
                            </div>
                            <h3 className="font-serif text-xl font-bold mb-2">{t('landing.step2Title')}</h3>
                            <p className="text-muted-foreground text-sm max-w-xs">{t('landing.step2Desc')}</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-background border-4 border-secondary flex items-center justify-center mb-6 shadow-sm z-10">
                                <span className="font-serif text-2xl font-bold text-primary">3</span>
                            </div>
                            <h3 className="font-serif text-xl font-bold mb-2">{t('landing.step3Title')}</h3>
                            <p className="text-muted-foreground text-sm max-w-xs">{t('landing.step3Desc')}</p>
                        </div>
                    </div>
                </div>

                {/* Testimonials */}
                <div className="py-16 w-full bg-secondary/20 -mx-4 px-4 md:px-12 rounded-3xl mb-12">
                    <h2 className="text-3xl font-serif font-bold text-primary mb-12 text-center">{t('landing.testimonialsTitle')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <div className="bg-background p-8 rounded-xl shadow-sm border border-border/50 text-left relative">
                            <Star className="w-8 h-8 text-accent mb-4 fill-accent" />
                            <p className="text-foreground/80 italic mb-6 text-lg">"{t('landing.testimonial1')}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20" />
                                <span className="font-serif font-bold text-primary">{t('landing.testimonial1Author')}</span>
                            </div>
                        </div>
                        <div className="bg-background p-8 rounded-xl shadow-sm border border-border/50 text-left relative">
                            <Star className="w-8 h-8 text-accent mb-4 fill-accent" />
                            <p className="text-foreground/80 italic mb-6 text-lg">"{t('landing.testimonial2')}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20" />
                                <span className="font-serif font-bold text-primary">{t('landing.testimonial2Author')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Section */}
                <div className="py-4 w-full max-w-sm mx-auto">
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border border-primary/10 shadow-lg text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                        <div className="w-12 h-12 rounded-full bg-accent/20 mx-auto flex items-center justify-center mb-4">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-serif font-bold text-primary mb-2">{t('landing.pricingTitle', 'Simple Pricing')}</h3>
                        <div className="flex items-baseline justify-center gap-1 mb-2">
                            <span className="text-4xl font-bold text-foreground">{t('landing.price', '€49')}</span>
                            <span className="text-sm text-muted-foreground">{t('landing.period', '/ year')}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">{t('landing.pricingDesc', 'Everything you need.')}</p>

                        <div className="space-y-3 mb-6 relative">
                            {/* Decorative line */}
                            <div className="absolute left-4 top-0 bottom-0 w-px bg-primary/10" />
                            <div className="flex items-center gap-3 text-sm text-foreground/80 pl-2">
                                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" /> {t('landing.feature1Title')}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-foreground/80 pl-2">
                                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" /> {t('landing.feature2Title')}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-foreground/80 pl-2">
                                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" /> {t('landing.feature3Title')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="py-16 w-full max-w-2xl mx-auto text-left">
                    <h2 className="text-2xl font-serif font-bold text-primary mb-8 text-center">{t('landing.faqTitle')}</h2>
                    <div className="space-y-6">
                        <div className="bg-white/40 p-6 rounded-lg border border-white/60">
                            <h4 className="font-serif font-semibold text-lg mb-2 flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-primary" /> {t('landing.faq1Q')}
                            </h4>
                            <p className="text-muted-foreground pl-7">{t('landing.faq1A')}</p>
                        </div>
                        <div className="bg-white/40 p-6 rounded-lg border border-white/60">
                            <h4 className="font-serif font-semibold text-lg mb-2 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-primary" /> {t('landing.faq2Q')}
                            </h4>
                            <p className="text-muted-foreground pl-7">{t('landing.faq2A')}</p>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="pb-12">
                    <Link to="/login">
                        <Button size="lg" className="rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 bg-primary text-primary-foreground hover:bg-primary/90">
                            {t('landing.userAccess', 'User Access')}
                        </Button>
                    </Link>
                    <p className="mt-4 text-xs text-muted-foreground uppercase opacity-60 tracking-widest">
                        {t('landing.securePortal', 'Secure Access Portal')}
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="w-full bg-white/50 border-t border-border/50 py-12 mt-12 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
                    <div className="col-span-1 md:col-span-2">
                        <h4 className="font-serif font-bold text-primary text-xl mb-4">Commendatore</h4>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto md:mx-0">
                            Plan your wedding with confidence, elegance, and peace of mind.
                        </p>
                    </div>
                    <div>
                        <h5 className="font-bold text-foreground mb-4">Product</h5>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-primary">Features</a></li>
                            <li><a href="#" className="hover:text-primary">Pricing</a></li>
                            <li><a href="#" className="hover:text-primary">Testimonials</a></li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-bold text-foreground mb-4">Support</h5>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-primary">Help Center</a></li>
                            <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-primary">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 text-center w-full border-t border-border/30 pt-6">
                    <p className="text-xs text-muted-foreground/50">© 2026 Commendatore. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
