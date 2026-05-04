import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NetworkConfig } from '../utils/NetworkConfig';

interface Category {
  id: string;
  name: string;
  user_id: string;
}

interface CategoryListProps {
  onCategorySelect?: (category: Category) => void;
  refreshTrigger?: number; // Trigger to refresh the list
}

export default function CategoryList({ onCategorySelect, refreshTrigger }: CategoryListProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        setError('Nu sunteți autentificat');
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
        console.log(`Loaded ${data.length} categories for current user`);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Nu s-au putut încărca categoriile');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Nu s-a putut conecta la server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    Alert.alert(
      'Ștergere categorie',
      `Sunteți sigur că doriți să ștergeți categoria "${categoryName}"?`,
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Șterge',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('access_token');
              if (!token) return;

              const baseUrl = await NetworkConfig.getBaseUrl();
              const response = await fetch(`${baseUrl}/category/${categoryId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (response.ok) {
                Alert.alert('Succes', 'Categoria a fost ștearsă');
                fetchCategories(); // Refresh the list
              } else {
                const errorData = await response.json();
                Alert.alert('Eroare', errorData.detail || 'Nu s-a putut șterge categoria');
              }
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Eroare', 'Nu s-a putut conecta la server');
            }
          },
        },
      ]
    );
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <View style={styles.categoryItem}>
      <TouchableOpacity
        style={styles.categoryContent}
        onPress={() => onCategorySelect?.(item)}
      >
        <Text style={styles.categoryName}>{item.name}</Text>
    
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteCategory(item.id, item.name)}
      >
        <Text style={styles.deleteButtonText}>Șterge</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Se încarcă categoriile...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCategories}>
            <Text style={styles.retryButtonText}>Reîncearcă</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Categoriile tale</Text>
      {categories.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Nu ai nicio categorie adăugată</Text>
          <Text style={styles.emptySubtext}>Adaugă o categorie pentru a o vedea aici</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 10,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryInfo: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
