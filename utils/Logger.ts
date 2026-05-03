import { NetworkConfig } from './NetworkConfig';

interface LogDetails {
  [key: string]: any;
  bio_method?: string;
  timestamp?: string;
  login_method?: string;
  ip_address?: string;
  block_duration_ms?: number;
  block_duration_readable?: string;
  failed_attempts?: number;
  block_timestamp?: string;
}

interface ApiResponse {
  ok: boolean;
  json(): Promise<any>;
}

export class Logger {
  // Funcție pentru a înregistra loguri în user_logs
  static async logUserEvent(username: string, eventType: string, details: LogDetails = {}) {
    try {
      console.log('Starting logUserEvent:', { username, eventType, details });
      
      const baseUrl = await NetworkConfig.getBaseUrl();
      console.log('Base URL for logging:', baseUrl);
      
      const logData = {
        username: username,
        event_type: eventType,
        details: details,
        timestamp: new Date().toISOString()
      };

      console.log('Log data to send:', logData);

      const response = await new Promise<ApiResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${baseUrl}/user-logs`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = () => {
          console.log('Response status:', xhr.status);
          console.log('Response text:', xhr.responseText);
          
          if (xhr.status === 200 || xhr.status === 201) {
            resolve({
              ok: true,
              json: () => Promise.resolve(JSON.parse(xhr.responseText))
            });
          } else {
            resolve({
              ok: false,
              json: () => Promise.resolve(JSON.parse(xhr.responseText))
            });
          }
        };
        
        xhr.onerror = (error) => {
          console.error('Network error:', error);
          reject(new Error('Network request failed'));
        };
        
        xhr.send(JSON.stringify(logData));
      });

      if (response.ok) {
        console.log(`User event logged: ${eventType} for ${username}`);
      } else {
        const errorData = await response.json();
        console.error(`Failed to log user event: ${eventType}`, errorData);
      }
    } catch (error) {
      console.error('Error in logUserEvent:', error);
    }
  }

  // Funcție specifică pentru a înregistra blocarea IP-ului
  static async logIPBlock(username: string, ipAddress: string, blockDuration: number, failedAttempts: number) {
    await this.logUserEvent(username, 'IP_BLOCKED', {
      ip_address: ipAddress,
      block_duration_ms: blockDuration,
      block_duration_readable: this.formatDuration(blockDuration),
      failed_attempts: failedAttempts,
      block_timestamp: new Date().toISOString()
    });
  }

  // Funcție pentru a formata durata în format citibil
  static formatDuration(ms: number): string {
    if (ms === Infinity) return 'Permanent';
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds} secunde`;
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) return `${minutes} minute`;
    const hours = Math.ceil(minutes / 60);
    return `${hours} ore`;
  }

  // Funcție pentru a obține IP-ul curent pentru logging
  static async getCurrentIP(): Promise<string> {
    try {
      const baseUrl = await NetworkConfig.getBaseUrl();
      // Extragem IP-ul din baseUrl
      const url = new URL(baseUrl);
      return url.hostname;
    } catch (error) {
      console.error('Error getting current IP:', error);
      return 'unknown';
    }
  }
}
