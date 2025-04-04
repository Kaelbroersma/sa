import React, { useState, useEffect } from 'react';
import { callNetlifyFunction } from '../../lib/supabase';
import { Plus, Pencil, Trash2, X, Search, Filter } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface BlogPost {
  id: string;
  content: string;
  featured_image: string;
  author: string;  // Changed from author_id to match database
  published_at: string | null;
  updated_at: string;
  meta_description: string;
  meta_keywords: string;
  is_published: boolean;
  reading_time_minutes: number;
  tags: string[];
}

const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching blog posts...');
      const response = await callNetlifyFunction('adminBlogPosts');
      console.log('Raw response:', response);
      
      if (response.error) {
        console.error('Error in response:', response.error);
        setError(response.error.message || 'Failed to fetch blog posts');
        return;
      }
      
      if (!response.data) {
        console.error('No data in response');
        setError('No blog posts found');
        return;
      }
      
      console.log('Blog posts data:', response.data);
      setPosts(response.data);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching blog posts:', error);
      setError(error.message || 'Failed to fetch blog posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    try {
      setIsLoading(true);
      console.log('Updating blog post:', editingPost);
      
      const response = await callNetlifyFunction('adminUpdateBlogPost', {
        post: {
          id: editingPost.id,
          content: editingPost.content,
          featured_image: editingPost.featured_image,
          author: editingPost.author,
          published_at: editingPost.published_at,
          updated_at: new Date().toISOString(),
          meta_description: editingPost.meta_description,
          meta_keywords: editingPost.meta_keywords,
          is_published: editingPost.is_published,
          reading_time_minutes: editingPost.reading_time_minutes,
          tags: editingPost.tags
        }
      });

      if (response.error) {
        console.error('Error updating post:', response.error);
        setError(response.error.message || 'Failed to update blog post');
        return;
      }

      console.log('Blog post updated successfully:', response.data);
      setIsEditing(false);
      setEditingPost(null);
      await fetchPosts();
    } catch (error: any) {
      console.error('Error updating post:', error);
      setError(error.message || 'Failed to update blog post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setIsEditing(true);
    setPreviewMode(false);
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      setIsLoading(true);
      const response = await callNetlifyFunction('adminDeleteBlogPost', { id: postId });
      
      if (response.error) {
        console.error('Error deleting post:', response.error);
        setError(response.error.message || 'Failed to delete blog post');
        return;
      }

      console.log('Blog post deleted successfully');
      await fetchPosts();
    } catch (error: any) {
      console.error('Error deleting post:', error);
      setError(error.message || 'Failed to delete blog post');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.content?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'published') return matchesSearch && post.is_published;
    return matchesSearch && !post.is_published;
  });

  const calculateReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tan"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-tan">Blog Posts</h2>
        <button 
          onClick={() => {
            setEditingPost({
              id: '',
              content: '',
              featured_image: '',
              author: '',
              published_at: null,
              updated_at: new Date().toISOString(),
              meta_description: '',
              meta_keywords: '',
              is_published: false,
              reading_time_minutes: 0,
              tags: []
            });
            setIsEditing(true);
          }}
          className="bg-tan text-gunmetal px-4 py-2 rounded-sm flex items-center hover:bg-tan/90 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          New Post
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-gunmetal p-4 rounded-sm shadow-luxury mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gunmetal-light pl-10 pr-4 py-2 rounded-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gunmetal-light px-4 py-2 rounded-sm"
          >
            <option value="all">All Posts</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-gunmetal p-6 rounded-sm shadow-luxury relative group"
          >
            <div className="absolute top-4 right-4 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEdit(post)}
                className="p-2 bg-tan/10 rounded-sm hover:bg-tan/20 transition-colors"
              >
                <Pencil size={16} className="text-tan" />
              </button>
              <button 
                onClick={() => handleDelete(post.id)}
                className="p-2 bg-red-500/10 rounded-sm hover:bg-red-500/20 transition-colors"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            </div>

            {post.featured_image && (
              <div className="aspect-video mb-4 rounded-sm overflow-hidden">
                <img
                  src={post.featured_image}
                  alt={post.content}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-xl font-bold mb-2">{post.content}</h3>
              <p className="text-gray-400 text-sm line-clamp-2">{post.meta_description}</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags && post.tags.length > 0 ? (
                post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gunmetal-light rounded-sm text-xs text-gray-400"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="px-2 py-1 bg-gunmetal-light rounded-sm text-xs text-gray-400">
                  No tags
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Author:</span>
                <span>{post.author || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Reading Time:</span>
                <span>{post.reading_time_minutes} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Updated:</span>
                <span>{new Date(post.updated_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gunmetal-light">
              <span className={`px-2 py-1 rounded-sm text-xs ${
                post.is_published ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
              }`}>
                {post.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditing && editingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gunmetal p-6 rounded-sm w-full max-w-4xl h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingPost.id ? 'Edit Post' : 'New Post'}</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="text-tan hover:text-tan/80 transition-colors"
                >
                  {previewMode ? 'Edit Mode' : 'Preview'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditingPost(null);
                  }}
                  className="p-2 hover:bg-gunmetal-light rounded-sm transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdatePost}>
              <div className="space-y-4">
                {!previewMode ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Content (Markdown)</label>
                      <textarea
                        value={editingPost.content}
                        onChange={(e) => {
                          const newContent = e.target.value;
                          setEditingPost({
                            ...editingPost,
                            content: newContent,
                            reading_time_minutes: calculateReadingTime(newContent)
                          });
                        }}
                        className="w-full bg-gunmetal-light p-2 rounded-sm h-64 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Featured Image URL</label>
                      <input
                        type="text"
                        value={editingPost.featured_image}
                        onChange={(e) => setEditingPost({ ...editingPost, featured_image: e.target.value })}
                        className="w-full bg-gunmetal-light p-2 rounded-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Author</label>
                      <input
                        type="text"
                        value={editingPost.author}
                        onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                        className="w-full bg-gunmetal-light p-2 rounded-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Meta Description</label>
                      <textarea
                        value={editingPost.meta_description}
                        onChange={(e) => setEditingPost({ ...editingPost, meta_description: e.target.value })}
                        className="w-full bg-gunmetal-light p-2 rounded-sm h-24"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={editingPost.tags.join(', ')}
                        onChange={(e) => setEditingPost({
                          ...editingPost,
                          tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                        })}
                        className="w-full bg-gunmetal-light p-2 rounded-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Meta Keywords</label>
                      <input
                        type="text"
                        value={editingPost.meta_keywords}
                        onChange={(e) => setEditingPost({ ...editingPost, meta_keywords: e.target.value })}
                        className="w-full bg-gunmetal-light p-2 rounded-sm"
                        required
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingPost.is_published}
                        onChange={(e) => setEditingPost({ ...editingPost, is_published: e.target.checked })}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium">Published</label>
                    </div>
                  </>
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <h1>{editingPost.content}</h1>
                    {editingPost.featured_image && (
                      <img
                        src={editingPost.featured_image}
                        alt={editingPost.content}
                        className="w-full max-h-96 object-cover rounded-sm mb-8"
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6 space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingPost(null);
                  }}
                  className="px-4 py-2 bg-gunmetal-light rounded-sm hover:bg-gunmetal-light/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-tan text-gunmetal rounded-sm hover:bg-tan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPage; 