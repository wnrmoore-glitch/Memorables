export const GOOGLE_MAPS_API_KEY: string | undefined = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

/**
 * In production the Google key lives server-side and calls go through the
 * /api proxy, so live data is assumed available; if the proxy isn't
 * configured those calls fail and the app degrades to demo data as usual.
 */
export const useApiProxy = !GOOGLE_MAPS_API_KEY && import.meta.env.PROD

export const hasLiveDataSource = Boolean(GOOGLE_MAPS_API_KEY) || useApiProxy
