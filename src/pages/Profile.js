import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setUserPosts } from '../store/slices/postsSlice';
import apiService from '../services/api';
import PostCard from '../components/Post/PostCard';
import { 
  Calendar, 
  UserPlus, 
  Mail, 
  Edit3,
  Settings,
  BookOpen,
  Heart,
  Bookmark
} from 'lucide-react';
import { format } from 'date-fns';
import './Profile.css';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user: currentUser, isAuthenticated } = useSelector(state => state.auth);
  const { userPosts } = useSelector(state => state.posts);
  const [profileUser, setProfileUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    const load = async () => {
      try {
        const userRes = await apiService.getUser(userId);
        const user = userRes?.data?.user;
        if (user) {
          setProfileUser({
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio || '',
            joinDate: user.createdAt || new Date().toISOString(),
            followers: user.followerCount || 0,
            following: user.followingCount || 0,
          });
        }
        const postsRes = await apiService.getUserPosts(userId, { limit: 50 });
        const posts = (postsRes?.data?.posts || []).map(p => ({
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
        }));
        dispatch(setUserPosts(posts));
      } catch (e) {
        setProfileUser(null);
        dispatch(setUserPosts([]));
      }
    };
    load();
  }, [userId, dispatch]);

  const handleFollow = () => {
    if (isAuthenticated) {
      setIsFollowing(!isFollowing);
    } else {
      navigate('/login');
    }
  };

  const handleEditProfile = () => {
    // In a real app, this would open an edit profile modal
    console.log('Edit profile');
  };

  if (!profileUser) {
    return (
      <div className="profile-not-found">
        <h2>User not found</h2>
        <p>The user you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Go Home
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === profileUser.id;
  const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes ? post.likes.length : 0), 0);
  const totalBookmarks = userPosts.reduce((sum, post) => sum + (post.bookmarks ? post.bookmarks.length : 0), 0);

  return (
    <div className="profile-page">
      <div className="container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-cover">
            <div className="profile-cover-image"></div>
          </div>
          
          <div className="profile-info">
            <div className="profile-avatar-container">
              <img
                src={profileUser.avatar}
                alt={profileUser.name}
                className="profile-avatar"
              />
              {isOwnProfile && (
                <button
                  className="edit-avatar-btn"
                  onClick={handleEditProfile}
                  title="Edit profile"
                >
                  <Edit3 size={16} />
                </button>
              )}
            </div>

            <div className="profile-details">
              <h1 className="profile-name">{profileUser.name}</h1>
              <p className="profile-bio">{profileUser.bio}</p>
              
              <div className="profile-meta">
                <div className="meta-item">
                  <Calendar size={16} />
                  <span>Joined {format(new Date(profileUser.joinDate), 'MMM yyyy')}</span>
                </div>
                <div className="meta-item">
                  <Mail size={16} />
                  <span>{profileUser.email}</span>
                </div>
              </div>

              <div className="profile-stats">
                <div className="stat">
                  <span className="stat-number">{userPosts.length}</span>
                  <span className="stat-label">Posts</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{profileUser.followers}</span>
                  <span className="stat-label">Followers</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{profileUser.following}</span>
                  <span className="stat-label">Following</span>
                </div>
              </div>

              <div className="profile-actions">
                {isOwnProfile ? (
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/create-post')}
                  >
                    <BookOpen size={16} />
                    Write Post
                  </button>
                ) : (
                  <button
                    className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={handleFollow}
                  >
                    <UserPlus size={16} />
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
                
                {isOwnProfile && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => navigate('/settings')}
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="profile-content">
          <div className="profile-tabs">
            <button
              className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              <BookOpen size={16} />
              Posts ({userPosts.length})
            </button>
            <button
              className={`tab ${activeTab === 'likes' ? 'active' : ''}`}
              onClick={() => setActiveTab('likes')}
            >
              <Heart size={16} />
              Liked ({totalLikes})
            </button>
            <button
              className={`tab ${activeTab === 'bookmarks' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookmarks')}
            >
              <Bookmark size={16} />
              Bookmarks ({totalBookmarks})
            </button>
          </div>

          <div className="profile-tab-content">
            {activeTab === 'posts' && (
              <div className="posts-section">
                {userPosts.length > 0 ? (
                  <div className="posts-grid">
                    {userPosts.map(post => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <BookOpen size={48} />
                    <h3>No posts yet</h3>
                    <p>
                      {isOwnProfile
                        ? "You haven't written any posts yet. Start sharing your thoughts!"
                        : `${profileUser.name} hasn't written any posts yet.`}
                    </p>
                    {isOwnProfile && (
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate('/create-post')}
                      >
                        Write Your First Post
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'likes' && (
              <div className="likes-section">
                <div className="empty-state">
                  <Heart size={48} />
                  <h3>No liked posts</h3>
                  <p>
                    {isOwnProfile
                      ? "You haven't liked any posts yet. Start exploring!"
                      : `${profileUser.name} hasn't liked any posts yet.`}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'bookmarks' && (
              <div className="bookmarks-section">
                <div className="empty-state">
                  <Bookmark size={48} />
                  <h3>No bookmarks</h3>
                  <p>
                    {isOwnProfile
                      ? "You haven't bookmarked any posts yet. Start saving posts you love!"
                      : `${profileUser.name} hasn't bookmarked any posts yet.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
