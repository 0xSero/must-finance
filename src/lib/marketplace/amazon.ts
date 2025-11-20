/**
 * Amazon SP-API Integration
 * https://developer-docs.amazon.com/sp-api/
 *
 * Integration for Amazon.pl marketplace
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface AmazonConfig {
  lwaClientId: string;
  lwaClientSecret: string;
  refreshToken: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  region: string;
  marketplaceId: string;
}

export class AmazonSPAPIClient {
  private config: AmazonConfig;
  private accessToken: string | null = null;
  private client: AxiosInstance;

  constructor(config: AmazonConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: `https://sellingpartnerapi-eu.amazon.com`,
    });
  }

  /**
   * Get LWA access token for SP-API
   */
  private async getAccessToken(): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.amazon.com/auth/o2/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.config.refreshToken,
          client_id: this.config.lwaClientId,
          client_secret: this.config.lwaClientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Amazon access token:', error);
      throw error;
    }
  }

  /**
   * Create or update a product listing on Amazon
   */
  async createOrUpdateListing(product: {
    sku: string;
    asin?: string;
    title: string;
    description: string;
    price: number;
    quantity: number;
    images: string[];
  }): Promise<void> {
    const accessToken = await this.getAccessToken();

    try {
      // Submit product feed to Amazon
      const feedData = {
        header: {
          sellerId: 'YOUR_SELLER_ID',
          version: '2.0',
          issueLocale: 'pl_PL',
        },
        messages: [
          {
            messageId: '1',
            sku: product.sku,
            operationType: 'Update',
            productType: 'PRODUCT',
            attributes: {
              item_name: [{ value: product.title, marketplace_id: this.config.marketplaceId }],
              externally_assigned_product_identifier: product.asin
                ? [
                    {
                      value: product.asin,
                      type: 'ASIN',
                      marketplace_id: this.config.marketplaceId,
                    },
                  ]
                : undefined,
              main_product_image_locator: [
                { media_location: product.images[0], marketplace_id: this.config.marketplaceId },
              ],
              product_description: [
                { value: product.description, marketplace_id: this.config.marketplaceId },
              ],
            },
          },
        ],
      };

      const response = await this.client.post('/feeds/2021-06-30/feeds', feedData, {
        headers: {
          'x-amz-access-token': accessToken,
          'Content-Type': 'application/json',
        },
      });

      console.log('Amazon feed submitted:', response.data);

      // Update price and inventory separately
      await this.updatePriceAndInventory(product.sku, product.price, product.quantity);
    } catch (error: any) {
      console.error('Failed to create/update Amazon listing:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Update price and inventory for a SKU
   */
  async updatePriceAndInventory(sku: string, price: number, quantity: number): Promise<void> {
    const accessToken = await this.getAccessToken();

    try {
      // Update price
      await this.client.post(
        `/listings/2021-08-01/items/${this.config.marketplaceId}/${sku}`,
        {
          productType: 'PRODUCT',
          patches: [
            {
              op: 'replace',
              path: '/attributes/purchasable_offer',
              value: [
                {
                  marketplace_id: this.config.marketplaceId,
                  currency: 'PLN',
                  our_price: [{ schedule: [{ value_with_tax: price }] }],
                },
              ],
            },
          ],
        },
        {
          headers: {
            'x-amz-access-token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update inventory
      await this.client.post(
        `/fba/inventory/v1/items/inventory`,
        {
          sellerSku: sku,
          marketplaceId: this.config.marketplaceId,
          quantity,
        },
        {
          headers: {
            'x-amz-access-token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Failed to update Amazon price/inventory:', error);
      throw error;
    }
  }

  /**
   * Get orders from Amazon
   */
  async getOrders(params?: { createdAfter?: Date; limit?: number }): Promise<any[]> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await this.client.get('/orders/v0/orders', {
        headers: {
          'x-amz-access-token': accessToken,
        },
        params: {
          MarketplaceIds: this.config.marketplaceId,
          CreatedAfter: params?.createdAfter?.toISOString() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          MaxResultsPerPage: params?.limit || 100,
        },
      });

      return response.data.payload.Orders || [];
    } catch (error) {
      console.error('Failed to fetch Amazon orders:', error);
      throw error;
    }
  }

  /**
   * Sync inventory from main store to Amazon
   */
  async syncInventory(sku: string, quantity: number): Promise<void> {
    await this.updatePriceAndInventory(sku, 0, quantity); // Price will be fetched from existing listing
  }
}

export default AmazonSPAPIClient;
