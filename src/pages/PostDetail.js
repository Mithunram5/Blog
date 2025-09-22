import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentPost} from '../store/slices/postsSlice';
import apiService from '../services/api';
import { format } from 'date-fns';
import { 
  Heart, 
  Eye, 
  MessageCircle, 
  Calendar, 
  Clock, 
  ArrowLeft,
  User
} from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import './PostDetail.css';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentPost, posts } = useSelector(state => state.posts);
  const { user } = useSelector(state => state.auth);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // prefer existing post from state to avoid extra call
        let post = posts.find(p => p.id === id);
        if (!post) {
          const res = await apiService.getPost(id);
          const p = res?.data?.post;
          if (p) {
            post = {
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
              author: p.author ? { id: p.author._id, name: p.author.name, avatar: p.author.avatar } : { id: '', name: 'Unknown', avatar: '' },
            };
          }
        }
        if (post) {
          dispatch(setCurrentPost(post));
          setIsAuthor(user && post.author && user.id === post.author.id);
        }
      } catch {}
    };
    load();
  }, [id, posts, user, dispatch]);

  
  if (!currentPost) {
    return <LoadingSpinner text="Loading post..." />;
  }

  return (
    <div className="post-detail">
      <div className="container">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <article className="post-article">
          <header className="post-header">
            <div className="post-meta">
              <div className="post-dates">
                <span className="post-date">
                  <Calendar size={16} />
                  {format(new Date(currentPost.createdAt), 'MMM d, yyyy')}
                </span>
                <span className="post-read-time">
                  <Clock size={16} />
                  {currentPost.readTime}
                </span>
              </div>

              
            </div>

            {/* Author controls: top-right */}
            {isAuthor && (
              <div className="post-actions">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate('/create-post', { state: { post: { ...currentPost, _id: currentPost._id || currentPost.id } } })}
                  title="Edit post"
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={async () => {
                    if (!window.confirm('Are you sure you want to delete this post?')) return;
                    setIsDeleting(true);
                    try {
                      await apiService.deletePost(currentPost._id || currentPost.id);
                      navigate('/');
                    } catch (err) {
                      // eslint-disable-next-line no-console
                      console.error('Failed to delete post', err);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting}
                  title="Delete post"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}

            <h1 className="post-title">{currentPost.title}</h1>
            <p className="post-excerpt">{currentPost.excerpt}</p>

            <div className="post-tags">
              {currentPost.tags.map(tag => (
                <span key={tag} className="post-tag">
                  #{tag}
                </span>
              ))}
            </div>
          </header>

          <div className="post-image-container">
            <img
              src={currentPost.image}
              alt={currentPost.title}
              className="post-image"
            />
          </div>

          <div className="post-content">
            {currentPost.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="post-paragraph">
                {paragraph}
              </p>
            ))}
          </div>

          <footer className="post-footer">
            <div className="post-stats">
              <div className="stat">
                <Eye size={20} />
                <span>{currentPost.views} views</span>
              </div>
              <div className="stat">
                <Heart size={20} />
                <span>{currentPost.likes.length} likes</span>
              </div>
              <div className="stat">
                <MessageCircle size={20} />
                <span>{currentPost.comments} comments</span>
              </div>
            </div>

            <div className="author-card">
              <img
                src={currentPost.author.avatar}
                alt={currentPost.author.name}
                className="author-avatar-large"
              />
              <div className="author-info-large">
                <h3 className="author-name-large">{currentPost.author.name}</h3>
                <p className="author-bio">
                  Passionate writer and tech enthusiast. Love sharing knowledge through blogging.
                </p>
                <button className="btn btn-secondary btn-sm">
                  <User size={16} />
                  Follow
                </button>
              </div>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
};

export default PostDetail;

