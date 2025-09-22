import { Link } from 'react-router-dom';
import { Eye, MessageCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import './PostCard.css';

const PostCard = ({ post }) => {


  return (
    <article className="post-card">
      <Link to={`/post/${post._id || post.id}`} className="post-link">
        <div className="post-image-container">
          <img
            src={post.image}
            alt={post.title}
            className="post-image"
            loading="lazy"
          />
        </div>

        <div className="post-content">
          <div className="post-header">
            <h2 className="post-title">{post.title}</h2>
            <p className="post-excerpt">{post.excerpt}</p>
          </div>

          <div className="post-meta">
            <div className="post-author">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="author-avatar"
              />
              <div className="author-info">
                <span className="author-name">{post.author.name}</span>
                <span className="post-date">
                  <Calendar size={14} />
                  {format(new Date(post.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
            </div>

            <div className="post-stats">
              <span className="post-stat">
                <Eye size={16} />
                {post.views}
              </span>
              <span className="post-stat">
                <MessageCircle size={16} />
                {post.comments}
              </span>
              <span className="post-read-time">{post.readTime}</span>
            </div>
          </div>
        </div>
      </Link>

      
    </article>
  );
};

export default PostCard;

