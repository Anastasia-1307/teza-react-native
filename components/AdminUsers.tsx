import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// @ts-ignore - NetworkConfig is JS file
import { NetworkConfig } from '../utils/NetworkConfig';

interface User {
  id: string;
  username: string;
  role: string;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);

  const fetchUsers = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const baseUrl = await NetworkConfig.getBaseUrl();
      console.log('AdminUsers - Token length:', token ? token.length : 'null');
      console.log('AdminUsers - Token first 20 chars:', token ? token.substring(0, 20) + '...' : 'null');
      console.log('AdminUsers - Base URL:', baseUrl);
      
      const response = await fetch(`${baseUrl}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
          data = [];
          console.error('Non-JSON response from server in AdminUsers:', text);
        }
        setUsers(data);
        
        // Get current user ID from token
        if (token) {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          setCurrentUserId(tokenPayload.sub);
        }
      } else {
        console.error('Failed to fetch users:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const baseUrl = await NetworkConfig.getBaseUrl();
      const response = await fetch(`${baseUrl}/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        // Check if response is actually JSON before parsing
        const contentType = response.headers.get('content-type');
        let responseData;
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          // If not JSON, create a generic error structure
          const text = await response.text();
          responseData = null;
          console.error('Non-JSON response from server in AdminUsers update:', text);
        }
        
        
        Alert.alert('Succes', responseData.message || 'Rolul utilizatorului a fost actualizat. Utilizatorul trebuie să se reautentifice pentru a vedea modificările.');
        fetchUsers();
        setRoleModalVisible(false);
        setSelectedUser(null);
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
          console.error('Non-JSON response from server in AdminUsers error:', text);
        }
        Alert.alert('Eroare', errorData.detail || 'Nu s-a putut actualiza rolul');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      Alert.alert('Eroare', 'Eroare de conexiune');
    }
  };

  const deleteUser = async (userId: string, username: string) => {
    Alert.alert(
      'Confirmare ștergere',
      `Ești sigur că vrei să ștergi utilizatorul "${username}"?`,
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
              const baseUrl = await NetworkConfig.getBaseUrl();
              const response = await fetch(`${baseUrl}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (response.ok) {
                Alert.alert('Succes', 'Utilizatorul a fost șters');
                fetchUsers();
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
          console.error('Non-JSON response from server in AdminUsers error:', text);
        }
                Alert.alert('Eroare', errorData.detail || 'Nu s-a putut șterge utilizatorul');
              }
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Eroare', 'Eroare de conexiune');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ro-RO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setRoleModalVisible(true);
  };

  const isCurrentUser = (userId: string) => {
    return userId === currentUserId;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Se încarcă utilizatorii...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestionare utilizatori</Text>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {users.length === 0 ? (
          <Text style={styles.noUsersText}>Nu există utilizatori disponibili</Text>
        ) : (
          users.map((user) => (
            <View key={user.id} style={styles.userItem}>
              <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                  <Text style={styles.username}>{user.username}</Text>
                  <View style={[
                    styles.roleBadge,
                    user.role === 'admin' ? styles.adminBadge : styles.userBadge
                  ]}>
                    <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.createdAt}>Creat: {formatDate(user.created_at)}</Text>
                {isCurrentUser(user.id) && (
                  <Text style={styles.currentUserText}>Tu</Text>
                )}
              </View>
              
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.editButton,
                    isCurrentUser(user.id) && styles.disabledButton
                  ]}
                  onPress={() => openRoleModal(user)}
                  disabled={isCurrentUser(user.id)}
                >
                  <Text style={styles.actionButtonText}>Modifică rolul</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.deleteButton,
                    isCurrentUser(user.id) && styles.disabledButton
                  ]}
                  onPress={() => deleteUser(user.id, user.username)}
                  disabled={isCurrentUser(user.id)}
                >
                  <Text style={styles.actionButtonText}>Șterge</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Role Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={roleModalVisible}
        onRequestClose={() => {
          setRoleModalVisible(false);
          setSelectedUser(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Modifică rol pentru: {selectedUser?.username}
            </Text>
            
            <TouchableOpacity
              style={styles.roleOption}
              onPress={() => updateUserRole(selectedUser!.id, 'user')}
            >
              <Text style={styles.roleOptionText}>User</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.roleOption}
              onPress={() => updateUserRole(selectedUser!.id, 'admin')}
            >
              <Text style={styles.roleOptionText}>Admin</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setRoleModalVisible(false);
                setSelectedUser(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Anulează</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
  scrollView: {
    flex: 1,
  },
  userItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userInfo: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadge: {
    backgroundColor: '#f44336',
  },
  userBadge: {
    backgroundColor: '#2196f3',
  },
  roleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  createdAt: {
    fontSize: 12,
    color: '#666',
  },
  currentUserText: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: 'bold',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#ff9800',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noUsersText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  roleOption: {
    backgroundColor: '#2196f3',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  roleOptionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
