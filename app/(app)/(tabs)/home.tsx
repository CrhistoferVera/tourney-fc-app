import { useRouter } from 'expo-router';
import DashboardSection from '../../../components/home/DashboardSection';

export default function HomeTab() {
  const router = useRouter();
  return (
    <DashboardSection onPressTorneo={(id) => router.push(`/(app)/tournament/${id}` as never)} />
  );
}
