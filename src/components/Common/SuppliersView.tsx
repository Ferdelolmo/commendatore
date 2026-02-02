import { useState } from 'react';
import { useSuppliers } from '@/hooks/useSuppliers';
import { Supplier } from '@/types';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

const CATEGORIES = [
    'Catering',
    'Musicians',
    'Jamón',
    'Bomboniere',
    'Photographer',
    'Italian products',
    'DJ',
    'Florist',
    'Transportation',
    'Accommodation',
    'Other',
];

export function SuppliersView() {
    const { suppliers, isLoading, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [formData, setFormData] = useState<Partial<Supplier>>({});

    const handleOpenModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData(supplier);
        } else {
            setEditingSupplier(null);
            setFormData({ category: 'Other', status: 'Proposed' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (!formData.name) return; // Basic validation

            if (editingSupplier) {
                await updateSupplier(editingSupplier.id, formData);
            } else {
                await addSupplier(formData as any);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            // Error handled in hook
        }
    };

    const groupedSuppliers = CATEGORIES.reduce((acc, category) => {
        acc[category] = suppliers.filter((s) => s.category === category);
        return acc;
    }, {} as Record<string, Supplier[]>);

    // Catch any with unknown categories
    const otherSuppliers = suppliers.filter((s) => !CATEGORIES.includes(s.category));
    if (otherSuppliers.length > 0) {
        if (!groupedSuppliers['Other']) groupedSuppliers['Other'] = [];
        groupedSuppliers['Other'].push(...otherSuppliers);
    }

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-serif font-semibold text-foreground">Suppliers</h2>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Supplier
                </Button>
            </div>

            <Accordion type="multiple" className="w-full" defaultValue={CATEGORIES}>
                {CATEGORIES.map((category) => (
                    <AccordionItem key={category} value={category}>
                        <AccordionTrigger className="text-lg font-semibold px-4 hover:bg-muted/50 rounded-md">
                            <span className="flex items-center gap-2">
                                {category}
                                <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {groupedSuppliers[category]?.length || 0}
                                </span>
                            </span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 px-4 pb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {groupedSuppliers[category]?.map((supplier) => (
                                    <Card key={supplier.id} className="relative group overflow-hidden border-muted hover:border-border transition-colors">
                                        <CardContent className="pt-6">
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => handleOpenModal(supplier)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => deleteSupplier(supplier.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>

                                            <h3 className="font-semibold text-lg pr-8">{supplier.name}</h3>
                                            <div className="text-sm text-muted-foreground mt-2 space-y-2">
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${supplier.status === 'Booked' ? 'bg-green-100 text-green-800 border-green-200' :
                                                            supplier.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                                                                supplier.status === 'Contacted' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                                    'bg-gray-100 text-gray-800 border-gray-200'
                                                        }`}>
                                                        {supplier.status}
                                                    </span>
                                                    {supplier.price && (
                                                        <span className="font-mono bg-muted/50 px-2 py-0.5 rounded text-xs">{supplier.price}€</span>
                                                    )}
                                                </div>

                                                {supplier.contact_info && (
                                                    <div className="truncate text-xs font-mono bg-muted/30 p-1.5 rounded" title={supplier.contact_info}>
                                                        {supplier.contact_info}
                                                    </div>
                                                )}

                                                {supplier.notes && (
                                                    <p className="mt-2 text-xs italic opacity-80 border-l-2 pl-2">{supplier.notes}</p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {(!groupedSuppliers[category] || groupedSuppliers[category].length === 0) && (
                                    <div className="col-span-full text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
                                        No suppliers in this category yet.
                                    </div>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Supplier Name"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Proposed">Proposed</SelectItem>
                                    <SelectItem value="Contacted">Contacted</SelectItem>
                                    <SelectItem value="Booked">Booked</SelectItem>
                                    <SelectItem value="Rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="contact">Contact Info</Label>
                            <Input
                                id="contact"
                                value={formData.contact_info || ''}
                                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                                placeholder="Phone, email, website..."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="price">Approx. Cost (€)</Label>
                            <Input
                                id="price"
                                type="number"
                                value={formData.price || ''}
                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes || ''}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Any additional notes..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
