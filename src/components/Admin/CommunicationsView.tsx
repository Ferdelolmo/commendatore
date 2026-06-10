import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Megaphone, Calendar as CalendarIcon, Clock, Copy, Plus, Trash2, Edit3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useCommunications } from '@/hooks/useCommunications';
import { Communication } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function CommunicationsView() {
    const { t } = useTranslation();
    const { communications, isLoading, addCommunication, updateCommunication, deleteCommunication } = useCommunications();
    const { toast } = useToast();
    const { role } = useAuth();
    const isAdmin = role === 'admin';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingComm, setEditingComm] = useState<Communication | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        scheduled_at: '',
        content_en: '',
        content_es: '',
        content_it: ''
    });

    const openCreateModal = () => {
        setFormData({
            title: '',
            scheduled_at: '',
            content_en: '',
            content_es: '',
            content_it: ''
        });
        setEditingComm(null);
        setIsModalOpen(true);
    };

    const openEditModal = (comm: Communication) => {
        // format scheduled_at for datetime-local input (YYYY-MM-DDThh:mm)
        const dateObj = new Date(comm.scheduled_at);
        const isoString = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        
        setFormData({
            title: comm.title,
            scheduled_at: isoString,
            content_en: comm.content_en,
            content_es: comm.content_es,
            content_it: comm.content_it
        });
        setEditingComm(comm);
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Convert local datetime string to ISO string for DB
        const dbScheduledAt = new Date(formData.scheduled_at).toISOString();

        if (editingComm) {
            await updateCommunication(editingComm.id, {
                title: formData.title,
                scheduled_at: dbScheduledAt,
                content_en: formData.content_en,
                content_es: formData.content_es,
                content_it: formData.content_it
            });
        } else {
            await addCommunication({
                title: formData.title,
                scheduled_at: dbScheduledAt,
                content_en: formData.content_en,
                content_es: formData.content_es,
                content_it: formData.content_it
            });
        }
        setIsModalOpen(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this communication draft?')) {
            await deleteCommunication(id);
        }
    };

    const copyToClipboard = (text: string, language: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({
                title: 'Copied!',
                description: `${language} text copied to clipboard.`,
            });
        });
    };

    if (isLoading) {
        return <div className="p-8 text-center">{t('common.loading', 'Loading...')}</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-slate-800 flex items-center gap-3">
                        <Megaphone className="w-8 h-8 text-blue-600" />
                        Communications Hub
                    </h2>
                    <p className="text-slate-500 mt-2">Manage and coordinate WhatsApp messages for the guests.</p>
                </div>
                {isAdmin && (
                    <Button onClick={openCreateModal} className="gap-2">
                        <Plus className="w-4 h-4" /> New Message
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {communications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed rounded-xl">
                        <Megaphone className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg">No communications drafted yet.</p>
                    </div>
                ) : (
                    communications.map((comm) => (
                        <Card key={comm.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="bg-slate-50 border-b flex flex-row items-start justify-between py-4">
                                <div>
                                    <CardTitle className="text-xl text-slate-800">{comm.title}</CardTitle>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <CalendarIcon className="w-4 h-4" />
                                            {format(new Date(comm.scheduled_at), 'EEEE, MMMM do, yyyy')}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4" />
                                            {format(new Date(comm.scheduled_at), 'HH:mm')}
                                        </div>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <div className="flex gap-2 shrink-0">
                                        <Button variant="ghost" size="icon" onClick={() => openEditModal(comm)}>
                                            <Edit3 className="w-4 h-4 text-slate-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(comm.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x border-t-0">
                                    {/* English */}
                                    <div className="p-5 flex flex-col h-full bg-white">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2 font-semibold text-slate-700">
                                                <span>🇬🇧</span> English
                                            </div>
                                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => copyToClipboard(comm.content_en, 'English')}>
                                                <Copy className="w-3 h-3" /> Copy
                                            </Button>
                                        </div>
                                        <div className="text-sm text-slate-600 whitespace-pre-wrap flex-1 bg-slate-50 p-3 rounded-md border border-slate-100">
                                            {comm.content_en || <span className="italic text-slate-400">No content...</span>}
                                        </div>
                                    </div>

                                    {/* Spanish */}
                                    <div className="p-5 flex flex-col h-full bg-white">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2 font-semibold text-slate-700">
                                                <span>🇪🇸</span> Spanish
                                            </div>
                                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => copyToClipboard(comm.content_es, 'Spanish')}>
                                                <Copy className="w-3 h-3" /> Copy
                                            </Button>
                                        </div>
                                        <div className="text-sm text-slate-600 whitespace-pre-wrap flex-1 bg-slate-50 p-3 rounded-md border border-slate-100">
                                            {comm.content_es || <span className="italic text-slate-400">No content...</span>}
                                        </div>
                                    </div>

                                    {/* Italian */}
                                    <div className="p-5 flex flex-col h-full bg-white">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2 font-semibold text-slate-700">
                                                <span>🇮🇹</span> Italian
                                            </div>
                                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => copyToClipboard(comm.content_it, 'Italian')}>
                                                <Copy className="w-3 h-3" /> Copy
                                            </Button>
                                        </div>
                                        <div className="text-sm text-slate-600 whitespace-pre-wrap flex-1 bg-slate-50 p-3 rounded-md border border-slate-100">
                                            {comm.content_it || <span className="italic text-slate-400">No content...</span>}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSave}>
                        <DialogHeader>
                            <DialogTitle>
                                {editingComm ? 'Edit Communication' : 'New Communication'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-5 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Internal Title</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Morning Welcome Message"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="scheduled_at">Date and Time</Label>
                                <Input
                                    id="scheduled_at"
                                    type="datetime-local"
                                    value={formData.scheduled_at}
                                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                                    required
                                />
                            </div>
                            
                            <div className="grid gap-2 mt-2">
                                <Label htmlFor="content_en" className="flex items-center gap-2"><span>🇬🇧</span> English Content</Label>
                                <Textarea
                                    id="content_en"
                                    value={formData.content_en}
                                    onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                                    placeholder="Type english message here..."
                                    className="min-h-[100px]"
                                />
                            </div>
                            
                            <div className="grid gap-2 mt-2">
                                <Label htmlFor="content_es" className="flex items-center gap-2"><span>🇪🇸</span> Spanish Content</Label>
                                <Textarea
                                    id="content_es"
                                    value={formData.content_es}
                                    onChange={(e) => setFormData({ ...formData, content_es: e.target.value })}
                                    placeholder="Type spanish message here..."
                                    className="min-h-[100px]"
                                />
                            </div>
                            
                            <div className="grid gap-2 mt-2">
                                <Label htmlFor="content_it" className="flex items-center gap-2"><span>🇮🇹</span> Italian Content</Label>
                                <Textarea
                                    id="content_it"
                                    value={formData.content_it}
                                    onChange={(e) => setFormData({ ...formData, content_it: e.target.value })}
                                    placeholder="Type italian message here..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
