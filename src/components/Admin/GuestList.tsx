import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { useGuests } from "@/hooks/useGuests";
import { Guest } from "@/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Search, Download, Upload, Bus, Car } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function GuestList() {
    const { t } = useTranslation();
    const { guests, isLoading, addGuest, addGuests, updateGuest, deleteGuest, stats } = useGuests();
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importText, setImportText] = useState("");
    const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
    const [formData, setFormData] = useState<Partial<Guest>>({});

    const filteredGuests = guests.filter((guest) =>
        guest.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (guest?: Guest) => {
        if (guest) {
            setEditingGuest(guest);
            setFormData(guest);
        } else {
            setEditingGuest(null);
            setFormData({
                confirmation_status: "Pending",
                menu_preference: "Meat",
                transport_needs: "None",
                attending_pre_wedding: false,
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (!formData.name) return;

            if (editingGuest) {
                await updateGuest(editingGuest.id, formData);
            } else {
                await addGuest(formData as any);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    };
    const handleImport = async () => {
        if (!importText.trim()) return;

        const names = importText.split(/[\n,]+/).map(name => name.trim()).filter(name => name.length > 0);

        if (names.length === 0) return;

        const newGuests = names.map(name => ({
            name,
            confirmation_status: "Pending",
            menu_preference: "Meat",
            transport_needs: "None",
            attending_pre_wedding: false,
        }));

        try {
            await addGuests(newGuests as any);
            setImportText("");
            setIsImportModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    const exportToCSV = () => {
        const headers = ["Name,Status,Menu,Allergies,Pre-Wedding,Transport,Notes"];
        const rows = guests.map(g =>
            `"${g.name}","${g.confirmation_status}","${g.menu_preference}","${g.allergies || ''}","${g.attending_pre_wedding ? 'Yes' : 'No'}","${g.transport_needs}","${g.notes || ''}"`
        );
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "wedding_guest_list.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t('guests.totalGuests')}</CardTitle>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t('guests.confirmed')}</CardTitle>
                        <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t('guests.preWedding')}</CardTitle>
                        <div className="text-2xl font-bold">{stats.preWedding}</div>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t('guests.needTransport')}</CardTitle>
                        <div className="text-2xl font-bold">{stats.needsTransport}</div>
                    </CardHeader>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('guests.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={exportToCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        {t('guests.exportCSV')}
                    </Button>
                    <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        {t('guests.bulkImport')}
                    </Button>
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('guests.addGuest')}
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('guests.name')}</TableHead>
                            <TableHead>{t('guests.status')}</TableHead>
                            <TableHead>{t('guests.menu')}</TableHead>
                            <TableHead>{t('guests.allergies')}</TableHead>
                            <TableHead className="text-center">{t('guests.preWeddingLabel')}</TableHead>
                            <TableHead>{t('guests.transport')}</TableHead>
                            <TableHead className="text-right">{t('guests.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredGuests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    {t('guests.noGuestsFound')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredGuests.map((guest) => (
                                <TableRow key={guest.id}>
                                    <TableCell className="font-medium">{guest.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            guest.confirmation_status === 'Confirmed' ? 'default' :
                                                guest.confirmation_status === 'Declined' ? 'destructive' : 'secondary'
                                        }>
                                            {t(`guests.statusOptions.${guest.confirmation_status}`)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{t(`guests.menuOptions.${guest.menu_preference}`)}</TableCell>
                                    <TableCell className="max-w-[150px] truncate" title={guest.allergies || ''}>
                                        {guest.allergies || '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {guest.attending_pre_wedding ? (
                                            <span className="text-green-600 font-bold">✓</span>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-2xl">
                                        {guest.transport_needs === 'Bus'
                                            ? t('guests.transportOptions.Bus')
                                            : t('guests.transportOptions.None')
                                        }
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenModal(guest)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteGuest(guest.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Import Modal */}
            <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{t('guests.bulkImportTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-muted-foreground">{t('guests.bulkImportDescription')}</p>
                        <Textarea
                            placeholder="John Doe&#10;Jane Smith&#10;Bob Johnson"
                            className="min-h-[200px]"
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{t('guests.namesDetected', { count: importText.split(/[\n,]+/).filter(n => n.trim().length > 0).length })}</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleImport} disabled={!importText.trim()}>
                            {t('guests.importGuests')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingGuest ? t('guests.editGuest') : t('guests.addGuest')}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('guests.name')}</Label>
                            <Input
                                id="name"
                                value={formData.name || ""}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="status">{t('guests.confirmedAssistance')}</Label>
                                <Select
                                    value={formData.confirmation_status}
                                    onValueChange={(val: any) => setFormData({ ...formData, confirmation_status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pending">{t('guests.statusOptions.Pending')}</SelectItem>
                                        <SelectItem value="Confirmed">{t('guests.statusOptions.Confirmed')}</SelectItem>
                                        <SelectItem value="Declined">{t('guests.statusOptions.Declined')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="menu">{t('guests.menuPreference')}</Label>
                                <Select
                                    value={formData.menu_preference}
                                    onValueChange={(val) => setFormData({ ...formData, menu_preference: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Meat">{t('guests.menuOptions.Meat')}</SelectItem>
                                        <SelectItem value="Fish">{t('guests.menuOptions.Fish')}</SelectItem>
                                        <SelectItem value="Vegan">{t('guests.menuOptions.Vegan')}</SelectItem>
                                        <SelectItem value="Children">{t('guests.menuOptions.Children')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="allergies">{t('guests.allergies')}</Label>
                            <Input
                                id="allergies"
                                value={formData.allergies || ""}
                                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                placeholder={t('guests.allergiesPlaceholder')}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="transport">{t('guests.transport')}</Label>
                                <Select
                                    value={formData.transport_needs}
                                    onValueChange={(val) => setFormData({ ...formData, transport_needs: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="None" className="text-2xl">{t('guests.transportOptions.None')}</SelectItem>
                                        <SelectItem value="Bus" className="text-2xl">{t('guests.transportOptions.Bus')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2 pt-8">
                                <Checkbox
                                    id="prewedding"
                                    checked={formData.attending_pre_wedding}
                                    onCheckedChange={(checked) => setFormData({ ...formData, attending_pre_wedding: checked as boolean })}
                                />
                                <Label htmlFor="prewedding">{t('guests.attendingPreWedding')}</Label>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes">{t('guests.notes')}</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes || ''}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder={t('guests.notesPlaceholder')}
                            />
                        </div>

                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleSave}>{t('common.saveChanges')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
