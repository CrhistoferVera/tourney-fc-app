import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import ShieldDisplay, { PRESETS } from '../tournament/ShieldDisplay';
import { uploadEscudo } from '../../services/teamsService';

interface Props {
  readonly escudo: string | null;
  readonly localPreviewUri: string | null;
  readonly uploading: boolean;
  readonly onChange: (escudo: string | null, localUri: string | null) => void;
  readonly onUploadingChange: (uploading: boolean) => void;
  readonly onError: (title: string, message: string) => void;
}

export default function EscudoPicker({
  escudo,
  localPreviewUri,
  uploading,
  onChange,
  onUploadingChange,
  onError,
}: Props) {
  const isCustomImage = !!localPreviewUri;
  let escudoLabel = 'Sin escudo — se usará el predeterminado';
  if (isCustomImage) escudoLabel = 'Imagen personalizada';
  else if (escudo?.startsWith('preset_')) escudoLabel = 'Escudo genérico seleccionado';

  const handlePickGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      onError('Permiso requerido', 'Necesitas dar acceso a la galería para subir una imagen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    onUploadingChange(true);
    try {
      const formData = new FormData();
      formData.append('image', { uri: asset.uri, name: 'escudo.jpg', type: 'image/jpeg' } as any);
      const { url } = await uploadEscudo(formData);
      onChange(url, asset.uri);
    } catch {
      onError('Error', 'No se pudo subir la imagen. Intenta de nuevo.');
    } finally {
      onUploadingChange(false);
    }
  };

  return (
    <View>
      <View
        className="bg-white rounded-2xl p-5 mb-4 items-center"
        style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
      >
        {isCustomImage ? (
          <Image
            source={{ uri: localPreviewUri }}
            style={{ width: 88, height: 88, borderRadius: 18 }}
            resizeMode="cover"
          />
        ) : (
          <ShieldDisplay escudo={escudo} size={88} />
        )}
        <Text className="text-carbon text-xs mt-3 text-center">{escudoLabel}</Text>
      </View>

      <Text className="text-carbon text-xs font-sans-medium mb-2 uppercase tracking-wide">
        Escudos genéricos
      </Text>
      <View className="flex-row flex-wrap gap-3 mb-4">
        {PRESETS.map((preset) => {
          const selected = escudo === preset.id && !localPreviewUri;
          return (
            <TouchableOpacity
              key={preset.id}
              activeOpacity={0.8}
              onPress={() => onChange(preset.id, null)}
              style={{
                borderWidth: 3,
                borderColor: selected ? '#0F1A14' : 'transparent',
                borderRadius: 17,
                padding: 2,
              }}
            >
              <ShieldDisplay escudo={preset.id} size={52} />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={handlePickGallery}
        disabled={uploading}
        activeOpacity={0.8}
        className="bg-white rounded-xl px-4 py-3 flex-row items-center gap-3 mb-2 border border-mist"
        style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.04, shadowRadius: 4 }}
      >
        {uploading ? (
          <ActivityIndicator color="#0D7A3E" size="small" />
        ) : (
          <Feather name="image" size={20} color="#0D7A3E" />
        )}
        <Text className="text-night font-sans-medium text-sm flex-1">
          {uploading ? 'Subiendo imagen...' : 'Elegir de galería'}
        </Text>
        {!uploading && <Feather name="chevron-right" size={16} color="#3D4F44" />}
      </TouchableOpacity>
    </View>
  );
}
