import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  posts: [],
  currentPost: null,
  userPosts: [],
  searchResults: [],
  loading: false,
  error: null,
  searchQuery: '',
  filterTag: '',
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setPosts: (state, action) => {
      state.posts = action.payload;
    },
    setCurrentPost: (state, action) => {
      state.currentPost = action.payload;
    },
    setUserPosts: (state, action) => {
      state.userPosts = action.payload;
    },
    addPost: (state, action) => {
      state.posts.unshift(action.payload);
      state.userPosts.unshift(action.payload);
    },
    updatePost: (state, action) => {
      const index = state.posts.findIndex(post => post.id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = action.payload;
      }
      const userIndex = state.userPosts.findIndex(post => post.id === action.payload.id);
      if (userIndex !== -1) {
        state.userPosts[userIndex] = action.payload;
      }
      if (state.currentPost && state.currentPost.id === action.payload.id) {
        state.currentPost = action.payload;
      }
    },
    deletePost: (state, action) => {
      state.posts = state.posts.filter(post => post.id !== action.payload);
      state.userPosts = state.userPosts.filter(post => post.id !== action.payload);
      if (state.currentPost && state.currentPost.id === action.payload) {
        state.currentPost = null;
      }
    },
    toggleLike: (state, action) => {
      const { postId, userId } = action.payload;
      const post = state.posts.find(p => p.id === postId);
      if (post) {
        const isLiked = post.likes.includes(userId);
        if (isLiked) {
          post.likes = post.likes.filter(id => id !== userId);
        } else {
          post.likes.push(userId);
        }
      }
    },
    toggleBookmark: (state, action) => {
      const { postId, userId } = action.payload;
      const post = state.posts.find(p => p.id === postId);
      if (post) {
        const isBookmarked = post.bookmarks.includes(userId);
        if (isBookmarked) {
          post.bookmarks = post.bookmarks.filter(id => id !== userId);
        } else {
          post.bookmarks.push(userId);
        }
      }
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setFilterTag: (state, action) => {
      state.filterTag = action.payload;
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setPosts,
  setCurrentPost,
  setUserPosts,
  addPost,
  updatePost,
  deletePost,
  toggleLike,
  toggleBookmark,
  setSearchQuery,
  setFilterTag,
  setSearchResults,
  setError,
  clearError,
} = postsSlice.actions;

export default postsSlice.reducer;

