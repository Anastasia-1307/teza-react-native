import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NetworkConfig } from '../utils/NetworkConfig';
import CategoryList from './CategoryList';

interface Category {
  id: string;
  name: string;
  user_id: string;
}

export default function AddCategory() {
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Eroare', 'Te rugăm introdu numele categoriei');
      return;
    }

    setLoading(true);
    try {
      const baseUrl = await NetworkConfig.getBaseUrl();
      const token = await getAuthToken();
      
      if (!token) {
        return;
      }
      
      const response = await fetch(`${baseUrl}/category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: categoryName.trim()
        }),
      });

      if (response.ok) {
        // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If not JSON, create a generic error structure
        const text = await response.text();
        data = { name: 'Category saved' };
        console.error('Non-JSON response from server in AddCategory:', text);
      }
        Alert.alert('Succes', `Categoria "${data.name}" a fost salvată cu succes!`);
        setCategoryName('');
        setRefreshTrigger(prev => prev + 1); // Trigger refresh of category list
      } else {
        // Check if response is actually JSON before parsing
        const contentType = response.headers.get('content-type');
        let errorData;
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          // If not JSON, create a generic error structure
          const text = await response.text();
          errorData = { detail: 'Server error occurred' };
          console.error('Non-JSON response from server in AddCategory error:', text);
        }
        Alert.alert('Eroare', errorData.detail || 'Nu s-a putut salva categoria');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Eroare', 'Nu s-a putut conecta la server. Verifică conexiunea la internet.');
    } finally {
      setLoading(false);
    }
  };

  // Get the authentication token from SecureStore
  const getAuthToken = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        Alert.alert('Eroare', 'Nu ești autentificat. Te rugăm să te autentifici din nou.');
        return null;
      }
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      Alert.alert('Eroare', 'Nu s-a putut obține token-ul de autentificare.');
      return null;
    }
  };

  const handleCategorySelect = (category: Category) => {
    Alert.alert('Categorie selectată', `Ai selectat categoria: ${category.name}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Add Category Form */}
        <View style={styles.formContainer}>
          <Text style={styles.header}>Adaugă categorie</Text>
          
          <Text style={styles.label}>Nume categorie</Text>
          <TextInput 
            style={styles.input} 
            value={categoryName} 
            onChangeText={setCategoryName}
            placeholder="Ex: Social Media, Banking, etc."
            editable={!loading}
          />
          
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleSaveCategory}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Salvează categoria</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Category List - fără ScrollView suplimentar */}
        <CategoryList 
          onCategorySelect={handleCategorySelect}
          refreshTrigger={refreshTrigger}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  formContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30
  },
  buttonDisabled: {
    backgroundColor: '#ccc'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  listContainer: {
    flex: 1,
  }
});