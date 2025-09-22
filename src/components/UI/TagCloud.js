import React from 'react';
import { Hash } from 'lucide-react';
import './TagCloud.css';

const TagCloud = ({ tags, selectedTag, onTagClick }) => {
  return (
    <div className="tag-cloud">
      <h3 className="tag-cloud-title">
        <Hash size={20} />
        Popular Tags
      </h3>
      <div className="tags-container">
        {tags.map(tag => (
          <button
            key={tag}
            className={`tag ${selectedTag === tag ? 'selected' : ''}`}
            onClick={() => onTagClick(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TagCloud;

