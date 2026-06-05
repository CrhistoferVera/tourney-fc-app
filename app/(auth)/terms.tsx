import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

const LAST_UPDATE = '5 de junio de 2026';

interface Section {
  title: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    title: '1. Aceptación de los términos',
    body: 'Al crear una cuenta y utilizar TourneyFC, aceptas estos Términos y Condiciones y nuestra Política de Privacidad. Si no estás de acuerdo con ellos, no deberás registrarte ni usar la aplicación.',
  },
  {
    title: '2. Descripción del servicio',
    body: 'TourneyFC es una plataforma para organizar y participar en torneos de fútbol amateur: permite crear torneos, inscribir equipos, gestionar jugadores, programar partidos y registrar resultados. El servicio se ofrece "tal cual" y puede cambiar o actualizarse con el tiempo.',
  },
  {
    title: '3. Registro y cuenta',
    body: 'Debes proporcionar información veraz y mantenerla actualizada. Eres responsable de la confidencialidad de tu contraseña y de toda la actividad realizada desde tu cuenta. Debes notificarnos si detectas un uso no autorizado.',
  },
  {
    title: '4. Uso aceptable',
    body: 'Te comprometes a no usar la plataforma para fines ilícitos, a no suplantar la identidad de otras personas, a no publicar contenido ofensivo, difamatorio o que infrinja derechos de terceros, y a no intentar dañar, sobrecargar o vulnerar la seguridad del servicio.',
  },
  {
    title: '5. Contenido del usuario',
    body: 'Eres responsable de la información que registras (nombres de equipos, jugadores, escudos, resultados, etc.). Al subirla, nos otorgas permiso para mostrarla dentro de la aplicación con el fin de operar el servicio. Podemos retirar contenido que incumpla estos términos.',
  },
  {
    title: '6. Privacidad y datos personales',
    body: 'Recopilamos los datos necesarios para operar la aplicación (nombre, correo electrónico, zona y foto de perfil opcional). No vendemos tus datos personales a terceros. Utilizamos tu correo únicamente para autenticación y recuperación de cuenta.',
  },
  {
    title: '7. Responsabilidad',
    body: 'TourneyFC no se hace responsable de la organización física de los torneos, acuerdos entre equipos, ni de disputas entre usuarios. La aplicación es una herramienta de gestión y no garantiza la disponibilidad ininterrumpida del servicio.',
  },
  {
    title: '8. Cancelación',
    body: 'Puedes dejar de usar la aplicación en cualquier momento. Nos reservamos el derecho de suspender o cancelar cuentas que incumplan estos términos.',
  },
  {
    title: '9. Cambios en los términos',
    body: 'Podemos actualizar estos Términos y Condiciones. Si los cambios son relevantes, te lo notificaremos dentro de la aplicación. El uso continuado tras una actualización implica la aceptación de los nuevos términos.',
  },
  {
    title: '10. Contacto',
    body: 'Si tienes dudas sobre estos términos, puedes escribirnos a soporte@tourneyfc.app.',
  },
];

export default function TermsScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3" hitSlop={8}>
          <ArrowLeft color={Colors.white} size={22} />
        </Pressable>
        <Text className="text-white text-xl font-sans-medium flex-1">
          Términos y Condiciones
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-carbon text-xs mb-6">
          Última actualización: {LAST_UPDATE}
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.title} className="mb-6">
            <Text className="text-night text-base font-sans-bold mb-2">
              {section.title}
            </Text>
            <Text className="text-carbon text-sm leading-6">{section.body}</Text>
          </View>
        ))}

        <Pressable
          className="bg-primary rounded-md py-4 mt-2 active:opacity-80"
          onPress={() => router.back()}
        >
          <Text className="text-white text-center font-sans-bold">
            Entendido
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
