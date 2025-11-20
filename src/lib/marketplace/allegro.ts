/**
 * Allegro API Integration
 * https://developer.allegro.pl/documentation/
 *
 * Polish marketplace integration for listing and managing products
 */

import axios, { AxiosInstance } from 'axios';

interface AllegroConfig {
  clientId: string;
  clientSecret: string;
  apiUrl?: string;
}

interface AllegroProduct {
  id: string;
  name: string;
  category: { id: string };
  images: Array<{ url: string }>;
  sellingMode: {
    price: { amount: string; currency: string };
  };
  stock: { available: number };
}

export class AllegroClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private clientId: string;
  private clientSecret: string;

  constructor(config: AllegroConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.client = axios.create({
      baseURL: config.apiUrl || 'https://api.allegro.pl',
      headers: {
        'Content-Type': 'application/vnd.allegro.public.v1+json',
      },
    });
  }

  /**
   * Authenticate with Allegro API using OAuth2
   */
  async authenticate(): Promise<void> {
    try {
      const response = await axios.post(
        'https://allegro.pl/auth/oauth/token',
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
    } catch (error) {
      console.error('Allegro authentication failed:', error);
      throw error;
    }
  }

  /**
   * Create a new product listing on Allegro
   */
  async createListing(product: {
    name: string;
    categoryId: string;
    description: string;
    price: number;
    quantity: number;
    images: string[];
    sku: string;
  }): Promise<string> {
    if (!this.accessToken) await this.authenticate();

    try {
      const response = await this.client.post('/sale/product-offers', {
        name: product.name,
        category: { id: product.categoryId },
        parameters: [
          {
            id: 'DESCRIPTION',
            values: [product.description],
          },
        ],
        images: product.images.map((url) => ({ url })),
        sellingMode: {
          format: 'BUY_NOW',
          price: {
            amount: product.price.toFixed(2),
            currency: 'PLN',
          },
        },
        stock: {
          available: product.quantity,
        },
        external: {
          id: product.sku,
        },
      });

      return response.data.id;
    } catch (error: any) {
      console.error('Failed to create Allegro listing:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Update product listing
   */
  async updateListing(
    offerId: string,
    updates: {
      price?: number;
      quantity?: number;
      isActive?: boolean;
    }
  ): Promise<void> {
    if (!this.accessToken) await this.authenticate();

    try {
      const updateData: any = {};

      if (updates.price !== undefined) {
        updateData.sellingMode = {
          price: {
            amount: updates.price.toFixed(2),
            currency: 'PLN',
          },
        };
      }

      if (updates.quantity !== undefined) {
        updateData.stock = {
          available: updates.quantity,
        };
      }

      if (updates.isActive !== undefined) {
        updateData.publication = {
          status: updates.isActive ? 'ACTIVE' : 'INACTIVE',
        };
      }

      await this.client.patch(`/sale/product-offers/${offerId}`, updateData);
    } catch (error) {
      console.error('Failed to update Allegro listing:', error);
      throw error;
    }
  }

  /**
   * Get orders from Allegro
   */
  async getOrders(params?: {
    limit?: number;
    offset?: number;
    updatedAfter?: Date;
  }): Promise<any[]> {
    if (!this.accessToken) await this.authenticate();

    try {
      const response = await this.client.get('/order/checkout-forms', {
        params: {
          limit: params?.limit || 100,
          offset: params?.offset || 0,
          'updated.gte': params?.updatedAfter?.toISOString(),
        },
      });

      return response.data.checkoutForms;
    } catch (error) {
      console.error('Failed to fetch Allegro orders:', error);
      throw error;
    }
  }

  /**
   * Sync inventory levels from main store to Allegro
   */
  async syncInventory(productId: string, quantity: number): Promise<void> {
    // Implementation to update stock levels on Allegro
    await this.updateListing(productId, { quantity });
  }
}

export default AllegroClient;
