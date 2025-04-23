// src/services/manuableService.ts
import axios from 'axios';


const manuableApi = axios.create({
  baseURL: 'https://manuable-api.apidog.io',
  timeout: 15000,
});

let authToken = '';

export const manuableService = {
  async login(email: string, password: string) {
    const response = await manuableApi.post('/api/session', {
      email,
      password
    });
    authToken = response.data.token;
    return response.data;
  },

  async getRates(shippingData: {
    address_from: { country_code: string; zip_code: string };
    address_to: { country_code: string; zip_code: string };
    parcel: {
      currency: string;
      distance_unit: string;
      height: number;
      length: number;
      mass_unit: string;
      weight: number;
      width: number;
    };
  }) {
    return manuableApi.post('/api/rates', shippingData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  },

  async createLabel(labelData: {
    address_from: object;
    address_to: object;
    parcel: object;
    label_format?: string;
    rate_token: string;
  }) {
    return manuableApi.post('/api/labels', labelData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  }
};