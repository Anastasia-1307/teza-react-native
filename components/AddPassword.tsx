import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CryptoUtils } from '../utils/CryptoUtils';
import { NetworkConfig } from '../utils/NetworkConfig';

interface Category {
  id: string;
  name: string;
  user_id: string;
}

interface Password {
  id: string;
  site_name: string;
  url: string;
  login: string;
  password_encrypted: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  category_id: string | null;
  category_name?: string; 
}

export default function AddPassword() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [note, setNote] = useState('');
  const [url, setUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // Password list states
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [passwordsLoading, setPasswordsLoading] = useState(true);
  const [passwordsError, setPasswordsError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // State for managing password visibility
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const baseUrl = await NetworkConfig.getBaseUrl();
      const response = await fetch(`${baseUrl}/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        console.log(` Loaded ${data.length} categories for password form`);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch categories:', errorData.detail);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Fetch passwords from API
  const fetchPasswords = async () => {
    try {
      setPasswordsLoading(true);
      setPasswordsError(null);
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const baseUrl = await NetworkConfig.getBaseUrl();
      const response = await fetch(`${baseUrl}/passwords`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPasswords(data);
        console.log(` Loaded ${data.length} passwords for user`);
        console.log(' Password data structure:', data[0]); // Log first password to see structure
      } else {
        const errorData = await response.json();
        setPasswordsError(errorData.detail || 'Failed to fetch passwords');
        console.error('Failed to fetch passwords:', errorData.detail);
      }
    } catch (error) {
      setPasswordsError('Network error');
      console.error('Error fetching passwords:', error);
    } finally {
      setPasswordsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchPasswords();
    
    // Test encryption/decryption
    console.log(' Running encryption test...');
    const testResult = CryptoUtils.testEncryption();
    console.log(' Encryption test result:', testResult);
  }, []);

  // Refresh both categories and passwords when coming back from AddCategory
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCategories();
      fetchPasswords();
    });
    return unsubscribe;
  }, [navigation]);

  // Refresh passwords when refreshTrigger changes
  useEffect(() => {
    fetchPasswords();
  }, [refreshTrigger]);

  const handleSavePassword = async () => {
    if (!title.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Eroare', 'Te rugăm completează câmpurile obligatorii - Serviciul, Username, Parola');
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        Alert.alert('Eroare', 'Nu ești autentificat');
        return;
      }

      const baseUrl = await NetworkConfig.getBaseUrl();
      const passwordData = {
        site_name: title.trim(),
        url: url.trim(),
        login: username.trim(),
        password: password.trim(),
        description: note.trim(),
        category_id: selectedCategory?.id || null
      };

      const response = await fetch(`${baseUrl}/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
      });

      if (response.ok) {
        Alert.alert('Succes', 'Parola a fost salvată cu succes!');
        // Reset form
        setTitle('');
        setUsername('');
        setPassword('');
        setNote('');
        setUrl('');
        setSelectedCategory(null);
        // Refresh passwords list
        setRefreshTrigger(prev => prev + 1);
        // Also fetch passwords directly
        fetchPasswords();
      } else {
        const errorData = await response.json();
        Alert.alert('Eroare', errorData.detail || 'Nu s-a putut salva parola');
      }
    } catch (error) {
      console.error('Error saving password:', error);
      Alert.alert('Eroare', 'Nu s-a putut conecta la server');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setShowCategoryDropdown(false);
  };

  const handleAddCategory = () => {
    setShowCategoryDropdown(false);
    navigation.navigate('Adaugă categorie' as never);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (passwordId: string) => {
    console.log('Toggle password visibility called for ID:', passwordId);
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(passwordId)) {
        newSet.delete(passwordId);
        console.log('Password hidden:', passwordId);
      } else {
        newSet.add(passwordId);
        console.log('Password shown:', passwordId);
      }
      return newSet;
    });
  };

  // Delete password
  const handleDeletePassword = async (passwordId: string) => {
    Alert.alert(
      'Ștergere parolă',
      'Ești sigur că vrei să ștergi această parolă?',
      [
        {
          text: 'Anulează',
          style: 'cancel',
        },
        {
          text: 'Șterge',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('access_token');
              if (!token) {
                Alert.alert('Eroare', 'Nu ești autentificat');
                return;
              }

              const baseUrl = await NetworkConfig.getBaseUrl();
              const response = await fetch(`${baseUrl}/password/${passwordId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (response.ok) {
                Alert.alert('Succes', 'Parola a fost ștearsă');
                // Refresh passwords list
                setRefreshTrigger(prev => prev + 1);
              } else {
                const errorData = await response.json();
                Alert.alert('Eroare', errorData.detail || 'Nu s-a putut șterge parola');
              }
            } catch (error) {
              console.error('Error deleting password:', error);
              Alert.alert('Eroare', 'Nu s-a putut conecta la server');
            }
          },
        },
      ]
    );
  };

  // Get decrypted password
  const getDecryptedPassword = (passwordEncrypted: string) => {
    try {
      return CryptoUtils.decrypt(passwordEncrypted);
    } catch (error) {
      console.error('Error decrypting password:', error);
      return 'Eroare la decriptare';
    }
  };

  const getCategoryDisplayText = () => {
    if (selectedCategory) {
      return selectedCategory.name;
    }
    return categoriesLoading ? 'Se încarcă...' : 'Selectează o categorie';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.header}>Adaugă parolă</Text>
          
          <Text>Serviciul</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle}/>
          
          <Text>URL</Text>
          <TextInput style={styles.input} value={url} onChangeText={setUrl}/>
          <Text>Username</Text>
          <TextInput style={styles.input} value={username} onChangeText={setUsername}/>
          <Text>Parola</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword}/>
          
          <Text>Categorie</Text>
          <View style={styles.categoryContainer}>
            <TextInput 
              style={styles.input} 
              value={getCategoryDisplayText()} 
              placeholder="Selectează o categorie"
              editable={false}
            />
            <TouchableOpacity 
              style={styles.categoryButton}
              onPress={() => setShowCategoryDropdown(true)}
              disabled={categoriesLoading}
            >
              {categoriesLoading ? (
                <ActivityIndicator size="small" color="#666" />
              ) : (
                <Text style={styles.categoryButtonText}>▼</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <Text>Notițe</Text>
          <TextInput style={styles.textArea} value={note} onChangeText={setNote} multiline={true} numberOfLines={4}/>
          
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleSavePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Salvează</Text>
            )}
          </TouchableOpacity>
          <View style={{ height: 30 }} />
       {/* Passwords List Section */}
<View style={styles.passwordsSection}>
  <Text style={styles.passwordsHeader}>Parolele tale</Text>
  
  {passwordsLoading ? (
    <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />
  ) : passwordsError ? (
    <Text style={styles.errorText}>{passwordsError}</Text>
  ) : passwords.length === 0 ? (
    <Text style={styles.noPasswordsText}>Nu ai nicio parolă salvată</Text>
  ) : (
    <ScrollView style={styles.passwordsList}>
      {passwords.map((password) => (
        <View key={password.id} style={styles.passwordItem}>
          <Text style={styles.passwordSiteName}>{password.site_name}</Text>
          <Text style={styles.passwordLogin}>{password.login}</Text>
          
          {password.category_name && (
            <Text style={styles.passwordCategory}>Categorie: {password.category_name}</Text>
          )}
          
          {password.url && (
            <Text style={styles.passwordUrl}>URL: {password.url}</Text>
          )}
          
          {password.description && (
            <Text style={styles.passwordNotes}>Note: {password.description}</Text>
          )}
          
          {/* Password field with toggle visibility */}
          <View style={styles.passwordContainer}>
            <Text style={styles.passwordLabel}>Parola:</Text>
            <View style={styles.passwordRow}>
              <Text style={styles.passwordValue}>
                {visiblePasswords.has(password.id) 
                  ? getDecryptedPassword(password.password_encrypted)
                  : '••••••••'
                }
              </Text>
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => togglePasswordVisibility(password.id)}
              >
                <Ionicons
                  name={visiblePasswords.has(password.id) ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Delete button */}
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeletePassword(password.id)}
          >
            <Ionicons
              name="trash"
              size={18}
              color="#f44336"
            />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  )}
</View>

        {/* Category Dropdown Modal */}
        <Modal
          visible={showCategoryDropdown}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCategoryDropdown(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCategoryDropdown(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Selectează o categorie</Text>
              
              {categories.length === 0 ? (
                <View style={styles.noCategoriesContainer}>
                  <Text style={styles.noCategoriesText}>Nu ai nicio categorie</Text>
                  <TouchableOpacity 
                    style={styles.addCategoryButton}
                    onPress={handleAddCategory}
                  >
                    <Text style={styles.addCategoryButtonText}>Adaugă o categorie</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView style={styles.categoriesList}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryOption,
                        selectedCategory?.id === category.id && styles.selectedCategoryOption
                      ]}
                      onPress={() => handleCategorySelect(category)}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        selectedCategory?.id === category.id && styles.selectedCategoryOptionText
                      ]}>
                        {category.name}
                      </Text>
                      {selectedCategory?.id === category.id && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowCategoryDropdown(false)}
              >
                <Text style={styles.cancelButtonText}>Anulează</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  buttonDisabled: {
    backgroundColor: '#ccc'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    height: 100,         
    textAlignVertical: 'top',
    marginBottom: 30
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  categoryButton: {
    marginLeft: 10,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  categoryButtonText: {
    fontSize: 16,
    color: '#666'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%'
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },
  noCategoriesContainer: {
    alignItems: 'center',
    paddingVertical: 20
  },
  noCategoriesText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15
  },
  addCategoryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  addCategoryButtonText: {
    color: 'white',
    fontWeight: '600'
  },
  categoriesList: {
    maxHeight: 300
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  selectedCategoryOption: {
    backgroundColor: '#e3f2fd'
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#333'
  },
  selectedCategoryOptionText: {
    fontWeight: '600',
    color: '#2196F3'
  },
  checkmark: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold'
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600'
  },
  passwordsSection: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 20
  },
  passwordsHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15
  },
  passwordsList: {
    flex: 1
  },
  passwordItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    position: 'relative'
  },
  passwordSiteName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  passwordLogin: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3
  },
  passwordUrl: {
    fontSize: 12,
    color: '#4CAF50',
    marginBottom: 3
  },
  passwordCategory: {
    fontSize: 12,
    color: '#2196F3',
    fontStyle: 'italic'
  },
  passwordNotes: {
    fontSize: 12,
    color: '#FF9800',
    marginBottom: 8,
    fontStyle: 'italic'
  },
  passwordContainer: {
    marginTop: 8,
    marginBottom: 4
  },
  passwordLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  passwordValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontWeight: '500'
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#ffebee'
  },
  errorText: {
    color: '#f44336',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16
  },
  noPasswordsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16
  },
  
});