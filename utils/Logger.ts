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

      const response = await fetch(`${baseUrl}/user-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        console.log(`User event logged: ${eventType} for ${username}`);
      } else {
        // Check if response is actually JSON before parsing
        const contentType = response.headers.get('content-type');
        let errorData;
        if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
        } else {
            // If not JSON, create a generic error structure
            const text = await response.text();
            errorData = { detail: `Server error: ${response.status}` };
            console.error('Non-JSON response from server in Logger:', text);
        }
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
