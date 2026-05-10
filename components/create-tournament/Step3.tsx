import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Campo } from '../../services/tournamentService';
import MapPickerModal from './MapPickerModal';

interface Props {
  maxEquipos: number;
  campos: Campo[];
  onChangeEquipos: (n: number) => void;
  onChangeCampos: (campos: Campo[]) => void;
}

export default function Step3({ maxEquipos, campos, onChangeEquipos, onChangeCampos }: Props) {
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

  return (
    <>
      <View className="items-center mb-6">
        <Text className="text-carbon text-sm font-sans-medium mb-3">Número de equipos</Text>
        <View className="flex-row items-center gap-6">
          <TouchableOpacity
            onPress={() => onChangeEquipos(Math.max(2, maxEquipos - 2))}
            className="w-10 h-10 rounded-full bg-white border border-mist items-center justify-center"
          >
            <Text className="text-primary text-xl font-sans-medium">−</Text>
          </TouchableOpacity>
          <Text className="text-primary text-3xl font-sans-medium w-12 text-center">
            {maxEquipos}
          </Text>
          <TouchableOpacity
            onPress={() => onChangeEquipos(maxEquipos + 2)}
            className="w-10 h-10 rounded-full bg-white border border-mist items-center justify-center"
          >
            <Text className="text-primary text-xl font-sans-medium">＋</Text>
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
