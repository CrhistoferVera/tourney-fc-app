import { useState } from 'react';
import { MapPin, Users, MinusCircle, PlusCircle, Shield } from 'lucide-react-native';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Campo, TournamentFormat } from '../../services/tournamentService';
import MapPickerModal from './MapPickerModal';

interface Props {
  maxEquipos: number;
  campos: Campo[];
  formato: TournamentFormat | '';
  onChangeEquipos: (n: number) => void;
  onChangeCampos: (campos: Campo[]) => void;
  error?: string;
}

export default function Step3({
  maxEquipos,
  campos,
  formato,
  onChangeEquipos,
  onChangeCampos,
  error,
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

  const handleMapConfirm = (data: { direccion: string; latitud: number; longitud: number }) => {
    if (editingIndex !== null) {
      onChangeCampos(
        campos.map((c, i) =>
          i === editingIndex
            ? { ...c, direccion: data.direccion, latitud: data.latitud, longitud: data.longitud }
            : c,
        ),
      );
    }
    setEditingIndex(null);
  };

  const validCopa = [4, 8, 16, 32];

  const handleMinus = () => {
    if (formato === 'COPA') {
      const idx = validCopa.indexOf(maxEquipos);
      if (idx > 0) onChangeEquipos(validCopa[idx - 1]);
      else if (idx === -1) {
        const closest = validCopa.slice().reverse().find(x => x < maxEquipos);
        onChangeEquipos(closest || 4);
      }
    } else {
      const next = maxEquipos % 2 === 0 ? maxEquipos - 2 : maxEquipos - 1;
      onChangeEquipos(Math.max(4, next));
    }
  };

  const handlePlus = () => {
    if (formato === 'COPA') {
      const idx = validCopa.indexOf(maxEquipos);
      if (idx !== -1 && idx < validCopa.length - 1) onChangeEquipos(validCopa[idx + 1]);
      else if (idx === -1) {
        const closest = validCopa.find(x => x > maxEquipos);
        onChangeEquipos(closest || 32);
      }
    } else {
      const next = maxEquipos % 2 === 0 ? maxEquipos + 2 : maxEquipos + 1;
      onChangeEquipos(Math.min(32, next));
    }
  };

  return (
    <>
      {/* Contador de equipos */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: '#EBF0EC',
          paddingVertical: 20,
          paddingHorizontal: 16,
          marginBottom: 20,
          alignItems: 'center',
          elevation: 2,
          shadowColor: '#0F1A14',
          shadowOpacity: 0.04,
          shadowRadius: 8,
        }}
      >
        {/* Ícono + label */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 }}>
          <View
            style={{
              backgroundColor: '#D4F5E2',
              borderRadius: 10,
              padding: 6,
            }}
          >
            <Shield size={18} color="#0D7A3E" />
          </View>
          <Text style={{ color: '#3D4F44', fontFamily: 'Inter_500Medium', fontSize: 13 }}>
            Número de equipos
          </Text>
        </View>

        {/* Controles */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
          <TouchableOpacity onPress={handleMinus} activeOpacity={0.7}>
            <MinusCircle size={40} color="#0D7A3E" strokeWidth={1.5} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 52,
                color: '#0D7A3E',
                lineHeight: 58,
              }}
            >
              {maxEquipos}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Users size={12} color="#3D4F44" />
              <Text style={{ color: '#3D4F44', fontSize: 11, fontFamily: 'Inter_400Regular' }}>
                Cant. Equipos
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={handlePlus} activeOpacity={0.7}>
            <PlusCircle size={40} color="#0D7A3E" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Canchas */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ backgroundColor: '#D4F5E2', borderRadius: 8, padding: 5 }}>
            <MapPin size={14} color="#0D7A3E" />
          </View>
          <Text style={{ color: '#3D4F44', fontFamily: 'Inter_500Medium', fontSize: 13 }}>
            Canchas de juego
          </Text>
        </View>
        <TouchableOpacity onPress={addCampo}>
          <Text style={{ color: '#0D7A3E', fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
            + Agregar
          </Text>
        </TouchableOpacity>
      </View>

      {campos.length === 0 ? (
        <TouchableOpacity
          onPress={addCampo}
          style={{
            backgroundColor: '#FFFFFF',
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: '#0D7A3E',
            borderRadius: 18,
            paddingVertical: 24,
            alignItems: 'center',
          }}
        >
          <View style={{ backgroundColor: '#D4F5E2', borderRadius: 12, padding: 8, marginBottom: 8 }}>
            <MapPin size={20} color="#0D7A3E" />
          </View>
          <Text style={{ color: '#0D7A3E', fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
            + Agregar primera cancha
          </Text>
        </TouchableOpacity>
      ) : (
        campos.map((campo, i) => (
          <View
            key={i}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: '#EBF0EC',
              elevation: 1,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ backgroundColor: '#D4F5E2', borderRadius: 8, padding: 4 }}>
                  <MapPin size={12} color="#0D7A3E" />
                </View>
                <Text style={{ color: '#3D4F44', fontSize: 12, fontFamily: 'Inter_500Medium' }}>
                  Cancha {i + 1}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeCampo(i)}>
                <Text style={{ color: '#E53935', fontSize: 12 }}>Eliminar</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Nombre de la cancha"
              placeholderTextColor="#A8B5AE"
              value={campo.nombre}
              onChangeText={(v) => updateCampo(i, 'nombre', v)}
              style={{ color: '#0F1A14', fontFamily: 'Inter_400Regular', fontSize: 13, borderBottomWidth: 1, borderBottomColor: '#EBF0EC', paddingVertical: 8, marginBottom: 8 }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                placeholder="Dirección"
                placeholderTextColor="#A8B5AE"
                value={campo.direccion}
                onChangeText={(v) => updateCampo(i, 'direccion', v)}
                style={{ flex: 1, color: '#0F1A14', fontFamily: 'Inter_400Regular', fontSize: 13, paddingVertical: 8 }}
              />
              <TouchableOpacity
                onPress={() => openMap(i)}
                style={{
                  marginLeft: 8,
                  backgroundColor: '#D4F5E2',
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <MapPin size={13} color="#0D7A3E" />
                <Text style={{ color: '#0D7A3E', fontSize: 12, fontFamily: 'Inter_500Medium' }}>Mapa</Text>
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

      {error ? <Text className="text-danger text-xs mt-2">{error}</Text> : null}
    </>
  );
}
