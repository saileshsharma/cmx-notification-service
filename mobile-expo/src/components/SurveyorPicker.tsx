import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Surveyor } from '../types';

interface Props {
  surveyors: Surveyor[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  disabled?: boolean;
}

export const SurveyorPicker: React.FC<Props> = ({
  surveyors,
  selectedId,
  onSelect,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <Picker
        selectedValue={selectedId}
        onValueChange={(value) => onSelect(value)}
        enabled={!disabled}
        style={styles.picker}
      >
        <Picker.Item label="-- Select a Surveyor --" value={null} />
        {surveyors.map((surveyor) => (
          <Picker.Item
            key={surveyor.id}
            label={`${surveyor.display_name} (${surveyor.surveyor_type})`}
            value={surveyor.id}
          />
        ))}
      </Picker>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
});
