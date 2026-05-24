import { View, Text } from 'react-native';
import { FileText, Swords, Users, ClipboardCheck } from 'lucide-react-native';

const TOTAL_STEPS = 4;

const STEP_CONFIG = [
  { label: 'Datos',    icon: FileText,       color: '#1A73E8', bg: '#EAF2FB' },
  { label: 'Formato',  icon: Swords,         color: '#F5820D', bg: '#FEF0DC' },
  { label: 'Equipos',  icon: Users,          color: '#0D7A3E', bg: '#D4F5E2' },
  { label: 'Resumen',  icon: ClipboardCheck, color: '#6B7A72', bg: '#EBF0EC' },
];

interface Props {
  step: number;
}

export default function ProgressBar({ step }: Props) {
  return (
    <>
      {/* Barra de progreso lineal */}
      <View className="flex-row gap-1 mb-4">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
          const cfg = STEP_CONFIG[i];
          return (
            <View
              key={i}
              style={{
                height: 4,
                flex: 1,
                borderRadius: 99,
                backgroundColor: i < step ? cfg.color : '#EBF0EC',
              }}
            />
          );
        })}
      </View>

      {/* Íconos de paso */}
      <View className="flex-row justify-between mb-6">
        {STEP_CONFIG.map((cfg, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === step;
          const isDone = stepNum < step;
          const Icon = cfg.icon;
          return (
            <View key={i} className="items-center" style={{ flex: 1 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isActive || isDone ? cfg.bg : '#EBF0EC',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: isActive ? 2 : 0,
                  borderColor: isActive ? cfg.color : 'transparent',
                }}
              >
                <Icon
                  size={18}
                  color={isActive || isDone ? cfg.color : '#A8B5AE'}
                />
              </View>
              <Text
                style={{
                  fontSize: 10,
                  marginTop: 4,
                  fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  color: isActive ? cfg.color : isDone ? '#3D4F44' : '#A8B5AE',
                }}
              >
                {cfg.label}
              </Text>
            </View>
          );
        })}
      </View>
    </>
  );
}
