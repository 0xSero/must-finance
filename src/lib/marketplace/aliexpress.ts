/**
 * Aliexpress/Alibaba API Integration
 * https://developers.aliexpress.com/en/doc.htm
 *
 * For automated supplier ordering and tracking
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface AliexpressConfig {
  appKey: string;
  appSecret: string;
  apiUrl?: string;
}

interface SupplierProduct {
  productId: string;
  title: string;
  price: number;
  minOrder: number;
  supplierUrl: string;
}

export class AliexpressClient {
  private appKey: string;
  private appSecret: string;
  private client: AxiosInstance;

  constructor(config: AliexpressConfig) {
    this.appKey = config.appKey;
    this.appSecret = config.appSecret;
    this.client = axios.create({
      baseURL: config.apiUrl || 'https://api-sg.aliexpress.com/sync',
    });
  }

  /**
   * Generate signature for API requests
   */
  private generateSignature(params: Record<string, any>): string {
    const sortedKeys = Object.keys(params).sort();
    const signString = sortedKeys.map((key) => `${key}${params[key]}`).join('');
    const fullString = `${this.appSecret}${signString}${this.appSecret}`;

    return crypto.createHash('md5').update(fullString).digest('hex').toUpperCase();
  }

  /**
   * Make API request to Aliexpress
   */
  private async request(method: string, params: Record<string, any>): Promise<any> {
    const requestParams = {
      app_key: this.appKey,
      method,
      timestamp: Date.now().toString(),
      format: 'json',
      v: '2.0',
      sign_method: 'md5',
      ...params,
    };

    requestParams.sign = this.generateSignature(requestParams);

    try {
      const response = await this.client.get('', { params: requestParams });
      return response.data;
    } catch (error) {
      console.error('Aliexpress API request failed:', error);
      throw error;
    }
  }

  /**
   * Search for products by keyword
   */
  async searchProducts(keyword: string, options?: {
    minPrice?: number;
    maxPrice?: number;
    minOrder?: number;
    pageSize?: number;
  }): Promise<SupplierProduct[]> {
    try {
      const response = await this.request('aliexpress.affiliate.product.query', {
        keywords: keyword,
        min_price: options?.minPrice,
        max_price: options?.maxPrice,
        page_size: options?.pageSize || 20,
      });

      return (response.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product || []).map(
        (product: any) => ({
          productId: product.product_id,
          title: product.product_title,
          price: parseFloat(product.target_sale_price),
          minOrder: product.min_order || 1,
          supplierUrl: product.product_detail_url,
        })
      );
    } catch (error) {
      console.error('Failed to search Aliexpress products:', error);
      throw error;
    }
  }

  /**
   * Get product details
   */
  async getProductDetails(productId: string): Promise<any> {
    try {
      const response = await this.request('aliexpress.affiliate.productdetail.get', {
        product_ids: productId,
      });

      return response.aliexpress_affiliate_productdetail_get_response?.resp_result?.result;
    } catch (error) {
      console.error('Failed to get Aliexpress product details:', error);
      throw error;
    }
  }

  /**
   * Create an order (requires additional authentication)
   * Note: This is a simplified version. Real implementation requires
   * OAuth2 authorization and access to Aliexpress Dropshipping API
   */
  async createOrder(order: {
    productId: string;
    quantity: number;
    shippingAddress: {
      name: string;
      address: string;
      city: string;
      country: string;
      postalCode: string;
      phone: string;
    };
  }): Promise<{ orderId: string; status: string }> {
    // This is a placeholder. Real implementation requires:
    // 1. OAuth2 authorization
    // 2. Dropshipping API access
    // 3. Payment method setup

    console.log('Creating Aliexpress order:', order);

    throw new Error('createOrder requires OAuth2 authorization and Dropshipping API access');
  }

  /**
   * Track order status
   */
  async trackOrder(orderId: string): Promise<{
    status: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
  }> {
    try {
      const response = await this.request('aliexpress.logistics.redefining.getlogisticsselleraddresses', {
        order_id: orderId,
      });

      // Parse response and return tracking info
      return {
        status: response.status || 'unknown',
        trackingNumber: response.tracking_number,
        estimatedDelivery: response.estimated_delivery ? new Date(response.estimated_delivery) : undefined,
      };
    } catch (error) {
      console.error('Failed to track Aliexpress order:', error);
      throw error;
    }
  }

  /**
   * Auto-reorder based on inventory levels
   * This is a helper function to be called when stock is low
   */
  async autoReorder(params: {
    productSku: string;
    supplierProductId: string;
    quantity: number;
    shippingAddress: any;
  }): Promise<void> {
    console.log('Auto-reorder triggered for:', params.productSku);

    // 1. Get product details to verify price and availability
    const product = await this.getProductDetails(params.supplierProductId);

    // 2. Create order (requires proper setup)
    // const order = await this.createOrder({
    //   productId: params.supplierProductId,
    //   quantity: params.quantity,
    //   shippingAddress: params.shippingAddress,
    // });

    // 3. Log to database for tracking
    console.log('Order would be created with:', {
      sku: params.productSku,
      quantity: params.quantity,
      product,
    });
  }
}

export default AliexpressClient;
