import { useState, useEffect, useCallback } from 'react';
import { TeamMember } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export function useTeam() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMembers = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('team_members')
                .select('*')
                .order('name');

            if (error) throw error;

            if (data) {
                // Map database fields to frontend types if necessary
                // In this case, we mapped DB snake_case to camelCase in the plan,
                // but let's check if we agreed on mapping or if we just use the raw data.
                // The plan said: map `avatarUrl` -> `avatar_url` and `phoneNumber` -> `phone_number`

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mappedMembers: TeamMember[] = data.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    email: item.email,
                    role: item.role,
                    avatarUrl: item.avatar_url,
                    phoneNumber: item.phone_number
                }));
                setMembers(mappedMembers);
            }
        } catch (error) {
            console.error('Error fetching team members:', error);
            toast({
                title: "Error",
                description: "Failed to load team members.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load and Subscribe
    useEffect(() => {
        fetchMembers();

        const channel = supabase
            .channel('team_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'team_members' },
                () => {
                    fetchMembers();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchMembers]);

    const addMember = useCallback(async (member: Omit<TeamMember, 'id'>) => {
        try {
            const dbMember = {
                name: member.name,
                email: member.email,
                role: member.role,
                avatar_url: member.avatarUrl,
                phone_number: member.phoneNumber
            };

            const { error } = await supabase
                .from('team_members')
                .insert([dbMember]);

            if (error) throw error;

            toast({
                title: "Member Added",
                description: `${member.name} has been added to the team.`
            });
        } catch (error) {
            console.error('Error adding member:', error);
            toast({
                title: "Error",
                description: "Failed to add team member.",
                variant: "destructive"
            });
        }
    }, []);

    const updateMember = useCallback(async (id: string, updates: Partial<TeamMember>) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const dbUpdates: any = {};
            if (updates.name) dbUpdates.name = updates.name;
            if (updates.email) dbUpdates.email = updates.email;
            if (updates.role) dbUpdates.role = updates.role;
            if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;
            if (updates.phoneNumber) dbUpdates.phone_number = updates.phoneNumber;

            const { error } = await supabase
                .from('team_members')
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;

            toast({
                title: "Member Updated",
                description: "Team member details updated."
            });
        } catch (error) {
            console.error('Error updating member:', error);
            toast({
                title: "Error",
                description: "Failed to update member.",
                variant: "destructive"
            });
        }
    }, []);

    const deleteMember = useCallback(async (id: string) => {
        try {
            const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: "Member Removed",
                description: "Team member has been removed."
            });
        } catch (error) {
            console.error('Error removing member:', error);
            toast({
                title: "Error",
                description: "Failed to remove member.",
                variant: "destructive"
            });
        }
    }, []);

    const getMemberByName = useCallback((name: string) => {
        return members.find(m => m.name === name);
    }, [members]);

    return {
        members,
        isLoading,
        addMember,
        updateMember,
        deleteMember,
        getMemberByName
    };
}
