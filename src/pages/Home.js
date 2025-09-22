import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setPosts, setLoading } from '../store/slices/postsSlice';
// tags fetched from API
import PostCard from '../components/Post/PostCard';
import TagCloud from '../components/UI/TagCloud';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Hero from '../components/UI/Hero';
import apiService from '../services/api';
import './Home.css';

const Home = () => {
  const dispatch = useDispatch();
  const { posts, loading } = useSelector(state => state.posts);
  const { isAuthenticated } = useSelector(state => state.auth);
  const [selectedTag, setSelectedTag] = useState('');
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        dispatch(setLoading(true));
        const res = await apiService.getPosts({ limit: 20 });
        const apiPosts = (res?.data?.posts || []).map(p => ({
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
          comments: Array.isArray(p.comments) ? p.comments.length : (p.commentCount || 0),
          views: p.views || 0,
          author: p.author ? {
            id: p.author._id,
            name: p.author.name,
            avatar: p.author.avatar,
          } : { id: '', name: 'Unknown', avatar: '' },
        }));
        dispatch(setPosts(apiPosts));
      } catch (e) {
        console.error('Failed to load posts', e);
        dispatch(setPosts([]));
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchPosts();
  }, [dispatch]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await apiService.getTags(30);
        setTags((res?.data?.tags || []).map(t => t.name || t));
      } catch {}
    };
    fetchTags();
  }, []);

  const filteredPosts = selectedTag
    ? posts.filter(post => post.tags.includes(selectedTag))
    : posts;

  const handleTagClick = (tag) => {
    setSelectedTag(selectedTag === tag ? '' : tag);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="home">
      {!isAuthenticated && <Hero />}
      <div className="container">
        <div className="home-content">
          <main className="posts-section">
            <div className="section-header">
              <h2 className="section-title">
                {selectedTag ? `Posts tagged with "${selectedTag}"` : 'Latest Posts'}
              </h2>
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag('')}
                  className="btn btn-ghost btn-sm"
                >
                  Clear filter
                </button>
              )}
            </div>

            <div className="posts-grid">
              {filteredPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="empty-state">
                <h3>No posts found</h3>
                <p>
                  {selectedTag
                    ? `No posts found with the tag "${selectedTag}"`
                    : 'No posts available at the moment.'}
                </p>
              </div>
            )}
          </main>

          <aside className="sidebar">
            <TagCloud
              tags={tags}
              selectedTag={selectedTag}
              onTagClick={handleTagClick}
            />
            
            <div className="sidebar-widget">
              <h3 className="widget-title">Popular This Week</h3>
              <div className="popular-posts">
                {[...posts]
                  .sort((a, b) => b.views - a.views)
                  .slice(0, 5)
                  .map(post => (
                    <div key={post.id} className="popular-post">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="popular-post-image"
                      />
                      <div className="popular-post-content">
                        <h4 className="popular-post-title">
                          <a href={`/post/${post.id}`}>{post.title}</a>
                        </h4>
                        <p className="popular-post-meta">
                          {post.views} views • {post.readTime}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Home;
