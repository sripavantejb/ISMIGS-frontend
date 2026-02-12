import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSectorRecipients,
  upsertSectorRecipient,
  type SectorRecipientRow,
} from "@/services/adminApi";

export type { SectorRecipientRow };

export function useSectorRecipients() {
  const queryClient = useQueryClient();
  const { data: recipientsByKey, isLoading } = useQuery({
    queryKey: ["sector_recipients"],
    queryFn: fetchSectorRecipients,
  });

  const upsertMutation = useMutation({
    mutationFn: async ({
      sectorKey,
      displayName,
      emails,
    }: {
      sectorKey: string;
      displayName: string;
      emails: string[];
    }) => {
      await upsertSectorRecipient({
        sector_key: sectorKey,
        display_name: displayName,
        emails: emails.filter((e) => e.trim().length > 0),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sector_recipients"] }),
  });

  const getEmailsForSector = (sectorKey: string): string[] => {
    const row = recipientsByKey?.[sectorKey];
    return row?.emails ?? [];
  };

  return {
    recipientsByKey: recipientsByKey ?? {},
    isLoading,
    getEmailsForSector,
    upsert: upsertMutation.mutateAsync,
    isUpserting: upsertMutation.isPending,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["sector_recipients"] }),
  };
}
