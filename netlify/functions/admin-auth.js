const crypto = require('crypto')

exports.handler = async (event, context) => {
  console.log('Admin auth function called:', {
    httpMethod: event.httpMethod,
    path: event.path,
    body: event.body,
    headers: event.headers
  })

  const { httpMethod, body } = event

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Cookie',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
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

  if (httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  // Simple test response first
  if (body === 'test') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Admin auth function is working!' })
    }
  }

  try {
    // Parse JSON body safely
    let requestBody
    try {
      requestBody = JSON.parse(body)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      }
    }

    const { password } = requestBody

    if (!password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Password is required' })
      }
    }

    // Get admin password from environment variable
    const adminPassword = process.env.ADMIN_PASSWORD || '!QAZ2wsx' // fallback for development
    
    // Debug logging
    console.log('Admin password from env:', adminPassword ? 'Set' : 'Not set')
    console.log('Provided password length:', password.length)

    // Compare passwords securely
    const isValid = password === adminPassword

    if (isValid) {
      // Generate a simple session token (in production, use JWT)
      const sessionToken = crypto.randomBytes(32).toString('hex')
      
      // Check if we're in production (HTTPS)
      const isProduction = process.env.NODE_ENV === 'production'
      const cookieOptions = isProduction 
        ? `admin_session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600; Path=/`
        : `admin_session=${sessionToken}; HttpOnly; SameSite=Strict; Max-Age=3600; Path=/`
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Set-Cookie': cookieOptions
        },
        body: JSON.stringify({ 
          success: true, 
          message: 'Login successful',
          sessionToken 
        })
      }
    } else {
      console.log('Password mismatch - provided:', password, 'expected:', adminPassword)
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Invalid password' 
        })
      }
    }

  } catch (error) {
    console.error('Admin auth error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    }
  }
}
