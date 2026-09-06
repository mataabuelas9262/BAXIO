'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { LoadingState } from '@/components/ui/LoadingState';
import { OrderChatModal } from '@/features/messages/components/OrderChatModal';
import { useAuth } from '@/features/auth/context/AuthContext';
import { usersApi } from '@/services/api/endpoints';

export default function DirectMessagesPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [counterpart, setCounterpart] = useState<{ id: string; fullName: string; avatarUrl?: string | null; location?: string | null } | null>(null);

  useEffect(() => {
    if (!userId) return;
    usersApi.getProfile(userId)
      .then((profile) => setCounterpart(profile))
      .catch(() => setCounterpart(null));
  }, [userId]);

  if (!counterpart) return <LoadingState message="Cargando conversación..." />;

  return (
    <PageContainer>
      <OrderChatModal isOpen onClose={() => router.back()} directUser={counterpart} currentUserId={user?.id} />
    </PageContainer>
  );
}
