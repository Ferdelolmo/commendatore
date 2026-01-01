
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Edit2, ArrowRight, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

export interface Idea {
    id: string;
    content: string;
    createdAt: number;
}

interface IdeasBoardProps {
    onPromote: (ideaContent: string) => void;
}

export function IdeasBoard({ onPromote }: IdeasBoardProps) {
    const { t } = useTranslation();
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentIdea, setCurrentIdea] = useState<string>('');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Initial load from LocalStorage
    useEffect(() => {
        const stored = localStorage.getItem('commendatore_ideas');
        if (stored) {
            try {
                setIdeas(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse ideas", e);
            }
        }
    }, []);

    // Persist to LocalStorage
    useEffect(() => {
        localStorage.setItem('commendatore_ideas', JSON.stringify(ideas));
    }, [ideas]);

    const handleSave = () => {
        if (!currentIdea.trim()) return;

        if (editingId) {
            setIdeas(prev => prev.map(idea =>
                idea.id === editingId ? { ...idea, content: currentIdea } : idea
            ));
        } else {
            const newIdea: Idea = {
                id: Date.now().toString(),
                content: currentIdea,
                createdAt: Date.now(),
            };
            setIdeas(prev => [newIdea, ...prev]);
        }
        handleClose();
    };

    const handleClose = () => {
        setIsDialogOpen(false);
        setCurrentIdea('');
        setEditingId(null);
    };

    const openEdit = (idea: Idea) => {
        setCurrentIdea(idea.content);
        setEditingId(idea.id);
        setIsDialogOpen(true);
    };

    const deleteIdea = (id: string) => {
        setIdeas(prev => prev.filter(i => i.id !== id));
    };

    const promoteToTask = (idea: Idea) => {
        onPromote(idea.content);
        // Kept as per user request: "hit the Promote button... it should allow you to keep the note"
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif font-semibold text-foreground">
                        {t('common.cajonSastreTitle')}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('common.cajonSastreDescription')}
                    </p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('common.newIdea')}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ideas.map(idea => (
                    <Card key={idea.id} className="group relative hover:shadow-md transition-all">
                        <CardContent className="p-4 flex flex-col h-full">
                            <p className="text-base whitespace-pre-wrap flex-1 min-h-[80px]">
                                {idea.content}
                            </p>

                            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t opacity-80 bg-background">
                                <Button variant="ghost" size="sm" onClick={() => openEdit(idea)}>
                                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                                    {t('common.edit')}
                                </Button>
                                <Button variant="default" size="sm" onClick={() => promoteToTask(idea)}>
                                    {t('common.promote')}
                                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {ideas.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    {t('common.noIdeasYet')}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? t('common.editIdea') : t('common.addNewIdea')}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="idea-content" className="sr-only">Idea Content</Label>
                        <Textarea
                            id="idea-content"
                            value={currentIdea}
                            onChange={(e) => setCurrentIdea(e.target.value)}
                            placeholder={t('common.writeIdeaPlaceholder')}
                            className="min-h-[150px]"
                        />
                    </div>
                    <DialogFooter className="sm:justify-between gap-2">
                        {editingId && (
                            <Button variant="destructive" onClick={() => { deleteIdea(editingId); handleClose(); }}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('common.delete')}
                            </Button>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <Button variant="outline" onClick={handleClose}>{t('common.cancel')}</Button>
                            <Button onClick={handleSave}>{t('common.saveIdea')}</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
