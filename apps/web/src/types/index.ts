export type MapMode = 'property' | 'planning' | 'hazards' | 'explore' | 'business'

export interface CityConfig {
  id: string
  name: string
  county: string
  state: string
  map: {
    center: [number, number]
    zoom: number
    bounds?: [[number, number], [number, number]]
  }
  modes: {
    [key in MapMode]?: ModeConfig
  }
  layers: {
    [key: string]: LayerConfig
  }
  branding: {
    logo?: string
    seal?: string
    primary_color: string
    secondary_color: string
    accent_color?: string
    title: string
    subtitle?: string
  }
  contact?: {
    city_hall?: string
    phone?: string
    email?: string
    website?: string
  }
  demographics?: {
    population?: number
    median_income?: number
    median_age?: number
    growth_rate?: string
  }
}

export interface LayerGroup {
  id: string
  name: string
  layers: string[]
  defaultExpanded?: boolean
  locked?: boolean
  lockMessage?: string
}

export interface ModeConfig {
  enabled: boolean
  mapStyle?: 'satellite' | 'streets' | 'light' | 'dark' | 'outdoors'
  layers: string[]
  availableLayers?: string[]
  layerGroups?: LayerGroup[]
  features: string[]
}

export interface LayerConfig {
  source: string
  display_name: string
  description?: string
  data_freshness?: string
  locked?: boolean
  lockMessage?: string
  minzoom?: number
  style?: LayerStyle
  style_by_field?: string
  styles?: {
    [key: string]: LayerStyle & { name: string }
  }
  popup_fields?: string[]
}

export interface LayerStyle {
  fill?: string
  'fill-opacity'?: number
  stroke?: string
  'stroke-width'?: number
  'stroke-opacity'?: number
}

export interface Feature {
  type: 'Feature'
  properties: { [key: string]: any }
  geometry: GeoJSON.Geometry
}

export interface FeatureCollection {
  type: 'FeatureCollection'
  features: Feature[]
}
