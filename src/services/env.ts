export const GOOGLE_MAPS_API_KEY: string | undefined = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export const hasLiveDataSource = Boolean(GOOGLE_MAPS_API_KEY)
