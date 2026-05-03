import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { NetworkConfig } from "../utils/NetworkConfig";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#e1c697ff',
  },
  form: {
    backgroundColor: '#2ec4b6',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5
  },
  title: {
    textAlign: 'center',
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    fontWeight: '600',
    color: '#fff'
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 10
  },
  inputWithIcon: {
    backgroundColor: '#fff',
    padding: 10,
    paddingRight: 40,
    borderRadius: 8
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -12 }]
  },
  errorText: {
    color: 'red'
  },
  buttonContainer: {
    marginTop: 20
  },
  button: {
    backgroundColor: "#8b5e3c",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  linkContainer: {
    marginTop: 30,
    alignItems: 'center'
  },
  linkText: {
    color: '#000'
  }
});

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    // Reset errors
    setUsernameError("");
    setPasswordError("");
    setEmailError("");
    setConfirmError("");

    // Validation
    if(username.trim() === "" || email.trim() === "" || password.trim() === "" || confirmPassword.trim() === "") {
      setConfirmError("Toate câmpurile sunt obligatorii.");
      return;
    }

    const regexPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[*&#@$%!\-_])[a-zA-Z0-9*&#@$%!\-_]{8,30}$/;
    const regexUsername = /^[a-zA-Z0-9]{8,30}$/;
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,320}$/;
    
    if(!regexUsername.test(username.trim())) {
      setUsernameError("Numele de utilizator trebuie să aibă între 8 și 30 de caractere și poate conține litere minuscule, litere majuscule, cifre.");
      return;
    }
    
    if(!regexEmail.test(email.trim())) {
      setEmailError("Email invalid.");
      return;
    }
    
    if(!regexPass.test(password.trim())) {
      setPasswordError("Parola trebuie să aibă între 8 și 30 de caractere și să conțină minim o literă minusculă, minim o literă majusculă, minim o cifră, minim un simbol special.");
      return;
    }
    
    if(password.trim() !== confirmPassword.trim()) {
      setConfirmError("Parolele nu coincid.");
      return;
    }
    setIsLoading(true);

    try {
      const baseUrl = await NetworkConfig.getBaseUrl();
      const response = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password: password.trim(),
          role: 'user'
        }),
      });

      let data;
      let isSuccess = false;
      try {
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        if (responseText.trim()) {
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            data = { detail: responseText };
          }
        } else {
          data = null;
        }
        
        isSuccess = response.ok;
      } catch (error) {
        console.error('Error reading response:', error);
        data = null;
        isSuccess = false;
      }
      if (isSuccess) {
        Alert.alert(
          'Succes',
          'Contul a fost creat cu succes!',
          [
            { text: 'OK', onPress: () => {
                router.push('/login'); }
            }
          ]
        );
        // Clear form
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        if (data && data.detail) {
          if (data.detail.includes("User existent")) {
            setUsernameError("Acest nume de utilizator este deja folosit.");
          } else if (data.detail.includes("Email existent")) {
            setEmailError("Acest email este deja folosit.");
          } else {
            setConfirmError(data.detail);
          }
        } else {
          setConfirmError("A apărut o eroare la înregistrare. Te rugăm încearcă din nou.");
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setConfirmError("Nu s-a putut conecta la server. Verificați conexiunea la internet.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 40, paddingTop: 40 }}>
        <View style={styles.form}>
          <Text style={styles.title}>Înregistrare</Text>
          
          <Text style={styles.label}>Nume de utilizator</Text>
          <TextInput 
            style={styles.input} 
            autoComplete="off"
            placeholder="Nume de utilizator" 
            value={username} 
            onChangeText={setUsername}
          />
          {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
          

          <Text style={styles.label}>Email</Text>
          <TextInput 
            style={styles.input} 
            autoComplete="off"
            placeholder="Email" 
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          
          <Text style={styles.label}>Parola</Text>
          <View style={styles.inputContainer}>
          <TextInput 
            style={styles.inputWithIcon} 
            autoComplete="off"
            placeholder="Parola" 
            secureTextEntry={hidePassword} 
            value={password} 
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setHidePassword(!hidePassword)}>
        <Ionicons
          name={hidePassword ? "eye-off" : "eye"}
          size={24}
          color="gray"
        />
      </TouchableOpacity>
      </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          
          <Text style={styles.label}>Confirmare parola</Text>
          <View style={styles.inputContainer}>
          <TextInput 
            style={styles.inputWithIcon} 
            autoComplete="off"
            placeholder="Confirmare parola" 
            secureTextEntry={hideConfirmPassword} 
            value={confirmPassword} 
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setHideConfirmPassword(!hideConfirmPassword)}>
        <Ionicons
          name={hideConfirmPassword ? "eye-off" : "eye"}
          size={24}
          color="gray"
        />
      </TouchableOpacity>
      </View>
          {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading}>
              <Text style={styles.buttonText}>{isLoading ? "Se încarcă..." : "Înregistrare"}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.linkContainer}>
            <Link href="/login">
              <Text style={styles.linkText}>Ai deja cont? Autentifică-te</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}