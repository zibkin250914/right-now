// Direct Supabase API calls without client library
const SUPABASE_URL = 'https://yubnlqdboiamaoxkisjl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_MlCDY953SXcbwMwjdIqtrQ_3_gOK9Bv'

// Helper function to make Supabase API calls
async function supabaseRequest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (!response.ok) {
    throw new Error(`Supabase API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

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
      // Get posts with pagination
      try {
        const { page = 1, limit = 20 } = event.queryStringParameters || {}
        const offset = (parseInt(page) - 1) * parseInt(limit)
        
        // Get posts with pagination
        const posts = await supabaseRequest(`posts?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`)
        
        // Get total count
        const countResponse = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=count`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'count=exact'
          }
        })
        
        const totalCount = countResponse.headers.get('content-range')?.split('/')[1] || 0
        const totalPages = Math.ceil(parseInt(totalCount) / parseInt(limit))
        const hasMore = parseInt(page) < totalPages
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            posts,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: parseInt(totalCount),
              totalPages,
              hasMore
            }
          })
        }
      } catch (error) {
        console.error('Error fetching posts:', error)
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch posts' })
        }
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

      try {
        const data = await supabaseRequest('posts', {
          method: 'POST',
          body: JSON.stringify([{ channel, chat_id, message, password }]),
          headers: {
            'Prefer': 'return=representation'
          }
        })
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ post: data[0] })
        }
      } catch (error) {
        console.error('Error creating post:', error)
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to create post' })
        }
      }
    }

    // Individual post operations (PUT, DELETE)
    if (httpMethod === 'PUT' || httpMethod === 'DELETE') {
      let postId
      
      // Try to get postId from path segments first
      if (pathSegments.length > 2) {
        postId = pathSegments[2]
      } else {
        // If not in path, try to get from request body
        try {
          const requestBody = JSON.parse(body)
          postId = requestBody.id
        } catch (parseError) {
          console.error('Failed to parse body for postId:', parseError)
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Post ID is required' })
          }
        }
      }

      if (!postId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Post ID is required' })
        }
      }

      if (httpMethod === 'PUT') {
        const { channel, chat_id, message, password } = JSON.parse(body)

        if (!channel || !chat_id || !message || !password) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required fields' })
          }
        }

        try {
          const data = await supabaseRequest(`posts?id=eq.${postId}`, {
            method: 'PATCH',
            body: JSON.stringify({ channel, chat_id, message, password }),
            headers: {
              'Prefer': 'return=representation'
            }
          })
          
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
        } catch (error) {
          console.error('Error updating post:', error)
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to update post' })
          }
        }
      }

      if (httpMethod === 'DELETE') {
        try {
          const data = await supabaseRequest(`posts?id=eq.${postId}`, {
            method: 'DELETE',
            headers: {
              'Prefer': 'return=representation'
            }
          })
          
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
            body: JSON.stringify({ 
              success: true, 
              deletedPost: data[0] 
            })
          }
        } catch (error) {
          console.error('Error deleting post:', error)
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to delete post' })
          }
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
