import { Ionicons } from '@expo/vector-icons';
import { createDrawerNavigator, DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AddCategory from './AddCategory';
import AddPassword from './AddPassword';
import PasswordGenerator from './PasswordGenerator';
import SetBioAuth from './SetBioAuth';
import UserContent from './UserContent';
// @ts-ignore - NetworkConfig is JS file
import { NetworkConfig } from '../utils/NetworkConfig';

type RootStackParamList = {
  login: undefined;
  Parole: undefined;
  AdaugaParola: undefined;
  'Adaugă categorie': undefined;
  'Setează autentificarea biometrică': undefined;
};

type CustomNavigationProp = NavigationProp<RootStackParamList>;

const menuIcon = require('../assets/images/menu_icon.png');

const MenuButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.menuButton}>
    <Image source={menuIcon} style={styles.menuIcon} />
  </TouchableOpacity>
);

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const navigation = useNavigation<CustomNavigationProp>();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple calls
    
    setIsLoggingOut(true);
    let apiCallSuccessful = false;
    
    console.log('Starting logout process...');
    
    try {
      // Get access token for API call
      const token = await SecureStore.getItemAsync('access_token');
      
      if (token) {
        console.log('Attempting logout API call...');
        console.log('Token length:', token.length);
        
        // Call backend logout to invalidate refresh tokens
        const baseUrl = await NetworkConfig.getBaseUrl();
        console.log('Base URL:', baseUrl);
        
        // Add timeout to prevent hanging - reduced to 3 seconds
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('Forcing API call timeout...');
          controller.abort();
        }, 3000); // 3 second timeout
        
        try {
          console.log('Making API request...');
          const response = await fetch(`${baseUrl}/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          console.log('Response received, status:', response.status);
          
          if (response.ok) {
            apiCallSuccessful = true;
            try {
              const data = await response.json();
              console.log('Logout API successful:', data);
            } catch (jsonError) {
              console.log('Logout API successful (no JSON response)');
            }
          } else {
            console.log('Logout API failed with status:', response.status);
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            console.log('Logout API call timed out');
          } else {
            console.log('Logout API network error:', fetchError instanceof Error ? fetchError.message : 'Unknown error');
          }
        }
      } else {
        console.log('No token found, skipping API call');
      }
    } catch (error) {
      console.error('Unexpected logout error:', error);
    }
    
    // ALWAYS perform local logout, regardless of API call result
    console.log('Performing local logout...');
    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('user_password');
      console.log('Tokens and password deleted successfully');
    } catch (deleteError) {
      console.error('Error deleting tokens:', deleteError);
    }
    
    // Always navigate to login
    console.log('Navigating to login...');
    try {
      navigation.reset({
        index: 0,
        routes: [{ name: 'login' }],
      });
      console.log('Navigation successful');
    } catch (navError) {
      console.error('Navigation error:', navError);
    }
    
    // Show feedback to user
    if (apiCallSuccessful) {
      console.log('Logout completed successfully (server + local)');
    } else {
      console.log('Logout completed locally only (server unavailable)');
    }
    
    setIsLoggingOut(false);
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meniu utilizator</Text>
      </View>
      <DrawerItemList {...props} />
      <TouchableOpacity 
        onPress={handleLogout}
        disabled={isLoggingOut}
        style={{ padding: 15, flexDirection: 'row', alignItems: 'center' }}
      >
        <Ionicons name="log-out" size={24} color="#ff6b6b" style={{ marginRight: 15 }} />
        <Text style={styles.logoutLabel}>
          {isLoggingOut ? "Se deconectează..." : "Deconectare"}
        </Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
};

export default function UserDrawer() {
  const Drawer = createDrawerNavigator();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerPosition: 'left',
      }}
    >
      <Drawer.Screen 
        name="Parole" 
        component={UserContent}
        options={({ navigation }) => ({
          title: 'Gestionare parole',
          drawerIcon: () => <Text>🔐</Text>,
          headerLeft: () => <MenuButton onPress={() => navigation.openDrawer()} />,
          headerShown: true,
        })}
      />
      <Drawer.Screen 
        name="AdaugaParola" 
        component={AddPassword}
        options={({ navigation }) => ({
          title: 'Adaugă parolă',
          drawerIcon: () => <Text>➕</Text>,
          headerLeft: () => <MenuButton onPress={() => navigation.openDrawer()} />,
          headerShown: true,
        })}
      />
      <Drawer.Screen 
        name="Adaugă categorie" 
        component={AddCategory}
        options={({ navigation }) => ({
          title: 'Adaugă categorie',
          drawerIcon: () => <Text>📚</Text>,
          headerLeft: () => <MenuButton onPress={() => navigation.openDrawer()} />,
          headerShown: true,
        })}
      />
        <Drawer.Screen 
        name="Generează parolă" 
        component={PasswordGenerator}
        options={({ navigation }) => ({
          title: 'Generează parolă',
          drawerIcon: () => <Text>✅️</Text>,
          headerLeft: () => <MenuButton onPress={() => navigation.openDrawer()} />,
          headerShown: true,
        })}
      />
        <Drawer.Screen 
        name="Setează autentificarea biometrică" 
        component={SetBioAuth}
        options={({ navigation }) => ({
          title: 'Setează autentificarea biometrică',
          drawerIcon: () => <Text>🫆</Text>,
          headerLeft: () => <MenuButton onPress={() => navigation.openDrawer()} />,
          headerShown: true,
        })}
      />
    </Drawer.Navigator>
   
   
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    backgroundColor: '#2ec4b6',
    marginBottom: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 12,
    marginLeft: 20,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 0,
    minWidth: 50,
    height: 50,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
 
  width: 24,
  height: 24,
  resizeMode: 'contain',

    
  },
  logoutLabel: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
});
