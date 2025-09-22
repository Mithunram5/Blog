const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      ...options
    };

    try {
      console.log('Making request to:', url, 'with config:', config);
      const response = await fetch(url, config);
      let data;
      
      try {
        data = await response.json();
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        // Use the server's error message if available
        const errorMessage = data?.message || 'Request failed';
        console.error('Server error:', data);
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication API
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST'
    });
  }

  // Posts API
  async getPosts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/posts${queryString ? `?${queryString}` : ''}`);
  }

  async getPost(id) {
    return this.request(`/posts/${id}`);
  }

  async createPost(postData) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  }

  async updatePost(id, postData) {
    return this.request(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData)
    });
  }

  async deletePost(id) {
    return this.request(`/posts/${id}`, {
      method: 'DELETE'
    });
  }

  async likePost(id) {
    return this.request(`/posts/${id}/like`, {
      method: 'POST'
    });
  }

  async bookmarkPost(id) {
    return this.request(`/posts/${id}/bookmark`, {
      method: 'POST'
    });
  }

  async addComment(id, content) {
    return this.request(`/posts/${id}/comment`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  // Users API
  async getUser(userId) {
    return this.request(`/users/${userId}`);
  }

  async getUserPosts(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users/${userId}/posts${queryString ? `?${queryString}` : ''}`);
  }

  async followUser(userId) {
    return this.request(`/users/${userId}/follow`, {
      method: 'POST'
    });
  }

  async getFollowers(userId) {
    return this.request(`/users/${userId}/followers`);
  }

  async getFollowing(userId) {
    return this.request(`/users/${userId}/following`);
  }

  async getLikedPosts(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users/${userId}/liked-posts${queryString ? `?${queryString}` : ''}`);
  }

  async getBookmarkedPosts(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users/${userId}/bookmarked-posts${queryString ? `?${queryString}` : ''}`);
  }

  // Search API
  async search(query, params = {}) {
    const searchParams = { q: query, ...params };
    const queryString = new URLSearchParams(searchParams).toString();
    return this.request(`/search${queryString ? `?${queryString}` : ''}`);
  }

  async getTags(limit = 20) {
    return this.request(`/search/tags?limit=${limit}`);
  }

  async getSuggestions(query) {
    return this.request(`/search/suggestions?q=${encodeURIComponent(query)}`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

