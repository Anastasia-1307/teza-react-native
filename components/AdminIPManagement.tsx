import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { NetworkConfig } from '../utils/NetworkConfig';

interface IPBlock {
  id: string;
  ip_address: string;
  blocked_at: string;
  block_duration: number;
  is_active: boolean;
  username?: string;
  failed_attempts: number;
  expires_at?: string;
  user_id?: string;
}

interface IPStats {
  total_active: number;
  total_blocks: number;
  recent_blocks_24h: number;
  expiring_soon_1h: number;
}

const AdminIPManagement: React.FC = () => {
  const [ipBlocks, setIpBlocks] = useState<IPBlock[]>([]);
  const [stats, setStats] = useState<IPStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [newDuration, setNewDuration] = useState('3600000'); // 1 hour default
  const [checkIP, setCheckIP] = useState('');
  const [checkResult, setCheckResult] = useState<any>(null);
  const [activeOnly, setActiveOnly] = useState(false);

  const fetchIPBlocks = async () => {
    try {
      const baseUrl = await NetworkConfig.getBaseUrl();
      const token = await SecureStore.getItemAsync('access_token');
      
      const response = await fetch(`${baseUrl}/admin/ip-blocks?active_only=${activeOnly}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIpBlocks(data);
      } else {
        console.error('Failed to fetch IP blocks');
      }
    } catch (error) {
      console.error('Error fetching IP blocks:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const baseUrl = await NetworkConfig.getBaseUrl();
      const token = await SecureStore.getItemAsync('access_token');
      
      const response = await fetch(`${baseUrl}/admin/ip-blocks/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchIPBlocks(), fetchStats()]);
      setLoading(false);
    };
    
    loadData();
  }, [activeOnly]);

  const addIPBlock = async () => {
    if (!newIP.trim() || !newDuration.trim()) {
      Alert.alert('Eroare', 'Vă rugăm completați toate câmpurile');
      return;
    }

    try {
      const baseUrl = await NetworkConfig.getBaseUrl();
      const token = await SecureStore.getItemAsync('access_token');
      
      const response = await fetch(`${baseUrl}/admin/ip-blocks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip_address: newIP.trim(),
          block_duration: parseInt(newDuration),
          username: 'admin_manual',
          failed_attempts: 1
        }),
      });

      if (response.ok) {
        Alert.alert('Succes', 'Adresa IP a fost blocată cu succes');
        setShowAddModal(false);
        setNewIP('');
        setNewDuration('3600000');
        await Promise.all([fetchIPBlocks(), fetchStats()]);
      } else {
        const error = await response.json();
        Alert.alert('Eroare', error.detail || 'Blocarea adresei IP a eșuat');
      }
    } catch (error) {
      console.error('Error adding IP block:', error);
      Alert.alert('Eroare', 'Blocarea adresei IP a eșuat');
    }
  };

  const deleteIPBlock = async (blockId: string, ipAddress: string) => {
    Alert.alert(
      'Confirmare ștergere',
      `Sunteți sigur că doriți să deblocați adresa IP ${ipAddress}?`,
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Șterge',
          style: 'destructive',
          onPress: async () => {
            try {
              const baseUrl = await NetworkConfig.getBaseUrl();
              const token = await SecureStore.getItemAsync('access_token');
              
              const response = await fetch(`${baseUrl}/admin/ip-blocks/${blockId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                Alert.alert('Succes', 'Blocul IP a fost șters cu succes');
                await Promise.all([fetchIPBlocks(), fetchStats()]);
              } else {
                const error = await response.json();
                Alert.alert('Eroare', error.detail || 'Eliminarea blocului IP a eșuat');
              }
            } catch (error) {
              console.error('Error deleting IP block:', error);
              Alert.alert('Eroare', 'Eliminarea blocului IP a eșuat');
            }
          },
        },
      ]
    );
  };

  const checkIPAddress = async () => {
    if (!checkIP.trim()) {
      Alert.alert('Eroare', 'Vă rugăm introduceți o adresă IP');
      return;
    }

    try {
      const baseUrl = await NetworkConfig.getBaseUrl();
      const token = await SecureStore.getItemAsync('access_token');
      
      const response = await fetch(`${baseUrl}/admin/ip-blocks/check/${checkIP.trim()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCheckResult(data);
      } else {
        const error = await response.json();
        Alert.alert('Eroare', error.detail || 'Verificarea adresei IP a eșuat');
      }
    } catch (error) {
      console.error('Error checking IP address:', error);
      Alert.alert('Eroare', 'Verificarea adresei IP a eșuat');
    }
  };

  const cleanupExpired = async () => {
    Alert.alert(
      'Confirmare curățare',
      'Sunteți sigur că doriți să curățați toate blocurile IP expirate?',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Curăță',
          style: 'default',
          onPress: async () => {
            try {
              const baseUrl = await NetworkConfig.getBaseUrl();
              const token = await SecureStore.getItemAsync('access_token');
              
              const response = await fetch(`${baseUrl}/admin/ip-blocks/cleanup`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                const result = await response.json();
                Alert.alert('Success', result.message);
                await Promise.all([fetchIPBlocks(), fetchStats()]);
              } else {
                const error = await response.json();
                Alert.alert('Eroare', error.detail || 'Curățarea a eșuat');
              }
            } catch (error) {
              console.error('Error cleaning up:', error);
              Alert.alert('Eroare', 'Curățarea a eșuat');
            }
          },
        },
      ]
    );
  };

  const formatDuration = (ms: number) => {
    if (ms === Infinity) return 'Permanent';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds} secunde`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute`;
    const hours = Math.floor(minutes / 60);
    return `${hours} ore`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderIPBlock = ({ item }: { item: IPBlock }) => (
    <View style={[styles.blockItem, !item.is_active && styles.inactiveBlock]}>
      <View style={styles.blockHeader}>
        <Text style={styles.ipAddress}>{item.ip_address}</Text>
        <View style={[styles.statusBadge, item.is_active ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={styles.statusText}>{item.is_active ? 'Activ' : 'Inactiv'}</Text>
        </View>
      </View>
      
      <Text style={styles.blockDetails}>
        Blocat: {formatDate(item.blocked_at)}
      </Text>
      <Text style={styles.blockDetails}>
        Durată: {formatDuration(item.block_duration)}
      </Text>
      {item.expires_at && (
        <Text style={styles.blockDetails}>
          Expiră: {formatDate(item.expires_at)}
        </Text>
      )}
      {item.username && (
        <Text style={styles.blockDetails}>
          Utilizator: {item.username}
        </Text>
      )}
      <Text style={styles.blockDetails}>
        Încercări eșuate: {item.failed_attempts}
      </Text>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteIPBlock(item.id, item.ip_address)}
      >
        <Ionicons name="trash-outline" size={16} color="#fff" />
        <Text style={styles.deleteButtonText}>Deblochează</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Se încarcă blocurile IP...</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View>
      <Text style={styles.title}>Administrare adrese IP</Text>
      
      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Doar active</Text>
          <Switch
            value={activeOnly}
            onValueChange={setActiveOnly}
            trackColor={{ false: '#767577', true: '#2ec4b6' }}
            thumbColor={activeOnly ? '#fff' : '#f4f3f4'}
          />
        </View>
        
        <TouchableOpacity style={styles.button} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Blochează IP</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={() => setShowCheckModal(true)}>
          <Ionicons name="search-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Verifică IP</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.cleanupButton]} onPress={cleanupExpired}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Curăță</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

 

  return (
    <View style={styles.container}>
      <FlatList
        data={ipBlocks}
        renderItem={renderIPBlock}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<Text style={styles.emptyText}>Nu s-au găsit blocuri IP</Text>}
        contentContainerStyle={styles.listContent}
      />

      {/* Add IP Block Modal */}
      <Modal visible={showAddModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Blochează adresă IP</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Adresă IP (ex: 192.168.1.100)"
            value={newIP}
            onChangeText={setNewIP}
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Durată (ms, ex: 3600000 pentru 1 oră)"
            value={newDuration}
            onChangeText={setNewDuration}
            keyboardType="numeric"
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setShowAddModal(false)}>
              <Text style={styles.buttonText}>Anulează</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={addIPBlock}>
              <Text style={styles.buttonText}>Blochează IP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Check IP Modal */}
      <Modal visible={showCheckModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Verifică adresă IP</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Introduceți adresa IP"
            value={checkIP}
            onChangeText={setCheckIP}
            autoCapitalize="none"
          />
          
          <TouchableOpacity style={styles.button} onPress={checkIPAddress}>
            <Text style={styles.buttonText}>Verifică IP</Text>
          </TouchableOpacity>
          
          {checkResult && (
            <View style={styles.checkResult}>
              <Text style={styles.checkResultTitle}>Rezultat pentru {checkResult.ip_address}</Text>
              <Text style={styles.checkResultText}>
                Status: {checkResult.is_blocked ? 'Blocat' : 'Neblocat'}
              </Text>
              {checkResult.is_blocked && checkResult.block_details && (
                <>
                  <Text style={styles.checkResultText}>
                    Blocat la: {formatDate(checkResult.block_details.blocked_at)}
                  </Text>
                  <Text style={styles.checkResultText}>
                    Durată: {formatDuration(checkResult.block_details.block_duration)}
                  </Text>
                  {checkResult.block_details.expires_at && (
                    <Text style={styles.checkResultText}>
                      Expiră: {formatDate(checkResult.block_details.expires_at)}
                    </Text>
                  )}
                </>
              )}
            </View>
          )}
          
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => {
            setShowCheckModal(false);
            setCheckIP('');
            setCheckResult(null);
          }}>
            <Text style={styles.buttonText}>Închide</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2ec4b6',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  controlsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  button: {
    backgroundColor: '#2ec4b6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cleanupButton: {
    backgroundColor: '#ff6b6b',
  },
  cancelButton: {
    backgroundColor: '#888',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 5,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  blockItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveBlock: {
    opacity: 0.6,
    backgroundColor: '#f0f0f0',
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ipAddress: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
  },
  inactiveBadge: {
    backgroundColor: '#888',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  blockDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  checkResult: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  checkResultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  checkResultText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default AdminIPManagement;
