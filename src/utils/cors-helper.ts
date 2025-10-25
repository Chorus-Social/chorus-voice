/**
 * CORS Helper for Development
 * 
 * This utility helps handle CORS issues during development by providing
 * alternative methods for making requests to dynamic Stage URLs.
 */

/**
 * Check if we're in development mode
 */
export const isDevelopment = import.meta.env.DEV

/**
 * Get CORS proxy URL for development
 * This can be used as a fallback when direct requests fail due to CORS
 */
export const getCorsProxyUrl = (targetUrl: string): string => {
  // For development, you can use a CORS proxy service
  // Note: This is only for development and should not be used in production
  if (isDevelopment) {
    // Using a public CORS proxy (for development only)
    // In production, the backend should handle CORS properly
    return `https://cors-anywhere.herokuapp.com/${targetUrl}`
  }
  return targetUrl
}

/**
 * Check if a URL is a localhost URL (common in development)
 */
export const isLocalhostUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1'
  } catch {
    return false
  }
}

/**
 * Get development-friendly URL
 * For localhost URLs in development, suggests using a different port or CORS proxy
 */
export const getDevelopmentUrl = (url: string): string => {
  if (isDevelopment && isLocalhostUrl(url)) {
    console.warn('🌐 Development CORS Warning:')
    console.warn('   - Make sure your Stage server has CORS enabled')
    console.warn('   - Add localhost:3000 to your CORS allowed origins')
    console.warn('   - Or use a CORS proxy for development')
  }
  return url
}

/**
 * Create axios config optimized for CORS requests
 */
export const createCorsConfig = () => ({
  timeout: 30000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})
