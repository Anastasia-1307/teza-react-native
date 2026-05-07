export class NetworkConfig {
  static cachedBaseUrl: string | null = null;
  
  static async getBaseUrl(): Promise<string> {

    if (this.cachedBaseUrl) {
      return this.cachedBaseUrl;
    }

    // Folosim doar variabila din .env.local
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    console.log(`Environment variable EXPO_PUBLIC_API_URL:`, envUrl);
    
    if (envUrl) {
      console.log(`Using environment URL: ${envUrl}`);
      this.cachedBaseUrl = envUrl;
      return envUrl;
    }
    
  
    throw new Error('EXPO_PUBLIC_API_URL environment variable is not set. Please add it to .env.local file.');
  }

  static async getCurrentMachineIP(): Promise<string | null> {
    try {
    
      const os = await import('os');
      const interfaces = os.networkInterfaces();
      
      for (const name of Object.keys(interfaces)) {
        const ifaceArray = interfaces[name];
        if (ifaceArray) {
          for (const iface of ifaceArray) {
            if (iface.family === 'IPv4' && !iface.internal) {
              console.log(`Found IP: ${iface.address} on interface: ${name}`);
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
  
  static resetCache(): void {
    this.cachedBaseUrl = null;
    console.log('NetworkConfig cache reset');
  }
  
  // Metoda veche pentru compatibilitate
  static async findWorkingServer(): Promise<string> {
    const POSSIBLE_IPS = [
    
    ];
    
    for (const url of POSSIBLE_IPS) {
      try {
        const response = await fetch(`${url}/docs`, {
          method: 'GET',
        });
        if (response.ok) {
          console.log(`Server found at: ${url}`);
          return url;
        }
      } catch (error) {
        console.log(`Server not available at: ${url}`);
      }
    }
    
    console.log('Using default server URL');
    return POSSIBLE_IPS[0];
  }
}
