import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Text, TouchableOpacity, Button, View, StyleSheet } from "react-native";
import { useRouter } from 'expo-router';

export default function HomePage() {
  const router = useRouter();
  console.log('HOME PAGE LOADED - THIS SHOULD WORK!');
  
  return (
    <ThemedView style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e1c697ff'}}>
      <ThemedText type="title" style={{textAlign: 'center'}}>Sistem de gestionarea parolelor</ThemedText>
      <ThemedText style={{marginTop: 20}}>Bun venit!</ThemedText>
     
      
<View style={{ marginTop: 20}}>
  <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/register")}
      >
        <Text style={styles.buttonText}>Înregistrare</Text>
    </TouchableOpacity>
</View>
<View style={{ marginTop: 20}}>
   <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.buttonText}>Autentificare</Text>
      </TouchableOpacity>
</View>
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  button: {
    backgroundColor: "#8b5e3c",
    paddingVertical: 12,
      paddingHorizontal: 25,  
    borderRadius: 15,   //  butonul rotunjit
    alignItems: "center",
    shadowColor: "#000",    // opțional: umbră
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,           // pentru Android
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});