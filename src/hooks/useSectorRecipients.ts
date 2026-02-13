import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSectorRecipients,
  upsertSectorRecipient,
  type SectorRecipientRow,
} from "@/services/adminApi";

export type { SectorRecipientRow };

const EMPTY_RECIPIENTS: Record<string, SectorRecipientRow> = {};

export function useSectorRecipients() {
  const queryClient = useQueryClient();
  const { data: recipientsByKey, isLoading } = useQuery({
    queryKey: ["sector_recipients"],
    queryFn: fetchSectorRecipients,
    retry: 1,
    retryDelay: 2000,
  });

  const upsertMutation = useMutation({
    mutationFn: async ({
      sectorKey,
      displayName,
      emails,
      label,
      enabled,
      cc,
      bcc,
      sector_username,
      sector_password,
    }: {
      sectorKey: string;
      displayName: string;
      emails: string[];
      label?: string | null;
      enabled?: boolean;
      cc?: string[];
      bcc?: string[];
      sector_username?: string | null;
      sector_password?: string;
    }) => {
      await upsertSectorRecipient({
        sector_key: sectorKey,
        display_name: displayName,
        emails: emails.filter((e) => e.trim().length > 0),
        label,
        enabled,
        cc,
        bcc,
        sector_username,
        sector_password,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sector_recipients"] }),
  });

  const getEmailsForSector = (sectorKey: string): string[] => {
    const row = recipientsByKey?.[sectorKey];
    return row?.emails ?? [];
  };

  return {
    recipientsByKey: recipientsByKey ?? EMPTY_RECIPIENTS,
    isLoading,
    getEmailsForSector,
    upsert: upsertMutation.mutateAsync,
    isUpserting: upsertMutation.isPending,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["sector_recipients"] }),
  };
}
