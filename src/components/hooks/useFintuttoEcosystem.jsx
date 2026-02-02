import { useQuery } from '@tanstack/react-query';
import { fintuttoEcosystem } from '../services/fintuttoEcosystem';
import { base44 } from '@/api/base44Client';

/**
 * Hook für FinTutto Ecosystem Integration
 */
export function useFintuttoEcosystem() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: appPricing, isLoading: pricingLoading } = useQuery({
    queryKey: ['appPricing'],
    queryFn: () => fintuttoEcosystem.getAppPricing(),
    enabled: !!user,
  });

  const { data: ecosystemApps, isLoading: ecosystemLoading } = useQuery({
    queryKey: ['ecosystemApps', user?.email],
    queryFn: () => fintuttoEcosystem.getEcosystemApps(user?.email),
    enabled: !!user?.email,
  });

  const { data: crossSellRecommendations, isLoading: crossSellLoading } = useQuery({
    queryKey: ['crossSellRecommendations', user?.email],
    queryFn: () => fintuttoEcosystem.getCrossSellRecommendations(user?.email),
    enabled: !!user?.email,
  });

  return {
    user,
    appPricing,
    ecosystemApps,
    crossSellRecommendations,
    isLoading: pricingLoading || ecosystemLoading || crossSellLoading,
  };
}

/**
 * Hook für Buildings Summary
 */
export function useBuildingsSummary() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: buildings, isLoading } = useQuery({
    queryKey: ['buildingsSummary', user?.email],
    queryFn: () => fintuttoEcosystem.getBuildingsSummary(user?.email),
    enabled: !!user?.email,
  });

  return { buildings, isLoading };
}

/**
 * Hook für Meters with Readings
 */
export function useMetersWithReadings(buildingId) {
  const { data: meters, isLoading } = useQuery({
    queryKey: ['metersWithReadings', buildingId],
    queryFn: () => fintuttoEcosystem.getMetersWithReadings(buildingId),
    enabled: !!buildingId,
  });

  return { meters, isLoading };
}