import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

type ComplexityLevel = 'slab' | 'mediu' | 'puternic';

export default function PasswordGenerator() {
  const [password, setPassword] = useState('');
  const [lastPassword, setLastPassword] = useState('');
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
  });
  const [copied, setCopied] = useState(false);

  const generatePassword = useCallback(async () => {
    let charset = '';
    if (options.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.includeNumbers) charset += '0123456789';
    if (options.includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) {
      Alert.alert('Eroare', 'Selectează cel puțin un tip de caracter');
      return;
    }

    let newPassword = '';
    let attempts = 0;
    const maxAttempts = 10;

    do {
      // Use timestamp for each character generation
      newPassword = '';
      for (let i = 0; i < options.length; i++) {
        const seed = Date.now() + Math.random() * 1000000 + i;
        const random = () => {
          const x = Math.sin(seed) * 10000;
          return x - Math.floor(x);
        };
        newPassword += charset.charAt(Math.floor(random() * charset.length));
      }
      attempts++;
    } while (newPassword === lastPassword && attempts < maxAttempts);

    if (newPassword === lastPassword) {
      Alert.alert('Atenționare', 'S-a generat aceeași parolă. Încearcă din nou.');
      return;
    }

    setPassword(newPassword);
    setLastPassword(newPassword);
    setCopied(false);
  }, [options, lastPassword]);

  const getComplexity = (pwd: string): ComplexityLevel => {
    if (!pwd) return 'slab';

    let score = 0;
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd);

    if (hasLower) score++;
    if (hasUpper) score++;
    if (hasNumber) score++;
    if (hasSymbol) score++;

    if (pwd.length >= 12) score++;
    if (pwd.length >= 16) score++;

    if (score >= 5) return 'puternic';
    if (score >= 3) return 'mediu';
    return 'slab';
  };

  const getComplexityColor = (complexity: ComplexityLevel) => {
    switch (complexity) {
      case 'puternic': return '#4CAF50';
      case 'mediu': return '#FF9800';
      case 'slab': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getComplexityText = (complexity: ComplexityLevel) => {
    switch (complexity) {
      case 'puternic': return 'Puternic';
      case 'mediu': return 'Mediu';
      case 'slab': return 'Slab';
      default: return 'N/A';
    }
  };

  const copyToClipboard = async () => {
    if (!password) {
      Alert.alert('Eroare', 'Generează mai întâi o parolă');
      return;
    }

    try {
      await Clipboard.setStringAsync(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      Alert.alert('Eroare', 'Nu am putut copia parola');
    }
  };

  const complexity = getComplexity(password);
  const complexityColor = getComplexityColor(complexity);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Generator de parole</Text>
          <Text style={styles.subtitle}>Creează parole sigure complexe</Text>
        </View>

        <View style={styles.passwordContainer}>
          <Text style={styles.label}>Parola generată</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              placeholder="Accesează Generează pentru a crea o parolă"
              placeholderTextColor="#999"
              editable={false}
              multiline={true}
            />
            <TouchableOpacity
              style={[styles.copyButton, copied && styles.copiedButton]}
              onPress={copyToClipboard}
              disabled={!password}
            >
              <Ionicons
                name={copied ? "checkmark" : "copy"}
                size={20}
                color={password ? "#fff" : "#999"}
              />
            </TouchableOpacity>
          </View>
          
          {password && (
            <View style={styles.complexityContainer}>
              <Text style={styles.complexityLabel}>Complexitate:</Text>
              <Text style={[styles.complexityValue, { color: complexityColor }]}>
                {getComplexityText(complexity)}
              </Text>
              <View style={[styles.complexityBar, { backgroundColor: complexityColor }]} />
            </View>
          )}
        </View>

        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>Opțiuni parolă</Text>
          
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Lungime: {options.length}</Text>
            <View style={styles.lengthControls}>
              <TouchableOpacity
                style={styles.lengthButton}
                onPress={() => setOptions(prev => ({ ...prev, length: Math.max(4, prev.length - 1) }))}
              >
                <Ionicons name="remove" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.lengthButton}
                onPress={() => setOptions(prev => ({ ...prev, length: Math.min(32, prev.length + 1) }))}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.optionLabel}>Litere majuscule (A-Z)</Text>
            <Switch
              value={options.includeUppercase}
              onValueChange={(value) => setOptions(prev => ({ ...prev, includeUppercase: value }))}
              trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.optionLabel}>Litere minuscule (a-z)</Text>
            <Switch
              value={options.includeLowercase}
              onValueChange={(value) => setOptions(prev => ({ ...prev, includeLowercase: value }))}
              trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.optionLabel}>Numere (0-9)</Text>
            <Switch
              value={options.includeNumbers}
              onValueChange={(value) => setOptions(prev => ({ ...prev, includeNumbers: value }))}
              trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.optionLabel}>Simboluri (!@#$...)</Text>
            <Switch
              value={options.includeSymbols}
              onValueChange={(value) => setOptions(prev => ({ ...prev, includeSymbols: value }))}
              trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.generateButton} onPress={generatePassword}>
          <Ionicons name="refresh" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.generateButtonText}>Generează parolă</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  passwordContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    color: '#333',
    minHeight: 50,
    maxHeight: 100,
  },
  copyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  copiedButton: {
    backgroundColor: '#4CAF50',
  },
  complexityContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  complexityLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  complexityValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  complexityBar: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
  },
  lengthControls: {
    flexDirection: 'row',
    gap: 8,
  },
  lengthButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
