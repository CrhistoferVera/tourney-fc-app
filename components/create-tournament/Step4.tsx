import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';

interface Props {
  staffEmails: string[];
  onChange: (emails: string[]) => void;
}

export default function Step4({ staffEmails, onChange }: Props) {
  const [emailInput, setEmailInput] = useState('');

  const addEmail = () => {
    const trimmed = emailInput.trim();
    if (!trimmed || !trimmed.includes('@')) return;
    if (staffEmails.includes(trimmed)) return;
    onChange([...staffEmails, trimmed]);
    setEmailInput('');
  };

  const removeEmail = (email: string) => onChange(staffEmails.filter((e) => e !== email));

  return (
    <>
      <Text className="text-night font-sans-medium text-base mb-1">Añadir staff al torneo</Text>
      <Text className="text-carbon text-sm mb-4">
        Invita personas para ayudarte a gestionar el torneo. Ingresa su correo electrónico.
      </Text>
      <View className="flex-row items-center gap-2 mb-4">
        <TextInput
          value={emailInput}
          onChangeText={setEmailInput}
          placeholder="correo@ejemplo.com"
          placeholderTextColor="#3D4F44"
          keyboardType="email-address"
          autoCapitalize="none"
          className="flex-1 bg-white rounded-xl px-4 py-3 text-night font-sans text-sm border border-mist"
          onSubmitEditing={addEmail}
        />
        <TouchableOpacity
          onPress={addEmail}
          className="bg-primary w-11 h-11 rounded-xl items-center justify-center"
        >
          <Text className="text-white text-xl">＋</Text>
        </TouchableOpacity>
      </View>
      {staffEmails.length === 0 ? (
        <View className="bg-white rounded-2xl px-4 py-6 items-center border border-mist">
          <Text className="text-carbon text-sm text-center">
            No has añadido staff aún. Puedes omitir este paso si prefieres.
          </Text>
        </View>
      ) : (
        staffEmails.map((email) => (
          <View
            key={email}
            className="bg-white rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between border border-mist"
          >
            <Text className="text-night font-sans text-sm flex-1">{email}</Text>
            <TouchableOpacity onPress={() => removeEmail(email)}>
              <Text className="text-danger text-sm">✕</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </>
  );
}
