const { createClient } = require('@supabase/supabase-js')

// Hardcoded Supabase credentials (public info)
const supabaseUrl = 'https://yubnlqdboiamaoxkisjl.supabase.co'
const supabaseAnonKey = 'sb_publishable_MlCDY953SXcbwMwjdIqtrQ_3_gOK9Bv'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

exports.handler = async (event, context) => {
  const { path, httpMethod, body } = event
  const pathSegments = path.split('/').filter(Boolean)
  
  console.log('Posts function called:', {
    path,
    httpMethod,
    pathSegments,
    body: body
  })
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle preflight requests
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  try {
    if (httpMethod === 'GET') {
      // Get all posts
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching posts:', error)
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch posts' })
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ posts })
      }
    }

    if (httpMethod === 'POST') {
      // Create new post
      const { channel, chat_id, message, password } = JSON.parse(body)

      if (!channel || !chat_id || !message || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields' })
        }
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([{ channel, chat_id, message, password }])
        .select()

      if (error) {
        console.error('Error creating post:', error)
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to create post' })
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ post: data[0] })
      }
    }

    // Individual post operations (PUT, DELETE)
    if (pathSegments.length > 2 && (httpMethod === 'PUT' || httpMethod === 'DELETE')) {
      const postId = pathSegments[2]

      if (httpMethod === 'PUT') {
        const { channel, chat_id, message, password } = JSON.parse(body)

        if (!channel || !chat_id || !message || !password) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required fields' })
          }
        }

        const { data, error } = await supabase
          .from('posts')
          .update({ channel, chat_id, message, password })
          .eq('id', postId)
          .select()

        if (error) {
          console.error('Error updating post:', error)
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to update post' })
          }
        }

        if (data.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Post not found' })
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ post: data[0] })
        }
      }

      if (httpMethod === 'DELETE') {
        const { error } = await supabase
          .from('posts')
          .delete()
          .eq('id', postId)

        if (error) {
          console.error('Error deleting post:', error)
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to delete post' })
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        }
      }
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    }

  } catch (error) {
    console.error('Posts API Error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
