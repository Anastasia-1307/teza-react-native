import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AdminContent() {
  const router = useRouter();



  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Panoul adminului</Text>
      
      <Text style={styles.subtitle}>Bun venit administrator!</Text>
      
      <View style={styles.content}>
        
        
    
        
        <Text style={styles.placeholderBold}>
          Bune practici pentru setarea parolelor!
        </Text>
        <Text style={styles.placeholder}>
       Parolele trebuie să fie de lungime minimă de 12 caractere și maximă de 64 caractere.
        </Text>
        <Text style={styles.placeholder}>
       Parolele trebuie să fie complexe, incluzând o varietate mare de caractere, precum litere majuscule
       și minuscule, cifre, simboluri speciale precum @, #, $, &, % etc.
        </Text>
        <Text style={styles.placeholder}>
       Nu trebuie utilizată una și aceeași parolă pentru mai multe sisteme, aplicații.
        </Text>
      <Text style={styles.placeholder}>
      Este o bună practică utilizarea unei fraze ca parolă. Fraza poate conține spații,
       însă nu toate aplicațiile permit introducerea spațiilor. De aceea se recomandă utilizarea frazelor ca
       un singur cuvânt complex. De exemplu: LaMulțiAni! sau La_multi_ani!
        </Text>

        <View style={{ marginBottom: 60 }} />

      </View>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  placeholderBold: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  instruction: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  menuButton: {
    backgroundColor: '#8b5e3c',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  menuButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutContainer: {
    paddingBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#ff6b6b',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
