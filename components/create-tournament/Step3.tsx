import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Campo, TournamentFormat } from '../../services/tournamentService';
import MapPickerModal from './MapPickerModal';

interface Props {
  maxEquipos: number;
  campos: Campo[];
  formato: TournamentFormat | '';
  onChangeEquipos: (n: number) => void;
  onChangeCampos: (campos: Campo[]) => void;
}

export default function Step3({
  maxEquipos,
  campos,
  formato,
  onChangeEquipos,
  onChangeCampos,
}: Props) {
  const [mapOpen, setMapOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addCampo = () => onChangeCampos([...campos, { nombre: '', direccion: '' }]);

  const updateCampo = (index: number, key: keyof Campo, value: string) => {
    onChangeCampos(campos.map((c, i) => (i === index ? { ...c, [key]: value } : c)));
  };

  const removeCampo = (index: number) => onChangeCampos(campos.filter((_, i) => i !== index));

  const openMap = (index: number) => {
    setEditingIndex(index);
    setMapOpen(true);
  };

  const handleMapConfirm = (address: string) => {
    if (editingIndex !== null) {
      updateCampo(editingIndex, 'direccion', address);
    }
    setEditingIndex(null);
  };

  const validCopa = [4, 8, 16, 32];

  const handleMinus = () => {
    if (formato === 'COPA') {
      const idx = validCopa.indexOf(maxEquipos);
      if (idx > 0) onChangeEquipos(validCopa[idx - 1]);
    } else {
      onChangeEquipos(Math.max(2, maxEquipos - 2));
    }
  };

  const handlePlus = () => {
    if (formato === 'COPA') {
      const idx = validCopa.indexOf(maxEquipos);
      if (idx < validCopa.length - 1) onChangeEquipos(validCopa[idx + 1]);
    } else {
      onChangeEquipos(Math.min(32, maxEquipos + 2)); // Limit to 32
    }
  };

  return (
    <>
      <View className="items-center mb-6">
        <Text className="text-carbon text-sm font-sans-medium mb-3">Número de equipos</Text>
        <View className="flex-row items-center gap-6">
          <TouchableOpacity
            onPress={handleMinus}
            className="w-12 h-12 rounded-full bg-white border border-mist items-center justify-center shadow-sm"
          >
            <Text className="text-primary text-2xl font-sans-medium">−</Text>
          </TouchableOpacity>
          <Text className="text-primary text-4xl font-sans-bold w-16 text-center">
            {maxEquipos}
          </Text>
          <TouchableOpacity
            onPress={handlePlus}
            className="w-12 h-12 rounded-full bg-white border border-mist items-center justify-center shadow-sm"
          >
            <Text className="text-primary text-2xl font-sans-medium">+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-carbon text-sm font-sans-medium">Canchas de juego</Text>
        <TouchableOpacity onPress={addCampo}>
          <Text className="text-primary text-sm font-sans-medium">+ Agregar cancha</Text>
        </TouchableOpacity>
      </View>

      {campos.length === 0 ? (
        <TouchableOpacity
          onPress={addCampo}
          className="bg-white border border-dashed border-primary rounded-2xl px-4 py-6 items-center"
        >
          <Text className="text-primary font-sans-medium text-sm">+ Agregar primera cancha</Text>
        </TouchableOpacity>
      ) : (
        campos.map((campo, i) => (
          <View key={i} className="bg-white rounded-2xl px-4 py-3 mb-3 border border-mist">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-carbon text-xs font-sans-medium">Cancha {i + 1}</Text>
              <TouchableOpacity onPress={() => removeCampo(i)}>
                <Text className="text-danger text-xs">Eliminar</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Nombre de la cancha"
              placeholderTextColor="#3D4F44"
              value={campo.nombre}
              onChangeText={(v) => updateCampo(i, 'nombre', v)}
              className="text-night font-sans text-sm border-b border-mist py-2 mb-2"
            />
            <View className="flex-row items-center">
              <TextInput
                placeholder="Dirección"
                placeholderTextColor="#3D4F44"
                value={campo.direccion}
                onChangeText={(v) => updateCampo(i, 'direccion', v)}
                className="text-night font-sans text-sm py-2 flex-1"
              />
              <TouchableOpacity
                onPress={() => openMap(i)}
                className="ml-2 bg-primary-light rounded-lg px-2 py-1"
              >
                <Text className="text-primary text-xs">📍 Mapa</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <MapPickerModal
        visible={mapOpen}
        onClose={() => setMapOpen(false)}
        onConfirm={handleMapConfirm}
      />
    </>
  );
}
