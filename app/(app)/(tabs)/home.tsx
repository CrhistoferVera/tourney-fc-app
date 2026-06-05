import { useRouter } from 'expo-router';
import DashboardSection from '../../../components/home/DashboardSection';

export default function HomeTab() {
  const router = useRouter();
  return (
    <DashboardSection 
      onPressTorneo={(torneo) => {
        if (torneo.estado === 'BORRADOR') {
          router.push({ pathname: '/(app)/create-tournament', params: { id: torneo.id } } as any);
        } else {
          router.push(`/(app)/tournament/${torneo.id}` as never);
        }
      }} 
    />
  );
}
