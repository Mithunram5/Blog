import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiService from '../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { addPost } from '../store/slices/postsSlice';
import { addNotification } from '../store/slices/uiSlice';
import { 
  Save, 
  Eye, 
  Image, 
  Tag, 
  Type, 
  FileText,
  X
} from 'lucide-react';
import './CreateEditPost.css';

const CreatePost = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const location = useLocation();
  const editingPost = location.state && location.state.post ? location.state.post : null;
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    tags: '',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
  });
  const [errors, setErrors] = useState({});
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (editingPost) {
      setIsEditing(true);
      setFormData({
        title: editingPost.title || '',
        content: editingPost.content || '',
        excerpt: editingPost.excerpt || '',
        tags: (editingPost.tags || []).join(', '),
        image: editingPost.image || ''
      });
    }
  }, [editingPost]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          image: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.trim().length < 50) {
      newErrors.content = 'Content must be at least 50 characters';
    }

    if (!formData.excerpt.trim()) {
      newErrors.excerpt = 'Excerpt is required';
    } else if (formData.excerpt.trim().length < 20) {
      newErrors.excerpt = 'Excerpt must be at least 20 characters';
    }

    if (!formData.tags.trim()) {
      newErrors.tags = 'At least one tag is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isEditing && editingPost && (editingPost._id || editingPost.id)) {
        const postId = editingPost._id || editingPost.id;

        // Validate post ID format
        if (!/^[a-fA-F0-9]{24}$/.test(postId)) {
          dispatch(addNotification({
            type: 'error',
            title: 'Invalid Post ID',
            message: 'The post ID format is invalid. Please try again.',
          }));
          setIsSubmitting(false);
          return;
        }

        // Call update API if available
        try {
          const response = await apiService.updatePost(postId, {
            title: formData.title.trim(),
            content: formData.content.trim(),
            excerpt: formData.excerpt.trim(),
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            image: formData.image,
          });

          if (response.status === 'success' && response.data.post) {
            const updatedPost = response.data.post;
            dispatch(addNotification({
              type: 'success',
              title: 'Post Updated!',
              message: 'Your post has been updated successfully.',
            }));

            navigate(`/post/${updatedPost._id}`);
          } else {
            throw new Error('Invalid response from server');
          }
          return;
        } catch (err) {
          dispatch(addNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to update post. Please try again.',
          }));
          setIsSubmitting(false);
          return;
        }
      }

      // Create new post
      const response = await apiService.createPost({
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim(),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        image: formData.image
      });

      if (!response.status === 'success' || !response.data?.post) {
        throw new Error('Invalid response from server');
      }

      const newPost = response.data.post;

      dispatch(addPost(newPost));

      dispatch(addNotification({
        type: 'success',
        title: 'Post Created!',
        message: 'Your post has been published successfully.',
      }));

      navigate(`/post/${newPost._id}`);
    } catch (error) {
      console.error('Create/Update post error:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to handle post. Please try again.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    setIsPreview(!isPreview);
  };

  const wordCount = formData.content.split(' ').length;
  const readTime = Math.ceil(wordCount / 200);

  return (
    <div className="create-post-page">
      <div className="container">
        <div className="post-editor">
          <div className="editor-header">
            <h1 className="editor-title">Create New Post</h1>
            <div className="editor-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePreview}
              >
                <Eye size={16} />
                {isPreview ? 'Edit' : 'Preview'}
              </button>
              <button
                type="submit"
                form="post-form"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                <Save size={16} />
                {isSubmitting ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>

          <form id="post-form" onSubmit={handleSubmit} className="editor-form">
            <div className="editor-content">
              {!isPreview ? (
                <div className="editor-inputs">
                  <div className="form-group">
                    <label htmlFor="title" className="form-label">
                      <Type size={16} />
                      Post Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={`form-input ${errors.title ? 'error' : ''}`}
                      placeholder="Enter your post title..."
                    />
                    {errors.title && <span className="error-message">{errors.title}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="excerpt" className="form-label">
                      <FileText size={16} />
                      Excerpt
                    </label>
                    <textarea
                      id="excerpt"
                      name="excerpt"
                      value={formData.excerpt}
                      onChange={handleChange}
                      className={`form-input form-textarea ${errors.excerpt ? 'error' : ''}`}
                      placeholder="Write a brief description of your post..."
                      rows="3"
                    />
                    {errors.excerpt && <span className="error-message">{errors.excerpt}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="content" className="form-label">
                      <FileText size={16} />
                      Content
                    </label>
                    <textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      className={`form-input form-textarea ${errors.content ? 'error' : ''}`}
                      placeholder="Write your post content here..."
                      rows="15"
                    />
                    <div className="content-stats">
                      <span>{wordCount} words</span>
                      <span>{readTime} min read</span>
                    </div>
                    {errors.content && <span className="error-message">{errors.content}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="tags" className="form-label">
                      <Tag size={16} />
                      Tags
                    </label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      className={`form-input ${errors.tags ? 'error' : ''}`}
                      placeholder="Enter tags separated by commas (e.g., React, JavaScript, Tutorial)"
                    />
                    {errors.tags && <span className="error-message">{errors.tags}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="image" className="form-label">
                      <Image size={16} />
                      Featured Image
                    </label>
                    <div className="image-upload">
                      <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="image-input"
                      />
                      <label htmlFor="image" className="image-upload-label">
                        <Image size={20} />
                        Choose Image
                      </label>
                      <div className="image-preview">
                        <img src={formData.image} alt="Preview" />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                          className="remove-image"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="post-preview">
                  <div className="preview-image">
                    <img src={formData.image} alt={formData.title} />
                  </div>
                  <div className="preview-content">
                    <h1 className="preview-title">{formData.title || 'Untitled'}</h1>
                    <p className="preview-excerpt">{formData.excerpt || 'No excerpt provided'}</p>
                    <div className="preview-tags">
                      {formData.tags.split(',').map((tag, index) => (
                        <span key={index} className="preview-tag">
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                    <div className="preview-text">
                      {formData.content.split('\n\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
