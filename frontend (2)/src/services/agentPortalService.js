/**
 * Agent Portal API Service
 * Connects Agent Dashboard directly to PostgreSQL Backend APIs (/api/v1)
 */

import { apiFetch, setAuthToken, getAuthToken } from './apiConfig';

export const agentPortalService = {
  /**
   * Authenticate agent with backend API
   */
  async login(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res?.data?.token) {
        setAuthToken(res.data.token);
      }
      return res?.data;
    } catch (err) {
      console.error('Agent Portal Login failed:', err);
      throw err;
    }
  },

  /**
   * Ensure an active valid token exists
   */
  async ensureAuthenticated(currentUser) {
    const existingToken = getAuthToken() || (typeof localStorage !== 'undefined' ? localStorage.getItem('kers_token') : null);
    if (existingToken) {
      setAuthToken(existingToken);
      return existingToken;
    }

    if (currentUser?.id || currentUser?.email) {
      try {
        const res = await apiFetch('/auth/switch-user', {
          method: 'POST',
          body: JSON.stringify({ userId: currentUser.id, email: currentUser.email }),
        });
        if (res?.data?.token) {
          setAuthToken(res.data.token);
          return res.data.token;
        }
      } catch (err) {
        console.warn('Agent Portal switch-user failed:', err.message);
      }
    }
    return null;
  },

  /**
   * Fetch assigned shipments for Agent Portal
   * GET /api/v1/shipments
   */
  async getShipments(params = {}) {
    await this.ensureAuthenticated();

    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'All') query.append('status', params.status);

    // Auto-inject destination port code NAS for Destination Agent if not overridden
    const destCode = params.destinationCode || 'NAS';
    if (destCode && destCode !== 'All') query.append('destinationCode', destCode);

    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit || 50));

    const qs = query.toString();
    const endpoint = `/shipments${qs ? `?${qs}` : ''}`;
    const res = await apiFetch(endpoint);
    const pagination = res?.pagination || res?.meta || { total: (res?.data || []).length, page: 1, limit: 50 };
    return {
      data: res?.data || [],
      pagination,
      meta: pagination,
    };
  },

  /**
   * Get single shipment details by ID or Number
   * GET /api/v1/shipments/:id
   */
  async getShipmentById(idOrNumber) {
    await this.ensureAuthenticated();
    const res = await apiFetch(`/shipments/${encodeURIComponent(idOrNumber)}`);
    return res?.data || null;
  },

  /**
   * Fetch Master Bills of Lading for Agent Portal
   * GET /api/v1/bills-of-lading
   */
  async getBillsOfLading(params = {}) {
    await this.ensureAuthenticated();

    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit || 50));

    const qs = query.toString();
    const endpoint = `/bills-of-lading${qs ? `?${qs}` : ''}`;
    const res = await apiFetch(endpoint);
    const pagination = res?.pagination || res?.meta || { total: (res?.data || []).length, page: 1, limit: 50 };
    return {
      data: res?.data || [],
      pagination,
      meta: pagination,
    };
  },

  /**
   * Get Master B/L details with Hold Status
   * GET /api/v1/bills-of-lading/:id
   */
  async getBillOfLadingById(idOrNumber) {
    await this.ensureAuthenticated();
    const res = await apiFetch(`/bills-of-lading/${encodeURIComponent(idOrNumber)}`);
    return res?.data || null;
  },

  /**
   * Fetch Ocean Manifests for Agent Portal
   * GET /api/v1/manifests
   */
  async getManifests(params = {}) {
    await this.ensureAuthenticated();

    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit || 50));

    const qs = query.toString();
    const endpoint = `/manifests${qs ? `?${qs}` : ''}`;
    const res = await apiFetch(endpoint);
    const pagination = res?.pagination || res?.meta || { total: (res?.data || []).length, page: 1, limit: 50 };
    return {
      data: res?.data || [],
      pagination,
      meta: pagination,
    };
  },

  /**
   * Get single manifest details
   * GET /api/v1/manifests/:id
   */
  async getManifestById(idOrNumber) {
    await this.ensureAuthenticated();
    const res = await apiFetch(`/manifests/${encodeURIComponent(idOrNumber)}`);
    return res?.data || null;
  },

  /**
   * Fetch Documents repository
   * GET /api/v1/documents
   */
  async getDocuments(params = {}) {
    await this.ensureAuthenticated();

    const query = new URLSearchParams();
    if (params.entityType) query.append('entityType', params.entityType);
    if (params.entityId) query.append('entityId', params.entityId);
    if (params.documentType) query.append('documentType', params.documentType);
    if (params.limit) query.append('limit', String(params.limit || 50));

    const qs = query.toString();
    const endpoint = `/documents${qs ? `?${qs}` : ''}`;
    const res = await apiFetch(endpoint);
    const pagination = res?.pagination || res?.meta || { total: (res?.data || []).length, page: 1, limit: 50 };
    return {
      data: res?.data || [],
      pagination,
      meta: pagination,
    };
  },

  /**
   * Lookup live shipment tracking
   * GET /api/v1/tracking/:trackingNumber
   */
  async trackShipment(trackingNumber) {
    const res = await apiFetch(`/tracking/${encodeURIComponent(trackingNumber)}`);
    return res?.data || null;
  },

  /**
   * Get Agent profile and credit details
   * GET /api/v1/agents/:id
   */
  async getAgentProfile(idOrCode = 'AGT-001') {
    await this.ensureAuthenticated();
    const res = await apiFetch(`/agents/${encodeURIComponent(idOrCode)}`);
    return res?.data || null;
  },

  /**
   * Get aggregated live Dashboard statistics directly from backend
   */
  async getDashboardData() {
    await this.ensureAuthenticated();

    const [shipmentsRes, blsRes, manifestsRes] = await Promise.all([
      this.getShipments({ limit: 100 }),
      this.getBillsOfLading({ limit: 100 }),
      this.getManifests({ limit: 100 }),
    ]);

    const shipments = shipmentsRes.data || [];
    const billsOfLading = blsRes.data || [];
    const manifests = manifestsRes.data || [];

    const holdBLs = billsOfLading.filter(
      (b) => b.status === 'On Hold' || b.holdDetails?.isOnHold
    );

    const totalCbm = shipments.reduce(
      (sum, s) => sum + (Number(s.totalCbm) || 0),
      0
    );
    const totalPackages = shipments.reduce(
      (sum, s) => sum + (Number(s.totalPackages) || 0),
      0
    );

    return {
      shipments,
      billsOfLading,
      manifests,
      holdBLs,
      stats: {
        assignedCount: shipments.length,
        holdCount: holdBLs.length,
        documentsCount: billsOfLading.length + manifests.length,
        totalCbm: totalCbm.toFixed(1),
        totalPackages,
      },
    };
  },
};
