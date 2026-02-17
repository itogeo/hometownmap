import React from 'react'

interface FeatureInfo {
  layerId: string
  layerName: string
  properties: any
}

interface PopupContentProps {
  features: FeatureInfo[]
  onClose: () => void
}

// Zone descriptions for FEMA flood zones
const zoneDescriptions: { [key: string]: string } = {
  'A': '100-year flood zone (1% annual chance, no base elevation)',
  'AE': '100-year flood zone (1% annual chance, with base elevation)',
  'AH': 'Shallow flooding 1-3 ft (1% annual chance)',
  'AO': 'Sheet flow flooding 1-3 ft (1% annual chance)',
  'V': 'Coastal high hazard zone',
  'VE': 'Coastal zone with base elevation',
  'X': 'Minimal flood hazard (outside 100-year floodplain, may be in 500-year zone)',
  'D': 'Undetermined flood hazard',
}

// Zone colors for badge - blue theme
const zoneColors: { [key: string]: string } = {
  'A': 'bg-blue-700 text-white',
  'AE': 'bg-blue-500 text-white',
  'AH': 'bg-blue-400 text-white',
  'AO': 'bg-blue-300 text-blue-900',
  'V': 'bg-purple-100 text-purple-800',
  'VE': 'bg-purple-100 text-purple-800',
  'X': 'bg-sky-100 text-sky-700',
  'D': 'bg-gray-100 text-gray-800',
}

// Render FEMA Flood Determination point
function FemaFloodRenderer({ p, showBorder }: { p: any; showBorder: boolean }) {
  const outcome = p.OUTCOME || 'Unknown'
  const isRemoved = outcome.toLowerCase().includes('removed')
  const isDenied = outcome.toLowerCase().includes('denied')
  const dateEnded = p.DATEENDED ? new Date(p.DATEENDED).toLocaleDateString() : null

  return (
    <div className={showBorder ? 'mt-2 pt-2 border-t border-gray-100' : ''}>
      <div className="text-[9px] text-gray-400 uppercase mb-1">FEMA Flood Determination</div>

      <div className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mb-1 ${
        isRemoved ? 'bg-green-100 text-green-800' :
        isDenied ? 'bg-red-100 text-red-800' :
        'bg-blue-100 text-blue-800'
      }`}>
        {outcome}
      </div>

      {p.PROJECTNAME && (
        <div className="text-gray-900 text-[10px] mt-1 leading-tight">{p.PROJECTNAME}</div>
      )}

      <div className="mt-1.5 space-y-0.5 text-[9px]">
        <div className="flex justify-between">
          <span className="text-gray-500">Type:</span>
          <span className="text-gray-700 font-medium">{p.PROJECTCATEGORY || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Lot Type:</span>
          <span className="text-gray-700">{p.LOTTYPE || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Status:</span>
          <span className="text-gray-700">{p.STATUS || 'N/A'}</span>
        </div>
        {dateEnded && (
          <div className="flex justify-between">
            <span className="text-gray-500">Date:</span>
            <span className="text-gray-700">{dateEnded}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Case #:</span>
          <span className="text-gray-700 font-mono">{p.CASENUMBER || 'N/A'}</span>
        </div>
      </div>

      {p.PDFHYPERLINKID && (
        <a
          href={`https://msc.fema.gov/portal/advanceSearch#${p.PDFHYPERLINKID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] text-blue-600 hover:underline mt-1.5 inline-block"
        >
          View FEMA Letter &rarr;
        </a>
      )}
    </div>
  )
}

// Render Flood Zone polygon
function FloodZoneRenderer({ feature, p, showBorder }: { feature: FeatureInfo; p: any; showBorder: boolean }) {
  const zone = p.FLD_ZONE || 'Unknown'
  const subtype = p.ZONE_SUBTY
  const isSFHA = p.SFHA_TF === 'T'
  const bfe = p.STATIC_BFE && p.STATIC_BFE !== -9999 ? p.STATIC_BFE : null

  const layerHeader = feature.layerId === 'floodplain_100yr' ? '100-Year Floodplain' :
                     feature.layerId === 'floodplain_500yr' ? '500-Year Floodplain' :
                     'FEMA Flood Zone'

  return (
    <div className={showBorder ? 'mt-2 pt-2 border-t border-gray-100' : ''}>
      <div className="text-[9px] text-gray-400 uppercase mb-1">{layerHeader}</div>

      <div className="flex items-center gap-2">
        <div className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${zoneColors[zone] || 'bg-blue-100 text-blue-800'}`}>
          Zone {zone}
        </div>
        {isSFHA && (
          <div className="text-[9px] text-red-600 font-medium">Special Flood Hazard Area</div>
        )}
      </div>

      <div className="text-gray-700 text-[10px] mt-1">
        {zoneDescriptions[zone] || 'Flood hazard zone'}
      </div>

      <div className="mt-1.5 space-y-0.5 text-[9px]">
        {subtype && (
          <div className="flex justify-between">
            <span className="text-gray-500">Subtype:</span>
            <span className="text-gray-700">{subtype}</span>
          </div>
        )}
        {bfe && (
          <div className="flex justify-between">
            <span className="text-gray-500">Base Flood Elevation:</span>
            <span className="text-gray-700 font-medium">{bfe} ft</span>
          </div>
        )}
        {p.FLD_AR_ID && (
          <div className="flex justify-between">
            <span className="text-gray-500">Area ID:</span>
            <span className="text-gray-700 font-mono">{p.FLD_AR_ID}</span>
          </div>
        )}
        {p.SOURCE_CIT && (
          <div className="flex justify-between">
            <span className="text-gray-500">FIRM Panel:</span>
            <span className="text-gray-700 font-mono">{p.SOURCE_CIT}</span>
          </div>
        )}
      </div>

      {isSFHA && (
        <div className="mt-2 p-1.5 bg-amber-50 border border-amber-200 rounded text-[9px] text-amber-800">
          Flood insurance may be required for federally-backed mortgages in this zone.
        </div>
      )}
    </div>
  )
}

// Render Capital Project
function ProjectRenderer({ p, showBorder }: { p: any; showBorder: boolean }) {
  const isFloodProject = p.category === 'Flood Control'
  const statusColors: { [key: string]: string } = {
    'In Progress': 'bg-blue-100 text-blue-800',
    'Planning': 'bg-amber-100 text-amber-800',
    'Planned': 'bg-amber-100 text-amber-800',
    'Completed': 'bg-green-100 text-green-800',
    'Design Phase - 75% Complete': 'bg-blue-100 text-blue-800',
  }

  return (
    <div className={showBorder ? 'mt-2 pt-2 border-t border-gray-100' : ''}>
      <div className="text-[9px] text-gray-400 uppercase mb-1">
        {isFloodProject ? 'Flood Mitigation Project' : 'Capital Project'}
      </div>

      <div className="font-semibold text-gray-900 text-[11px]">{p.name}</div>

      <div className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-medium mt-1 ${statusColors[p.status] || 'bg-gray-100 text-gray-800'}`}>
        {p.status}
      </div>

      <div className="text-gray-600 text-[10px] mt-1.5 leading-tight">
        {p.description?.substring(0, 150)}{p.description?.length > 150 ? '...' : ''}
      </div>

      {isFloodProject && p.budget > 0 && (
        <div className="mt-1.5 text-[9px]">
          <span className="text-gray-500">Budget:</span>
          <span className="text-gray-700 font-medium ml-1">${(p.budget / 1000000).toFixed(1)}M</span>
        </div>
      )}

      {isFloodProject && p.benefits && p.benefits.length > 0 && (
        <div className="mt-1.5 p-1.5 bg-blue-50 border border-blue-200 rounded text-[9px] text-blue-800">
          <div className="font-medium mb-0.5">Key Benefits:</div>
          <ul className="list-disc list-inside space-y-0.5">
            {p.benefits.slice(0, 3).map((b: string, i: number) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {p.source && (
        <a
          href={p.source}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] text-blue-600 hover:underline mt-1.5 inline-block"
        >
          Learn More &rarr;
        </a>
      )}
    </div>
  )
}

// Render Building Permit
function BuildingPermitRenderer({ p, showBorder }: { p: any; showBorder: boolean }) {
  const statusColors: { [key: string]: string } = {
    'Active': 'bg-green-100 text-green-800',
    'Closed - Completed': 'bg-blue-100 text-blue-800',
    'Closed': 'bg-gray-100 text-gray-800',
    'Closed - Approved': 'bg-blue-100 text-blue-800',
    'Closed - Withdrawn': 'bg-red-100 text-red-800',
  }

  const isActive = p.status === 'Active'
  const formattedDate = p.issued_date ? new Date(p.issued_date).toLocaleDateString() : null

  return (
    <div className={showBorder ? 'mt-2 pt-2 border-t border-gray-100' : ''}>
      <div className="text-[9px] text-gray-400 uppercase mb-1">Building Permit</div>

      <div className="font-semibold text-gray-900 text-[11px] font-mono">{p.permit_number}</div>

      <div className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-medium mt-1 ${statusColors[p.status] || 'bg-gray-100 text-gray-800'}`}>
        {p.status}
      </div>

      {(p.owner_name || p.project_name) && (
        <div className="text-gray-700 text-[10px] mt-1.5">
          {p.owner_name || p.project_name}
        </div>
      )}

      <div className="mt-1.5 space-y-0.5 text-[9px]">
        {formattedDate && (
          <div className="flex justify-between">
            <span className="text-gray-500">Issued:</span>
            <span className="text-gray-700">{formattedDate}</span>
          </div>
        )}
        {p.address && (
          <div className="flex justify-between">
            <span className="text-gray-500">Location:</span>
            <span className="text-gray-700 text-right max-w-[150px] truncate">{p.address.replace(/THREE FORKS.*$/i, 'TF')}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Type:</span>
          <span className="text-gray-700">{p.permit_type}</span>
        </div>
      </div>

      <div className="mt-2 p-1.5 bg-amber-50 border border-amber-200 rounded text-[8px] text-amber-700">
        Data from Montana EBIZ portal. May not include recent permits.
      </div>
    </div>
  )
}

// Render Emergency Service
function EmergencyServiceRenderer({ p, showBorder }: { p: any; showBorder: boolean }) {
  const typeColors: { [key: string]: string } = {
    'Fire Station': 'bg-red-100 text-red-800',
    'Law Enforcement': 'bg-blue-100 text-blue-800',
    'Medical': 'bg-emerald-100 text-emerald-800',
    'School': 'bg-purple-100 text-purple-800',
    'Government': 'bg-cyan-100 text-cyan-800',
    'Library': 'bg-amber-100 text-amber-800',
    'Post Office': 'bg-gray-100 text-gray-800',
  }

  const colorClass = typeColors[p.type] || 'bg-gray-100 text-gray-800'

  return (
    <div className={showBorder ? 'mt-2 pt-2 border-t border-gray-100' : ''}>
      <div className="text-[9px] text-gray-400 uppercase mb-1">Essential Service</div>

      <div>
        <div className="font-semibold text-gray-900 text-[11px]">{p.name}</div>
        <div className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-medium mt-0.5 ${colorClass}`}>
          {p.type}
        </div>
      </div>

      <div className="mt-2 space-y-1 text-[9px]">
        {p.address && (
          <div className="flex justify-between">
            <span className="text-gray-500">Address:</span>
            <span className="text-gray-700 text-right">{p.address}</span>
          </div>
        )}
        {p.phone && (
          <div className="flex justify-between">
            <span className="text-gray-500">Phone:</span>
            <a href={`tel:${p.phone}`} className="text-blue-600 hover:underline">{p.phone}</a>
          </div>
        )}
        {p.hours && (
          <div className="flex justify-between">
            <span className="text-gray-500">Hours:</span>
            <span className="text-gray-700">{p.hours}</span>
          </div>
        )}
      </div>

      {p.services && Array.isArray(p.services) && p.services.length > 0 && (
        <div className="mt-2 p-1.5 bg-gray-50 border border-gray-200 rounded text-[9px]">
          <div className="font-medium text-gray-700 mb-0.5">Services:</div>
          <div className="text-gray-600">{p.services.join(' • ')}</div>
        </div>
      )}

      {p.website && (
        <a
          href={p.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] text-blue-600 hover:underline mt-1.5 inline-block"
        >
          Visit Website
        </a>
      )}
    </div>
  )
}

// Render Parks & Recreation
function ParksRecreationRenderer({ p, showBorder }: { p: any; showBorder: boolean }) {
  const typeColors: { [key: string]: string } = {
    'City Park': 'bg-green-100 text-green-800',
    'State Park': 'bg-emerald-100 text-emerald-800',
    'Recreation': 'bg-blue-100 text-blue-800',
    'Fishing Access': 'bg-cyan-100 text-cyan-800',
    'Attraction': 'bg-amber-100 text-amber-800',
  }

  const colorClass = typeColors[p.type] || 'bg-gray-100 text-gray-800'

  return (
    <div className={showBorder ? 'mt-2 pt-2 border-t border-gray-100' : ''}>
      <div className="text-[9px] text-gray-400 uppercase mb-1">Parks & Recreation</div>

      <div>
        <div className="font-semibold text-gray-900 text-[11px]">{p.name}</div>
        <div className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-medium mt-0.5 ${colorClass}`}>
          {p.type}
        </div>
      </div>

      {p.description && (
        <div className="text-gray-600 text-[10px] mt-1.5 leading-tight">
          {p.description}
        </div>
      )}

      <div className="mt-2 space-y-1 text-[9px]">
        {p.address && (
          <div className="flex justify-between">
            <span className="text-gray-500">Address:</span>
            <span className="text-gray-700 text-right">{p.address}</span>
          </div>
        )}
        {p.hours && (
          <div className="flex justify-between">
            <span className="text-gray-500">Hours:</span>
            <span className="text-gray-700">{p.hours}</span>
          </div>
        )}
        {p.fee && (
          <div className="flex justify-between">
            <span className="text-gray-500">Fee:</span>
            <span className="text-gray-700">{p.fee}</span>
          </div>
        )}
        {p.phone && (
          <div className="flex justify-between">
            <span className="text-gray-500">Phone:</span>
            <a href={`tel:${p.phone}`} className="text-blue-600 hover:underline">{p.phone}</a>
          </div>
        )}
        {p.season && (
          <div className="flex justify-between">
            <span className="text-gray-500">Season:</span>
            <span className="text-gray-700">{p.season}</span>
          </div>
        )}
        {p.events && (
          <div className="flex justify-between">
            <span className="text-gray-500">Events:</span>
            <span className="text-gray-700">{p.events}</span>
          </div>
        )}
      </div>

      {p.amenities && Array.isArray(p.amenities) && p.amenities.length > 0 && (
        <div className="mt-2 p-1.5 bg-green-50 border border-green-200 rounded text-[9px]">
          <div className="font-medium text-green-800 mb-0.5">Amenities:</div>
          <div className="text-green-700">{p.amenities.join(' • ')}</div>
        </div>
      )}

      {p.website && (
        <a
          href={p.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] text-blue-600 hover:underline mt-1.5 inline-block"
        >
          More Info
        </a>
      )}
    </div>
  )
}

// Default feature renderer
function DefaultFeatureRenderer({ feature, showBorder }: { feature: FeatureInfo; showBorder: boolean }) {
  const p = feature.properties
  const title = p.name || p.district_n || p.fld_zone || p.zone_subty || feature.layerName

  return (
    <div className={showBorder ? 'mt-2 pt-2 border-t border-gray-100' : ''}>
      <div className="text-[9px] text-gray-400 uppercase">{feature.layerName}</div>
      <div className="text-gray-900">{title}</div>
    </div>
  )
}

// Render a single feature based on its type
function FeatureRenderer({ feature, index, hasParcel }: { feature: FeatureInfo; index: number; hasParcel: boolean }) {
  const p = feature.properties
  const showBorder = hasParcel || index > 0

  // FEMA Flood Determination points
  if (feature.layerId === 'fema_flood') {
    return <FemaFloodRenderer key={feature.layerId} p={p} showBorder={showBorder} />
  }

  // Flood zone polygons
  if (feature.layerId === 'flood_zones' || feature.layerId === 'floodplain_100yr' || feature.layerId === 'floodplain_500yr') {
    return <FloodZoneRenderer key={feature.layerId} feature={feature} p={p} showBorder={showBorder} />
  }

  // Capital Projects
  if (feature.layerId === 'projects' && p.id) {
    return <ProjectRenderer key={feature.layerId} p={p} showBorder={showBorder} />
  }

  // Building Permits
  if (feature.layerId === 'building_permits' && p.permit_number) {
    return <BuildingPermitRenderer key={feature.layerId} p={p} showBorder={showBorder} />
  }

  // Emergency Services
  if (feature.layerId === 'emergency_services') {
    return <EmergencyServiceRenderer key={feature.layerId} p={p} showBorder={showBorder} />
  }

  // Parks & Recreation
  if (feature.layerId === 'parks_recreation') {
    return <ParksRecreationRenderer key={feature.layerId} p={p} showBorder={showBorder} />
  }

  // Default renderer
  return <DefaultFeatureRenderer key={feature.layerId} feature={feature} showBorder={showBorder} />
}

export default function PopupContent({ features, onClose }: PopupContentProps) {
  // Filter out city and buildings from popup
  const validFeatures = features.filter(f => f.layerId !== 'cities' && f.layerId !== 'buildings')
  if (validFeatures.length === 0) return null

  const parcel = validFeatures.find(f => f.layerId === 'parcels')
  const publicLand = validFeatures.find(f => f.layerId === 'public_lands')
  const subdivision = validFeatures.find(f => f.layerId === 'subdivisions' || f.layerId === 'minor_subdivisions')
  const otherFeatures = validFeatures.filter(f =>
    f.layerId !== 'parcels' && f.layerId !== 'public_lands' && f.layerId !== 'subdivisions' && f.layerId !== 'minor_subdivisions'
  )

  // Get subdivision name
  const subdivName = parcel?.properties._subdivision ||
                    subdivision?.properties.SUB_NAME ||
                    subdivision?.properties.sub_name

  // Get address
  const address = parcel?.properties.addresslin || parcel?.properties.ADDRESSLIN

  // Get public land category
  const publicCategory = publicLand?.properties._public_category || publicLand?.properties._ownership_type
  const publicCategoryLabels: { [key: string]: string } = {
    'federal': 'Federal Land',
    'state': 'State Land',
    'county': 'County Property',
    'municipal': 'Town Property',
    'railroad': 'Railroad',
  }

  return (
    <>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute -top-2 -right-2 z-10 w-8 h-8 flex items-center justify-center
                   bg-white hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600
                   shadow border border-gray-200"
        aria-label="Close popup"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="text-[11px] max-h-[50vh] overflow-y-auto pr-4">
        {/* Public land */}
        {publicLand && publicCategory && (
          <div className="bg-green-50 rounded px-2 py-2 mb-2 -mx-1 -mt-0.5">
            <div className="font-semibold text-green-800 text-[12px]">
              {publicCategoryLabels[publicCategory] || 'Public Land'}
            </div>
            <div className="text-green-700 text-[10px] mt-0.5">
              {publicLand.properties.ownername || publicLand.properties.OWNERNAME || 'Government Owned'}
            </div>
            {(publicLand.properties.gisacres || publicLand.properties.GISACRES) && (
              <div className="text-green-600 text-[10px] mt-1">
                {Number(publicLand.properties.gisacres || publicLand.properties.GISACRES).toFixed(1)} acres
              </div>
            )}
          </div>
        )}

        {/* Subdivision header */}
        {subdivName && !publicLand && (
          <div className="text-amber-700 text-[10px] font-medium mb-1">
            {subdivName}
          </div>
        )}

        {/* Parcel info */}
        {parcel && !publicLand && (
          <div>
            <div className="font-semibold text-gray-900 text-[12px]">
              {parcel.properties.ownername || parcel.properties.OWNERNAME || 'Unknown Owner'}
            </div>

            {address && (
              <div className="text-gray-500 text-[10px] mt-0.5">{address}</div>
            )}

            <div className="flex gap-4 mt-1.5 text-[10px]">
              {(parcel.properties.gisacres || parcel.properties.GISACRES) && (
                <span className="text-gray-600">
                  {Number(parcel.properties.gisacres || parcel.properties.GISACRES).toFixed(2)} ac
                </span>
              )}
              {(parcel.properties.totalvalue || parcel.properties.TOTALVALUE) && (
                <span className="text-gray-600">
                  ${(Number(parcel.properties.totalvalue || parcel.properties.TOTALVALUE) / 1000).toFixed(0)}K
                </span>
              )}
            </div>

            {parcel.properties._merged_count && parcel.properties._merged_count > 1 && (
              <div className="text-blue-600 text-[9px] mt-1.5">
                {parcel.properties._merged_count} parcels combined
              </div>
            )}
          </div>
        )}

        {/* Other layers */}
        {otherFeatures.map((feature, index) => (
          <FeatureRenderer
            key={feature.layerId}
            feature={feature}
            index={index}
            hasParcel={!!parcel}
          />
        ))}
      </div>
    </>
  )
}
