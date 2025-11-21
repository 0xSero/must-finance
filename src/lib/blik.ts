/**
 * BLIK Payment Integration
 * Using Przelewy24 gateway which supports BLIK
 * https://docs.przelewy24.pl/
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface BlikConfig {
  merchantId: string;
  posId: string;
  apiKey: string;
  crc: string;
  sandbox?: boolean;
}

interface BlikPaymentRequest {
  amount: number;
  currency: string;
  description: string;
  email: string;
  sessionId: string;
  urlReturn: string;
  urlStatus: string;
  blikCode?: string; // 6-digit BLIK code from customer
}

export class BlikClient {
  private config: BlikConfig;
  private client: AxiosInstance;

  constructor(config: BlikConfig) {
    this.config = config;
    const baseURL = config.sandbox
      ? 'https://sandbox.przelewy24.pl/api/v1'
      : 'https://secure.przelewy24.pl/api/v1';

    this.client = axios.create({
      baseURL,
      auth: {
        username: config.posId,
        password: config.apiKey,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate CRC signature for request validation
   */
  private generateCrc(data: Record<string, any>): string {
    const values = [
      this.config.merchantId,
      this.config.posId,
      data.sessionId,
      data.amount,
      data.currency,
      this.config.crc,
    ];
    const signString = values.join('|');
    return crypto.createHash('md5').update(signString).digest('hex');
  }

  /**
   * Register a BLIK transaction
   */
  async registerTransaction(payment: BlikPaymentRequest): Promise<{
    token: string;
    url: string;
  }> {
    try {
      // Convert amount to grosze (1 PLN = 100 grosze)
      const amountInGrosze = Math.round(payment.amount * 100);

      const requestData = {
        merchantId: parseInt(this.config.merchantId),
        posId: parseInt(this.config.posId),
        sessionId: payment.sessionId,
        amount: amountInGrosze,
        currency: payment.currency,
        description: payment.description,
        email: payment.email,
        country: 'PL',
        language: 'pl',
        urlReturn: payment.urlReturn,
        urlStatus: payment.urlStatus,
        method: 181, // BLIK method ID in Przelewy24
        sign: '',
      };

      // Generate signature
      requestData.sign = this.generateCrc(requestData);

      const response = await this.client.post('/transaction/register', requestData);

      return {
        token: response.data.data.token,
        url: `${this.config.sandbox ? 'https://sandbox.przelewy24.pl' : 'https://secure.przelewy24.pl'}/trnRequest/${response.data.data.token}`,
      };
    } catch (error: any) {
      console.error('BLIK transaction registration failed:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Failed to register BLIK transaction');
    }
  }

  /**
   * Process BLIK payment with 6-digit code
   */
  async processBlikPayment(
    token: string,
    blikCode: string
  ): Promise<{
    status: string;
    orderId?: string;
  }> {
    try {
      const response = await this.client.put(`/transaction/by/token/${token}`, {
        methodRefId: blikCode,
      });

      return {
        status: response.data.data.status,
        orderId: response.data.data.orderId,
      };
    } catch (error: any) {
      console.error('BLIK payment processing failed:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Failed to process BLIK payment');
    }
  }

  /**
   * Verify transaction status (webhook handler)
   */
  async verifyTransaction(notification: {
    merchantId: string;
    posId: string;
    sessionId: string;
    amount: string;
    currency: string;
    orderId: string;
    methodId: string;
    statement: string;
    sign: string;
  }): Promise<boolean> {
    // Verify signature
    const expectedSign = this.generateCrc({
      sessionId: notification.sessionId,
      amount: notification.amount,
      currency: notification.currency,
    });

    if (expectedSign !== notification.sign) {
      console.error('Invalid BLIK notification signature');
      return false;
    }

    // Verify transaction with P24
    try {
      const verifyData = {
        merchantId: parseInt(this.config.merchantId),
        posId: parseInt(this.config.posId),
        sessionId: notification.sessionId,
        amount: parseInt(notification.amount),
        currency: notification.currency,
        orderId: parseInt(notification.orderId),
        sign: this.generateCrc({
          sessionId: notification.sessionId,
          amount: notification.amount,
          currency: notification.currency,
        }),
      };

      const response = await this.client.put('/transaction/verify', verifyData);

      return response.data.data.status === 'success';
    } catch (error) {
      console.error('BLIK transaction verification failed:', error);
      return false;
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(sessionId: string): Promise<{
    status: string;
    amount?: number;
  }> {
    try {
      const response = await this.client.get(`/transaction/by/sessionId/${sessionId}`);

      return {
        status: response.data.data.status,
        amount: response.data.data.amount,
      };
    } catch (error) {
      console.error('Failed to get BLIK transaction status:', error);
      throw error;
    }
  }
}

// Export singleton instance
let blikClient: BlikClient | null = null;

export function getBlikClient(): BlikClient {
  if (!blikClient) {
    blikClient = new BlikClient({
      merchantId: process.env.BLIK_MERCHANT_ID || '',
      posId: process.env.BLIK_POS_ID || '',
      apiKey: process.env.BLIK_API_KEY || '',
      crc: process.env.BLIK_CRC || '',
      sandbox: process.env.NODE_ENV !== 'production',
    });
  }
  return blikClient;
}

export default BlikClient;
