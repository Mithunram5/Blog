const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
require('dotenv').config({ path: '../config.env' });

// Sample users data
const users = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    bio: 'Senior software engineer passionate about web development and tech innovation.',
    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=ffffff',
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    password: 'password123',
    bio: 'Tech writer and UI/UX enthusiast. Love creating user-friendly experiences.',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Wilson&background=3b82f6&color=ffffff',
  },
  {
    name: 'Mike Johnson',
    email: 'mike@example.com',
    password: 'password123',
    bio: 'Full-stack developer specializing in React and Node.js. Coffee addict.',
    avatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=3b82f6&color=ffffff',
  },
  {
    name: 'Emily Chen',
    email: 'emily@example.com',
    password: 'password123',
    bio: 'AI researcher and tech blogger. Exploring the frontiers of machine learning.',
    avatar: 'https://ui-avatars.com/api/?name=Emily+Chen&background=3b82f6&color=ffffff',
  }
];

// Sample blog posts
const posts = [
  {
    title: 'Getting Started with React Hooks',
    excerpt: 'Learn how to use React Hooks to manage state and side effects in your functional components.',
    content: `React Hooks have revolutionized how we write React components. In this comprehensive guide, we'll explore:

1. Understanding useState and useEffect
2. Creating custom hooks for reusable logic
3. Best practices and common pitfalls
4. Real-world examples and use cases

React Hooks provide a way to use state and other React features without writing a class component. They were introduced in React 16.8 and have quickly become the standard way of writing React components.

Let's dive into some practical examples and learn how to leverage the power of hooks in your applications.`,
    tags: ['React', 'JavaScript', 'Web Development', 'Frontend'],
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=60',
  },
  {
    title: 'Building Scalable Node.js Applications',
    excerpt: 'Discover best practices for building large-scale Node.js applications that can handle millions of users.',
    content: `Building scalable Node.js applications requires careful consideration of architecture and best practices. Here's what we'll cover:

1. Microservices architecture
2. Caching strategies
3. Database optimization
4. Load balancing and clustering
5. Error handling and monitoring

When building applications that need to scale, it's crucial to think about performance from day one. Let's explore the key concepts and techniques that will help you build robust Node.js applications.`,
    tags: ['Node.js', 'Backend', 'Architecture', 'Performance'],
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&w=800&q=60',
  },
  {
    title: 'Modern CSS Techniques',
    excerpt: 'Explore modern CSS features and techniques that will revolutionize your web design workflow.',
    content: `CSS has evolved significantly in recent years. Let's explore some modern techniques:

1. CSS Grid and Flexbox layouts
2. Custom properties (variables)
3. Modern CSS selectors
4. Animations and transitions
5. Responsive design patterns

Modern CSS provides powerful tools for creating beautiful, responsive layouts. In this guide, we'll look at practical examples of these techniques in action.`,
    tags: ['CSS', 'Web Design', 'Frontend', 'UI/UX'],
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&w=800&q=60',
  },
  {
    title: 'Introduction to TypeScript',
    excerpt: 'Learn why TypeScript is becoming the preferred choice for large-scale JavaScript applications.',
    content: `TypeScript has gained massive popularity in recent years. Here's what makes it special:

1. Static typing and type inference
2. Object-oriented features
3. Enhanced IDE support
4. Better code organization
5. Improved maintainability

TypeScript adds optional static types to JavaScript, making it easier to build and maintain large applications. Let's explore the key features and benefits of using TypeScript in your projects.`,
    tags: ['TypeScript', 'JavaScript', 'Programming', 'Web Development'],
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1610986603166-f78428624e76?auto=format&fit=crop&w=800&q=60',
  }
];

// Seed function
async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('📡 Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of users) {
      // Do NOT pre-hash here. The User model has a pre-save hook that hashes
      // the password. Saving the plain password ensures it's hashed exactly once.
      const user = await User.create({
        ...userData,
        isVerified: true
      });
      createdUsers.push(user);
    }
    console.log('👥 Created users');

    // Create posts
    const createdPosts = [];
    for (let i = 0; i < posts.length; i++) {
      const post = await Post.create({
        ...posts[i],
        author: createdUsers[i % createdUsers.length]._id
      });
      createdPosts.push(post);
    }
    console.log('📝 Created posts');

    // Add some likes and bookmarks
    for (const post of createdPosts) {
      const randomUsers = createdUsers
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * createdUsers.length));
      
      post.likes = randomUsers.map(user => user._id);
      post.bookmarks = randomUsers.slice(0, Math.floor(randomUsers.length / 2)).map(user => user._id);
      post.views = Math.floor(Math.random() * 1000);
      await post.save();
    }
    console.log('❤️ Added likes and bookmarks');

    // Add followers
    for (const user of createdUsers) {
      const otherUsers = createdUsers.filter(u => u._id.toString() !== user._id.toString());
      const randomFollowers = otherUsers
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * otherUsers.length));
      
      user.followers = randomFollowers.map(u => u._id);
      user.following = randomFollowers.slice(0, Math.floor(randomFollowers.length / 2)).map(u => u._id);
      await user.save();
    }
    console.log('👥 Added follower relationships');

    console.log('✅ Database seeded successfully!');
    console.log('\nTest account credentials:');
    users.forEach(user => {
      console.log(`Email: ${user.email} | Password: ${user.password}`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the seed function
seedDatabase();
