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
  const { httpMethod, queryStringParameters } = event
  
  console.log('Search function called:', {
    httpMethod,
    queryStringParameters
  })
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  if (httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { q: query = '', channel = '', page = 1, limit = 20 } = queryStringParameters || {}
    const offset = (parseInt(page) - 1) * parseInt(limit)

    if (!query.trim()) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          posts: [],
          pagination: { page: 1, limit: parseInt(limit), total: 0, totalPages: 0, hasMore: false },
          query,
          channel
        })
      }
    }

    // Build optimized search query
    let searchEndpoint = `posts?select=id,channel,chat_id,message,created_at&order=created_at.desc&or=chat_id.ilike.%${encodeURIComponent(query)}%,message.ilike.%${encodeURIComponent(query)}%`
    
    // Filter by channel if specified
    if (channel && channel !== 'all') {
      searchEndpoint += `&channel=eq.${encodeURIComponent(channel)}`
    }

    // Apply pagination
    searchEndpoint += `&limit=${limit}&offset=${offset}`

    // Get posts with search
    const posts = await supabaseRequest(searchEndpoint)

    // Get total count for pagination
    let countEndpoint = `posts?select=count&or=chat_id.ilike.%${encodeURIComponent(query)}%,message.ilike.%${encodeURIComponent(query)}%`
    if (channel && channel !== 'all') {
      countEndpoint += `&channel=eq.${encodeURIComponent(channel)}`
    }

    const countResponse = await fetch(`${SUPABASE_URL}/rest/v1/${countEndpoint}`, {
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
        },
        query,
        channel
      })
    }

  } catch (error) {
    console.error('Search error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
