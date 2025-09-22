import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setSearchQuery, setSearchResults, setFilterTag } from '../store/slices/postsSlice';
import apiService from '../services/api';
import PostCard from '../components/Post/PostCard';
import TagCloud from '../components/UI/TagCloud';
import { Search as SearchIcon, Filter, X } from 'lucide-react';
import './Search.css';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { searchQuery, filterTag, searchResults } = useSelector(state => state.posts);
  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const [showFilters, setShowFilters] = useState(false);

  const performSearch = useCallback(async (query, tag) => {
    try {
      // Only search if we have either a query or a tag
      if (!query && !tag) {
        dispatch(setSearchResults([]));
        return;
      }
      
      const res = await apiService.search(query || '', { type: 'posts', tag });
      const posts = (res?.data?.posts || []).map(p => ({
        id: p._id,
        title: p.title,
        content: p.content,
        excerpt: p.excerpt,
        image: p.image,
        tags: p.tags || [],
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        readTime: p.readTime || '5 min read',
        likes: p.likes || [],
        bookmarks: p.bookmarks || [],
        comments: Array.isArray(p.comments) ? p.comments.length : 0,
        views: p.views || 0,
        author: p.author ? {
          id: p.author._id,
          name: p.author.name,
          avatar: p.author.avatar,
        } : { id: '', name: 'Unknown', avatar: '' },
      }));
      dispatch(setSearchResults(posts));
    } catch (e) {
      dispatch(setSearchResults([]));
    }
  }, [dispatch]);

  useEffect(() => {
    const query = searchParams.get('q') || '';
    const tag = searchParams.get('tag') || '';

    if (query) {
      setLocalQuery(query);
      dispatch(setSearchQuery(query));
    }

    if (tag) {
      dispatch(setFilterTag(tag));
    }

    performSearch(query, tag);
  }, [searchParams, dispatch, performSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = localQuery.trim();

    if (query) {
      setSearchParams({ q: query });
      dispatch(setSearchQuery(query));
      performSearch(query, filterTag);
    }
  };

  const handleTagClick = (tag) => {
    const newTag = filterTag === tag ? '' : tag;
    dispatch(setFilterTag(newTag));

    const params = new URLSearchParams(searchParams);
    if (newTag) {
      params.set('tag', newTag);
    } else {
      params.delete('tag');
    }
    setSearchParams(params);

    performSearch(searchQuery, newTag);
  };

  const clearFilters = () => {
    setLocalQuery('');
    setSearchParams({});
    dispatch(setSearchQuery(''));
    dispatch(setFilterTag(''));
    dispatch(setSearchResults([]));
    performSearch('', '');
  };

  const hasActiveFilters = searchQuery || filterTag;

  return (
    <div className="search-page">
      <div className="container">
        <div className="search-header">
          <h1 className="search-title">Search Posts</h1>
          <p className="search-subtitle">
            Find the content you're looking for
          </p>
        </div>

        <div className="search-content">
          <div className="search-sidebar">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-container">
                <SearchIcon size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search posts, tags, or authors..."
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  className="search-input"
                />
                {localQuery && (
                  <button
                    type="button"
                    onClick={() => setLocalQuery('')}
                    className="clear-button"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </form>

            <div className="filters-section">
              <div className="filters-header">
                <h3>Filters</h3>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={16} />
                  {showFilters ? 'Hide' : 'Show'}
                </button>
              </div>

              {showFilters && (
                <div className="filters-content">
                  <TagCloud
                    tags={[]}
                    selectedTag={filterTag}
                    onTagClick={handleTagClick}
                  />
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <div className="active-filters">
                <h4>Active Filters</h4>
                <div className="filter-tags">
                  {searchQuery && (
                    <span className="filter-tag">
                      Query: "{searchQuery}"
                      <button
                        onClick={() => {
                          setLocalQuery('');
                          setSearchParams({ tag: filterTag });
                          dispatch(setSearchQuery(''));
                          performSearch('', filterTag);
                        }}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {filterTag && (
                    <span className="filter-tag">
                      Tag: {filterTag}
                      <button
                        onClick={() => {
                          setSearchParams({ q: searchQuery });
                          dispatch(setFilterTag(''));
                          performSearch(searchQuery, '');
                        }}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                </div>
                <button onClick={clearFilters} className="btn btn-ghost btn-sm">
                  Clear All
                </button>
              </div>
            )}
          </div>

          <main className="search-results">
            <div className="results-header">
              <h2>
                {hasActiveFilters ? 'Search Results' : 'All Posts'}
                {searchResults.length > 0 && (
                  <span className="results-count">({searchResults.length})</span>
                )}
              </h2>
            </div>

            {searchResults.length > 0 ? (
              <div className="results-grid">
                {searchResults.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <SearchIcon size={48} />
                <h3>No posts found</h3>
                <p>
                  {hasActiveFilters
                    ? 'Try adjusting your search terms or filters'
                    : 'No posts available at the moment'}
                </p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="btn btn-primary">
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Search;
