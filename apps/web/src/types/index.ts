export type MapMode = 'resident' | 'services' | 'planning' | 'hazards' | 'development' | 'explore' | 'business'

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
    primary_color: string
    secondary_color: string
    title: string
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
}

export interface ModeConfig {
  enabled: boolean
  mapStyle?: 'satellite' | 'streets' | 'light' | 'dark' | 'outdoors'
  layers: string[]
  layerGroups?: LayerGroup[]
  features: string[]
}

export interface LayerConfig {
  source: string
  display_name: string
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
