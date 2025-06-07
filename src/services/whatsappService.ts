// WhatsApp Business API Service
// services/whatsappService.ts

interface WhatsAppTextMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "text";
  text: {
    body: string;
  };
}

interface WhatsAppDocumentMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "document";
  document: {
    link?: string;
    caption?: string;
    filename?: string;
  };
}

interface WhatsAppResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

interface WhatsAppError {
  error: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      messaging_product: string;
      details: string;
    };
  };
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  phoneNumber: string;
  recipient: string;
}

export interface SendMessageOptions {
  phoneNumber: string;
  message: string;
  recipientName?: string;
  documentUrl?: string;
  documentFilename?: string;
  documentCaption?: string;
}

class WhatsAppService {
  private readonly apiUrl: string;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly businessId: string;

  constructor() {
    this.phoneNumberId = import.meta.env.VITE_WAPI_PHONE_ID;
    this.accessToken = import.meta.env.VITE_WAPI_PERMANENT_KEY;
    this.businessId = import.meta.env.VITE_WAPI_BUSINESS_ID;
    
    if (!this.phoneNumberId || !this.accessToken) {
      console.error('WhatsApp API credentials not configured');
    }
    
    this.apiUrl = `https://graph.facebook.com/v22.0/${this.phoneNumberId}/messages`;
  }

  /**
   * Validates and formats a phone number for WhatsApp
   * Accepts formats like: +52 55 1234 5678, 5551234567, +525551234567
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    console.log('Original phone:', phoneNumber, 'Cleaned:', cleaned);
    
    // If number starts with 1 and is 11 digits, it's likely US/Canada format
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      console.log('US/Canada format detected:', cleaned);
      return cleaned;
    }
    
    // If number is 10 digits and we're in Mexico context, add country code
    if (cleaned.length === 10) {
      // For Mexican mobile numbers, we need to add 521 (not just 52)
      // Mexican mobile numbers need the extra "1" after country code
      cleaned = '521' + cleaned;
      console.log('Mexican mobile format applied:', cleaned);
      return cleaned;
    }
    
    // If number is 11 digits and starts with 52, might need mobile prefix
    if (cleaned.length === 11 && cleaned.startsWith('52')) {
      // Check if it's missing the mobile "1"
      if (!cleaned.startsWith('521')) {
        cleaned = '521' + cleaned.substring(2);
        console.log('Added mobile prefix to Mexican number:', cleaned);
      }
      return cleaned;
    }
    
    // If number is 12 digits and starts with 521 (Mexico mobile), keep as is
    if (cleaned.length === 12 && cleaned.startsWith('521')) {
      console.log('Mexican mobile with country code:', cleaned);
      return cleaned;
    }
    
    // For other cases, return as is and let WhatsApp validate
    console.log('Using number as-is:', cleaned);
    return cleaned;
  }

  /**
   * Validates if the service is properly configured
   */
  public isConfigured(): boolean {
    return !!(this.phoneNumberId && this.accessToken);
  }

  /**
   * Sends a text message via WhatsApp Business API
   */
  public async sendTextMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'WhatsApp API no está configurado correctamente',
        phoneNumber: options.phoneNumber,
        recipient: options.recipientName || 'Unknown'
      };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(options.phoneNumber);
      
      if (!formattedPhone) {
        return {
          success: false,
          error: 'Número de teléfono inválido',
          phoneNumber: options.phoneNumber,
          recipient: options.recipientName || 'Unknown'
        };
      }

      const payload: WhatsAppTextMessage = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: {
          body: options.message
        }
      };

      console.log('Sending WhatsApp message:', {
        to: formattedPhone,
        recipient: options.recipientName,
        messageLength: options.message.length,
        apiUrl: this.apiUrl
      });

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      
      console.log('WhatsApp API Response:', {
        status: response.status,
        ok: response.ok,
        data: responseData
      });

      if (!response.ok) {
        const errorData = responseData as WhatsAppError;
        console.error('WhatsApp API Error:', errorData);
        
        return {
          success: false,
          error: errorData.error?.message || `Error ${response.status}: ${response.statusText}`,
          phoneNumber: options.phoneNumber,
          recipient: options.recipientName || 'Unknown'
        };
      }

      const successData = responseData as WhatsAppResponse;
      
      return {
        success: true,
        messageId: successData.messages[0]?.id,
        phoneNumber: options.phoneNumber,
        recipient: options.recipientName || 'Unknown'
      };

    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        phoneNumber: options.phoneNumber,
        recipient: options.recipientName || 'Unknown'
      };
    }
  }

  /**
   * Sends a document via WhatsApp Business API
   */
  public async sendDocumentMessage(options: SendMessageOptions & { 
    documentUrl: string; 
    documentFilename: string;
    documentCaption?: string; 
  }): Promise<SendMessageResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'WhatsApp API no está configurado correctamente',
        phoneNumber: options.phoneNumber,
        recipient: options.recipientName || 'Unknown'
      };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(options.phoneNumber);
      
      if (!formattedPhone) {
        return {
          success: false,
          error: 'Número de teléfono inválido',
          phoneNumber: options.phoneNumber,
          recipient: options.recipientName || 'Unknown'
        };
      }

      const payload: WhatsAppDocumentMessage = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "document",
        document: {
          link: options.documentUrl,
          filename: options.documentFilename,
          caption: options.documentCaption
        }
      };

      console.log('Sending WhatsApp document:', {
        to: formattedPhone,
        recipient: options.recipientName,
        filename: options.documentFilename
      });

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorData = responseData as WhatsAppError;
        console.error('WhatsApp API Error:', errorData);
        
        return {
          success: false,
          error: errorData.error?.message || `Error ${response.status}: ${response.statusText}`,
          phoneNumber: options.phoneNumber,
          recipient: options.recipientName || 'Unknown'
        };
      }

      const successData = responseData as WhatsAppResponse;
      
      return {
        success: true,
        messageId: successData.messages[0]?.id,
        phoneNumber: options.phoneNumber,
        recipient: options.recipientName || 'Unknown'
      };

    } catch (error) {
      console.error('Error sending WhatsApp document:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        phoneNumber: options.phoneNumber,
        recipient: options.recipientName || 'Unknown'
      };
    }
  }

  /**
   * Sends messages to multiple recipients
   */
  public async sendToMultipleRecipients(
    recipients: Array<{ phoneNumber: string; name: string }>,
    message: string,
    onProgress?: (completed: number, total: number, results: SendMessageResult[]) => void
  ): Promise<SendMessageResult[]> {
    const results: SendMessageResult[] = [];
    
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      try {
        // Add small delay between messages to avoid rate limiting
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const result = await this.sendTextMessage({
          phoneNumber: recipient.phoneNumber,
          message: message,
          recipientName: recipient.name
        });
        
        results.push(result);
        
        if (onProgress) {
          onProgress(i + 1, recipients.length, results);
        }
        
      } catch (error) {
        console.error(`Error sending to ${recipient.name}:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido',
          phoneNumber: recipient.phoneNumber,
          recipient: recipient.name
        });
      }
    }
    
    return results;
  }

  /**
   * Gets business profile information
   */
  public async getBusinessProfile(): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('WhatsApp API no está configurado');
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v22.0/${this.businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting business profile:', error);
      throw error;
    }
  }

  /**
   * Test connection to WhatsApp Business API
   */
  public async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const profile = await this.getBusinessProfile();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión'
      };
    }
  }
}

// Export singleton instance
export const whatsAppService = new WhatsAppService();

// Export utility functions
export const formatMexicanPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Mexican mobile numbers need the format: 521XXXXXXXXX (12 digits total)
  // Mexican landline numbers use: 52XXXXXXXXX (11 digits total)
  
  if (cleaned.length === 10) {
    // Assume it's a mobile number and add 521
    return `521${cleaned}`;
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('52')) {
    // Could be landline (52 + 10 digits) or missing mobile prefix
    // Add mobile prefix to be safe
    return `521${cleaned.substring(2)}`;
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('521')) {
    // Already in correct mobile format
    return cleaned;
  }
  
  // For other lengths, return as-is
  return cleaned;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  
  // More strict validation
  if (cleaned.length < 10 || cleaned.length > 15) {
    return false;
  }
  
  // Mexican numbers should be 10, 11, or 12 digits after cleaning
  if (cleaned.length === 10) return true; // Local format
  if (cleaned.length === 11 && cleaned.startsWith('52')) return true; // Landline
  if (cleaned.length === 12 && cleaned.startsWith('521')) return true; // Mobile
  
  // International formats (US, etc.)
  if (cleaned.length === 11 && cleaned.startsWith('1')) return true;
  
  // Other international
  return cleaned.length >= 10 && cleaned.length <= 15;
};