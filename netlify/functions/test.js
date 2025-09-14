exports.handler = async (event, context) => {
  console.log('Test function called:', {
    path: event.path,
    httpMethod: event.httpMethod,
    body: event.body,
    headers: event.headers
  })

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Test function is working!',
      path: event.path,
      method: event.httpMethod,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    })
  }
}