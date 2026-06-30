import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useAppMode } from '@/stores/app-mode';

/**
 * Ecran racine.
 * Verifie la session et le mode (is_seller) pour rediriger
 * vers le bon layout (client ou seller).
 */
export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const initializeFromProfile = useAppMode(
    (state: { initializeFromProfile: (v: boolean) => void }) => state.initializeFromProfile
  );

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Utilisateur connecte : verifier le mode
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const row = profile as Record<string, unknown> | null;
          const isSeller = (row?.is_seller as boolean) ?? false;
          initializeFromProfile(isSeller);
          router.replace(isSeller ? '/(seller)/home' : '/(client)/home');
        } else {
          // Non connecte : splash
          router.replace('/(auth)/splash');
        }
      } catch (err) {
        logger.error('[Index] checkSession error:', err);
        router.replace('/(auth)/splash');
      } finally {
        setIsReady(true);
      }
    };

    checkSession();
  }, [router, initializeFromProfile]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.sand, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.terracotta} />
      </View>
    );
  }

  return null;
}