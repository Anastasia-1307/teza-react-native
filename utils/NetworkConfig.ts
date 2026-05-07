export class NetworkConfig {
  static cachedBaseUrl: string | null = null;
  
  static async getBaseUrl(): Promise<string> {

    if (this.cachedBaseUrl) {
      return this.cachedBaseUrl;
    }

    // Folosim doar variabila din .env.local
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    console.log(`\ud83d\udd0d Environment variable EXPO_PUBLIC_API_URL:`, envUrl);
    
    if (envUrl) {
      console.log(`\u2705 Using environment URL: ${envUrl}`);
      this.cachedBaseUrl = envUrl;
      return envUrl;
    }
    
    // Dac\u0103 nu exist\u0103 variabila de mediu, arunc\u0103m eroare
    throw new Error('EXPO_PUBLIC_API_URL environment variable is not set. Please add it to .env.local file.');
  }
  
  // Metod\u0103 pentru a ob\u021bine IP-ul curent al ma\u0219inii
  static async getCurrentMachineIP(): Promise<string | null> {
    try {
      // \u00cencearc\u0103 s\u0103 ob\u021bin\u0103 IP-ul re\u021belei locale
      const os = await import('os');
      const interfaces = os.networkInterfaces();
      
      for (const name of Object.keys(interfaces)) {
        const ifaceArray = interfaces[name];
        if (ifaceArray) {
          for (const iface of ifaceArray) {
            if (iface.family === 'IPv4' && !iface.internal) {
              console.log(`\ud83d\udd0d Found IP: ${iface.address} on interface: ${name}`);
              return iface.address;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting machine IP:', error);
    }
    return null;
  }
  
  // Reset\u0103m cache-ul pentru a for\u021ba re-detectarea
  static resetCache(): void {
    this.cachedBaseUrl = null;
    console.log('\ud83d\udd04 NetworkConfig cache reset');
  }
  
  // Metoda veche pentru compatibilitate
  static async findWorkingServer(): Promise<string> {
    const POSSIBLE_IPS = [
      'http://localhost:8000',
      'http://127.0.0.1:8000',
      'http://192.168.1.100:8000',
      'http://10.0.2.2:8000',
      'http://192.168.0.15:8000',
      'http://10.22.242.11:8000'
      
    ];
    
    for (const url of POSSIBLE_IPS) {
      try {
        const response = await fetch(`${url}/docs`, {
          method: 'GET',
        });
        if (response.ok) {
          console.log(`\u2705 Server found at: ${url}`);
          return url;
        }
      } catch (error) {
        console.log(`\u274c Server not available at: ${url}`);
      }
    }
    
    console.log('\u26a0\ufe0f Using default server URL');
    return POSSIBLE_IPS[0];
  }
}
