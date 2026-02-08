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
import { Plus, Pencil, Trash2, Search, Download, Upload, Bus, Car, Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function GuestList() {
    const { t } = useTranslation();
    const { guests, isLoading, addGuest, addGuests, updateGuest, deleteGuest, linkGuests, stats } = useGuests();
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [linkingGuest, setLinkingGuest] = useState<Guest | null>(null);
    const [linkSearchTerm, setLinkSearchTerm] = useState("");
    const [importText, setImportText] = useState("");
    const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
    const [formData, setFormData] = useState<Partial<Guest>>({});

    const getLinkedGuests = (guest: Guest) => {
        if (!guest.group_id) return [];
        return guests.filter(g => g.group_id === guest.group_id && g.id !== guest.id);
    };

    const handleLink = async (targetGuestId: string) => {
        if (!linkingGuest) return;
        try {
            await linkGuests(linkingGuest.id, targetGuestId);
            setLinkingGuest(null);
            setLinkSearchTerm("");
        } catch (error) {
            console.error(error);
        }
    };

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

    const handleSave = async (shouldClose = true) => {
        try {
            if (!formData.name) return;

            let savedGuest: Guest;
            if (editingGuest) {
                savedGuest = await updateGuest(editingGuest.id, formData) as Guest;
            } else {
                savedGuest = await addGuest(formData as any) as Guest;
            }

            if (shouldClose) {
                setIsModalOpen(false);
            }
            return savedGuest;
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

            {/* Separate Header Table */}
            <div className="rounded-t-md border border-b-0 bg-secondary/20">
                <Table className="table-fixed w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[25%]">{t('guests.name')}</TableHead>
                            <TableHead className="w-[15%]">{t('guests.status')}</TableHead>
                            <TableHead className="w-[15%]">{t('guests.menu')}</TableHead>
                            <TableHead className="w-[15%]">{t('guests.allergies')}</TableHead>
                            <TableHead className="w-[10%] text-center">{t('guests.preWeddingLabel')}</TableHead>
                            <TableHead className="w-[10%] text-center">{t('guests.transport')}</TableHead>
                            <TableHead className="w-[10%] text-right">{t('guests.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                </Table>
            </div>

            {/* Scrollable Body Table */}
            <div className="rounded-b-md border bg-card h-[calc(100vh-22rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                <Table className="table-fixed w-full">
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
                                    <TableCell className="w-[25%] font-medium">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                {guest.name}
                                                {guest.group_id && (
                                                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600" title={t('guests.linkedWith', { count: getLinkedGuests(guest).length })}>
                                                        <LinkIcon className="w-3 h-3" />
                                                    </div>
                                                )}
                                            </div>
                                            {guest.group_id && (
                                                <div className="text-xs text-muted-foreground mt-0.5 ml-1">
                                                    + {getLinkedGuests(guest).map(g => g.name).join(", ")}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="w-[15%]">
                                        <Badge variant={
                                            guest.confirmation_status === 'Confirmed' ? 'default' :
                                                guest.confirmation_status === 'Declined' ? 'destructive' : 'secondary'
                                        }>
                                            {t(`guests.statusOptions.${guest.confirmation_status}`)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="w-[15%]">
                                        {/* Fallback for legacy database values */}
                                        {['Standard', 'Celiac', 'Other'].includes(guest.menu_preference)
                                            ? t('guests.menuOptions.Meat')
                                            : guest.menu_preference === 'Vegetarian'
                                                ? t('guests.menuOptions.Vegan')
                                                : t(`guests.menuOptions.${guest.menu_preference}`)
                                        }
                                    </TableCell>
                                    <TableCell className="w-[15%] max-w-[150px] truncate" title={guest.allergies || ''}>
                                        {guest.allergies || '-'}
                                    </TableCell>
                                    <TableCell className="w-[10%] text-center">
                                        {guest.attending_pre_wedding ? (
                                            <span className="text-green-600 font-bold">✓</span>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="w-[10%] text-2xl text-center">
                                        {guest.transport_needs === 'Bus'
                                            ? t('guests.transportOptions.Bus')
                                            : t('guests.transportOptions.None')
                                        }
                                    </TableCell>
                                    <TableCell className="w-[10%] text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenModal(guest)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => { setLinkingGuest(guest); setLinkSearchTerm(""); }}>
                                                <LinkIcon className="h-4 w-4" />
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

                        {/* Link Guest Section inside Modal (Add & Edit) */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={async () => {
                                    if (editingGuest) {
                                        setLinkingGuest(editingGuest);
                                        setLinkSearchTerm("");
                                    } else {
                                        // If adding new guest, save first then link
                                        const newGuest = await handleSave(false);
                                        if (newGuest) {
                                            setEditingGuest(newGuest);
                                            setLinkingGuest(newGuest);
                                            setLinkSearchTerm("");
                                        }
                                    }
                                }}
                                title={t('guests.linkGuest')}
                                type="button"
                            >
                                <LinkIcon className="h-4 w-4" />
                            </Button>
                            {editingGuest?.group_id && (
                                <div className="text-sm text-muted-foreground">
                                    + {getLinkedGuests(editingGuest).map(g => g.name).join(", ")}
                                </div>
                            )}
                            {!editingGuest && (
                                <span className="text-xs text-muted-foreground">{t('guests.saveToLink')}</span>
                            )}
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
                        <Button onClick={() => handleSave(true)}>{t('common.saveChanges')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Link Guest Modal */}
            <Dialog open={!!linkingGuest} onOpenChange={(open) => !open && setLinkingGuest(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t('guests.linkGuest')}</DialogTitle>
                        <div className="text-sm text-muted-foreground">
                            {t('guests.selectGuestToLink', { name: linkingGuest?.name })}
                        </div>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('guests.searchGuest')}
                                value={linkSearchTerm}
                                onChange={(e) => setLinkSearchTerm(e.target.value)}
                                className="pl-8"
                                autoFocus
                            />
                        </div>
                        <div className="h-[300px] overflow-y-auto space-y-1 border rounded-md p-2">
                            {guests
                                .filter(g => g.id !== linkingGuest?.id && g.name.toLowerCase().includes(linkSearchTerm.toLowerCase()))
                                .map(g => {
                                    const isAlreadyLinked = linkingGuest?.group_id && g.group_id === linkingGuest.group_id;
                                    return (
                                        <div
                                            key={g.id}
                                            className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${isAlreadyLinked ? 'bg-blue-50 opacity-50 cursor-default' : 'hover:bg-muted'}`}
                                            onClick={() => !isAlreadyLinked && handleLink(g.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{g.name}</span>
                                                {g.group_id && !isAlreadyLinked && <LinkIcon className="w-3 h-3 text-muted-foreground" />}
                                            </div>
                                            {isAlreadyLinked && <Badge variant="secondary" className="text-[10px]">Linked</Badge>}
                                        </div>
                                    );
                                })}
                            {guests.filter(g => g.id !== linkingGuest?.id && g.name.toLowerCase().includes(linkSearchTerm.toLowerCase())).length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    {t('guests.noGuestsFound')}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
