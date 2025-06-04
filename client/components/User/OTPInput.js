import React, { useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

const OTPInput = ({ value, onChange }) => {
  const inputs = useRef([]);

  useEffect(() => {
    if (value.length < 6) {
      onChange(value.padEnd(6, ''));
    }
  }, [value]);

  const handleChange = (text, index) => {
    if (/^\d$/.test(text)) {
      const newOtp = value.split('');
      newOtp[index] = text;
      onChange(newOtp.join(''));

      if (index < 5) {
        inputs.current[index + 1].focus();
      }
    } else if (text === '') {
      const newOtp = value.split('');
      newOtp[index] = '';
      onChange(newOtp.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && value[index] === '') {
      if (index > 0) {
        inputs.current[index - 1].focus();
      }
    }
  };

  return (
    <View style={styles.container}>
      {Array(6).fill(0).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputs.current[index] = ref)}
          value={value[index] || ''}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="numeric"
          maxLength={1}
          style={styles.input}
        />
      ))}
    </View>
  );
};

export default OTPInput;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    width: 45,
    height: 60,
    textAlign: 'center',
    fontSize: 20,
    borderRadius: 5,
    fontWeight: 'bold'
  },
});
