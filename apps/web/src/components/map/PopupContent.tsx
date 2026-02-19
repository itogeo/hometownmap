import React, { useState } from 'react'

interface FeatureInfo {
  layerId: string
  layerName: string
  properties: any
}

interface PopupContentProps {
  features: FeatureInfo[]
  onClose: () => void
}

type TabId = 'property' | 'zoning' | 'services' | 'hazards' | 'history'

// Zone descriptions for FEMA flood zones
const zoneDescriptions: { [key: string]: string } = {
  'A': '100-year flood zone (1% annual chance)',
  'AE': '100-year flood zone with base elevation',
  'AH': 'Shallow flooding 1-3 ft',
  'AO': 'Sheet flow flooding 1-3 ft',
  'X': 'Minimal flood hazard',
  'D': 'Undetermined flood hazard',
}

// Zone colors for badge
const zoneColors: { [key: string]: string } = {
  'A': 'bg-blue-600 text-white',
  'AE': 'bg-blue-500 text-white',
  'AH': 'bg-blue-400 text-white',
  'AO': 'bg-blue-300 text-blue-900',
  'X': 'bg-sky-100 text-sky-700',
  'D': 'bg-gray-100 text-gray-800',
}

// Zoning code colors
const zoningColors: { [key: string]: { bg: string; text: string; name: string } } = {
  'R-1': { bg: 'bg-green-100', text: 'text-green-800', name: 'Single Family Residential' },
  'R-2': { bg: 'bg-green-200', text: 'text-green-800', name: 'Two-Family Residential' },
  'R-3': { bg: 'bg-green-300', text: 'text-green-900', name: 'Multi-Family Residential' },
  'C-1': { bg: 'bg-red-100', text: 'text-red-800', name: 'Neighborhood Commercial' },
  'C-2': { bg: 'bg-red-200', text: 'text-red-800', name: 'General Commercial' },
  'I-1': { bg: 'bg-purple-100', text: 'text-purple-800', name: 'Light Industrial' },
  'I-2': { bg: 'bg-purple-200', text: 'text-purple-800', name: 'Heavy Industrial' },
  'AG': { bg: 'bg-yellow-100', text: 'text-yellow-800', name: 'Agricultural' },
  'MU': { bg: 'bg-orange-100', text: 'text-orange-800', name: 'Mixed Use' },
  'P': { bg: 'bg-cyan-100', text: 'text-cyan-800', name: 'Public/Institutional' },
}

function PropertyTab({ parcel, publicLand, subdivision }: { parcel: any; publicLand: any; subdivision: any }) {
  const props = parcel?.properties || publicLand?.properties || {}
  const isPublic = !!publicLand

  const ownerName = props.ownername || props.OWNERNAME || 'Unknown Owner'
  const address = props.addresslin || props.ADDRESSLIN
  const cityStateZip = props.citystatez || props.CITYSTATEZ
  const acreage = props.gisacres || props.GISACRES
  const totalValue = props.totalvalue || props.TOTALVALUE
  const landValue = props.landvalue || props.LANDVALUE
  const improvValue = props.improvvalue || props.IMPROVVALUE
  const parcelId = props.parcelid || props.PARCELID
  const propType = props.proptype || props.PROPTYPE
  const legalDesc = props.legal1 || props.LEGAL1
  const subdivName = parcel?.properties._subdivision || subdivision?.properties.SUB_NAME

  const publicCategory = publicLand?.properties._public_category
  const publicCategoryLabels: { [key: string]: string } = {
    'federal': 'Federal Land',
    'state': 'State Land',
    'county': 'County Property',
    'municipal': 'Town Property',
    'railroad': 'Railroad',
  }

  return (
    <div className="space-y-2">
      {/* Owner section */}
      <div className={`rounded-lg px-2 py-1.5 ${isPublic ? 'bg-green-50' : 'bg-gray-50'}`}>
        {isPublic && (
          <div className="text-[9px] text-green-600 font-medium uppercase mb-0.5">
            {publicCategoryLabels[publicCategory] || 'Public Land'}
          </div>
        )}
        <div className={`font-semibold text-[13px] ${isPublic ? 'text-green-800' : 'text-gray-900'}`}>
          {ownerName}
        </div>
        {cityStateZip && (
          <div className="text-gray-600 text-[10px] mt-0.5">{cityStateZip}</div>
        )}
      </div>

      {/* Address */}
      {address && (
        <div>
          <div className="text-[9px] text-gray-400 uppercase mb-0.5">Property Address</div>
          <div className="text-gray-800 text-[11px]">{address}</div>
        </div>
      )}

      {/* Subdivision */}
      {subdivName && (
        <div>
          <div className="text-[9px] text-gray-400 uppercase mb-0.5">Subdivision</div>
          <div className="text-amber-700 text-[11px] font-medium">{subdivName}</div>
        </div>
      )}

      {/* Flood Zone Overlay */}
      {props._floodZone && (
        <div className={`rounded-lg px-3 py-2 border ${
          props._isFloodway
            ? 'bg-red-50 border-red-300'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            <svg className={`w-4 h-4 ${props._isFloodway ? 'text-red-500' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className={`text-[11px] font-semibold ${
                props._isFloodway ? 'text-red-800' : 'text-blue-800'
              }`}>
                {props._isFloodway ? 'FLOODWAY' : '100-Year Floodplain'}
                <span className="font-normal text-[10px] ml-1">(Zone {props._floodZone})</span>
              </div>
              <div className={`text-[9px] ${
                props._isFloodway ? 'text-red-600' : 'text-blue-600'
              }`}>
                {props._isFloodway
                  ? 'No new construction permitted in floodway'
                  : 'Flood insurance required for federal mortgages'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2">
        {acreage && (
          <div className="bg-gray-50 rounded px-2 py-1.5">
            <div className="text-[9px] text-gray-400 uppercase">Acreage</div>
            <div className="text-gray-900 font-semibold">{Number(acreage).toFixed(2)} ac</div>
          </div>
        )}
        {totalValue && (
          <div className="bg-gray-50 rounded px-2 py-1.5">
            <div className="text-[9px] text-gray-400 uppercase">Taxable Value</div>
            <div className="text-gray-900 font-semibold">${Number(totalValue).toLocaleString()}</div>
          </div>
        )}
        {landValue && (
          <div className="bg-gray-50 rounded px-2 py-1.5">
            <div className="text-[9px] text-gray-400 uppercase">Land Value</div>
            <div className="text-gray-700">${Number(landValue).toLocaleString()}</div>
          </div>
        )}
        {improvValue && (
          <div className="bg-gray-50 rounded px-2 py-1.5">
            <div className="text-[9px] text-gray-400 uppercase">Improvements</div>
            <div className="text-gray-700">${Number(improvValue).toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* Additional info */}
      <div className="space-y-1 text-[10px]">
        {parcelId && (
          <div className="flex justify-between">
            <span className="text-gray-500">Parcel ID</span>
            <span className="text-gray-700 font-mono">{parcelId}</span>
          </div>
        )}
        {propType && (
          <div className="flex justify-between">
            <span className="text-gray-500">Property Type</span>
            <span className="text-gray-700">{propType}</span>
          </div>
        )}
      </div>

      {/* Legal description */}
      {legalDesc && (
        <div>
          <div className="text-[9px] text-gray-400 uppercase mb-0.5">Legal Description</div>
          <div className="text-gray-600 text-[9px] leading-tight">{legalDesc}</div>
        </div>
      )}

      {/* Merged parcels indicator */}
      {parcel?.properties._merged_count > 1 && (
        <div className="text-blue-600 text-[9px] bg-blue-50 rounded px-2 py-1">
          This display combines {parcel.properties._merged_count} adjacent parcels owned by the same entity.
        </div>
      )}
    </div>
  )
}

function ZoningTab({ zoning, parcel }: { zoning: any; parcel: any }) {
  const props = zoning?.properties || {}
  const zoneCode = props.zone_code || props.ZONE_CODE || props.zoned || props.ZONED
  const zoneName = props.zone_name || props.ZONE_NAME
  const allowedUses = props.allowed_uses || props.ALLOWED_USES
  const minLotSize = props.min_lot_size || props.MIN_LOT_SIZE
  const maxHeight = props.max_height || props.MAX_HEIGHT
  const setbacks = props.setbacks || props.SETBACKS
  const lotCoverage = props.lot_coverage || props.LOT_COVERAGE

  const zoneInfo = zoningColors[zoneCode] || { bg: 'bg-gray-100', text: 'text-gray-800', name: zoneCode }

  if (!zoneCode) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 mx-auto mb-2 bg-blue-50 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <div className="text-gray-600 text-[11px] font-medium">Outside City Zoning</div>
        <div className="text-gray-400 text-[10px] mt-1">
          This area may be in county jurisdiction.
        </div>
        <a
          href="tel:4062853431"
          className="inline-block mt-3 px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded-full hover:bg-blue-100 transition-colors"
        >
          Call City Hall for zoning info
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Zoning designation badge */}
      <div className={`${zoneInfo.bg} rounded-lg px-3 py-2`}>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${zoneInfo.text}`}>{zoneCode}</span>
          <span className={`text-[11px] ${zoneInfo.text}`}>{zoneInfo.name || zoneName}</span>
        </div>
      </div>

      {/* Allowed uses */}
      {allowedUses && (
        <div>
          <div className="text-[9px] text-gray-400 uppercase mb-1">Allowed Uses</div>
          <div className="text-gray-700 text-[10px] leading-relaxed">{allowedUses}</div>
        </div>
      )}

      {/* Development standards */}
      <div className="grid grid-cols-2 gap-2">
        {minLotSize && (
          <div className="bg-gray-50 rounded px-2 py-1.5">
            <div className="text-[9px] text-gray-400 uppercase">Min Lot Size</div>
            <div className="text-gray-900 font-medium text-[11px]">{minLotSize}</div>
          </div>
        )}
        {maxHeight && (
          <div className="bg-gray-50 rounded px-2 py-1.5">
            <div className="text-[9px] text-gray-400 uppercase">Max Height</div>
            <div className="text-gray-900 font-medium text-[11px]">{maxHeight}</div>
          </div>
        )}
        {lotCoverage && (
          <div className="bg-gray-50 rounded px-2 py-1.5">
            <div className="text-[9px] text-gray-400 uppercase">Lot Coverage</div>
            <div className="text-gray-900 font-medium text-[11px]">{lotCoverage}</div>
          </div>
        )}
        {setbacks && (
          <div className="bg-gray-50 rounded px-2 py-1.5">
            <div className="text-[9px] text-gray-400 uppercase">Setbacks</div>
            <div className="text-gray-900 font-medium text-[11px]">{setbacks}</div>
          </div>
        )}
      </div>

      <div className="text-[9px] text-gray-400 mt-2">
        Contact City Hall at (406) 285-3431 for detailed zoning regulations.
      </div>
    </div>
  )
}

function ServicesTab({ features }: { features: FeatureInfo[] }) {
  const fireDistrict = features.find(f => f.layerId === 'firedistricts')
  const schoolDistrict = features.find(f => f.layerId === 'schooldistricts')
  const waterSewer = features.find(f => f.layerId === 'water_sewer_districts')
  const waterSupply = features.find(f => f.layerId === 'water_supply')
  const wastewater = features.find(f => f.layerId === 'wastewater')

  const hasServices = fireDistrict || schoolDistrict || waterSewer || waterSupply || wastewater

  if (!hasServices) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 mx-auto mb-2 bg-cyan-50 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="text-gray-600 text-[11px] font-medium">City Services Available</div>
        <div className="text-gray-400 text-[10px] mt-1">
          Enable service layers to see district boundaries.
        </div>
        <a
          href="https://threeforksmontana.us"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 px-3 py-1.5 bg-cyan-50 text-cyan-600 text-[10px] font-medium rounded-full hover:bg-cyan-100 transition-colors"
        >
          View city services
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {fireDistrict && (
        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="text-[9px] text-red-600 uppercase font-medium">Fire District</div>
            <div className="text-gray-900 text-[11px]">{fireDistrict.properties.name || 'Three Forks Rural Fire'}</div>
          </div>
        </div>
      )}

      {schoolDistrict && (
        <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <div className="text-[9px] text-purple-600 uppercase font-medium">School District</div>
            <div className="text-gray-900 text-[11px]">
              {schoolDistrict.properties.elementary || 'Three Forks Schools'}
            </div>
          </div>
        </div>
      )}

      {(waterSewer || waterSupply) && (
        <div className="flex items-center gap-2 p-2 bg-cyan-50 rounded-lg">
          <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <div className="text-[9px] text-cyan-600 uppercase font-medium">Water/Sewer</div>
            <div className="text-gray-900 text-[11px]">
              {waterSewer?.properties.name || waterSupply?.properties.SYSTEMTYPE || 'City Services'}
            </div>
          </div>
        </div>
      )}

      {wastewater && !waterSewer && (
        <div className="flex items-center gap-2 p-2 bg-lime-50 rounded-lg">
          <div className="w-8 h-8 bg-lime-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <div className="text-[9px] text-lime-600 uppercase font-medium">Wastewater</div>
            <div className="text-gray-900 text-[11px]">{wastewater.properties.SYSTEMTYPE || 'Wastewater System'}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function HazardsTab({ features }: { features: FeatureInfo[] }) {
  const flood100 = features.find(f => f.layerId === 'floodplain_100yr')
  const flood500 = features.find(f => f.layerId === 'floodplain_500yr')
  const femaFlood = features.find(f => f.layerId === 'fema_flood_zones' || f.layerId === 'fema_flood')
  const floodway = features.find(f => f.layerId === 'floodway')
  const wui = features.find(f => f.layerId === 'wui')
  const streams = features.find(f => f.layerId === 'streams')

  const hasHazards = flood100 || flood500 || femaFlood || floodway || wui || streams

  if (!hasHazards) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-green-700 text-[11px] font-medium">No Known Hazards</div>
        <div className="text-gray-400 text-[10px] mt-1">
          This parcel is not in a mapped hazard zone.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* 100-year floodplain */}
      {flood100 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <div className={`px-2 py-0.5 rounded font-bold text-[11px] ${
              zoneColors[flood100.properties.FLD_ZONE] || 'bg-blue-500 text-white'
            }`}>
              Zone {flood100.properties.FLD_ZONE}
            </div>
            <span className="text-blue-800 text-[10px] font-medium">100-Year Floodplain</span>
          </div>
          <div className="text-blue-700 text-[10px] mt-1">
            {zoneDescriptions[flood100.properties.FLD_ZONE] || '1% annual chance of flooding'}
          </div>
          {flood100.properties.SFHA_TF === 'T' && (
            <div className="mt-2 p-1.5 bg-amber-100 border border-amber-300 rounded text-[9px] text-amber-800">
              Special Flood Hazard Area - Flood insurance required for federally-backed mortgages.
            </div>
          )}
        </div>
      )}

      {/* 500-year floodplain */}
      {flood500 && !flood100 && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded bg-sky-200 text-sky-800 font-bold text-[11px]">
              Zone X
            </div>
            <span className="text-sky-700 text-[10px] font-medium">500-Year Floodplain</span>
          </div>
          <div className="text-sky-600 text-[10px] mt-1">
            0.2% annual chance of flooding. Flood insurance optional but recommended.
          </div>
        </div>
      )}

      {/* FEMA Flood Zone - Floodway or Floodplain */}
      {femaFlood && (
        <div className={`rounded-lg p-2 border ${
          femaFlood.properties.ZONE_SUBTY === 'FLOODWAY'
            ? 'bg-red-50 border-red-300'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            {femaFlood.properties.ZONE_SUBTY === 'FLOODWAY' ? (
              <>
                <div className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[11px]">
                  FLOODWAY
                </div>
                <span className="text-red-800 text-[10px] font-medium">Zone {femaFlood.properties.FLD_ZONE}</span>
              </>
            ) : (
              <>
                <div className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                  zoneColors[femaFlood.properties.FLD_ZONE] || 'bg-blue-500 text-white'
                }`}>
                  Zone {femaFlood.properties.FLD_ZONE}
                </div>
                <span className="text-blue-800 text-[10px] font-medium">100-Year Floodplain</span>
              </>
            )}
          </div>
          <div className={`text-[10px] mt-1 ${
            femaFlood.properties.ZONE_SUBTY === 'FLOODWAY' ? 'text-red-700' : 'text-blue-700'
          }`}>
            {femaFlood.properties.ZONE_SUBTY === 'FLOODWAY'
              ? 'River channel that must remain free of obstruction. No new construction permitted. Strictest flood regulations apply.'
              : '1% annual chance of flooding. Special development requirements apply.'}
          </div>
          {femaFlood.properties.SFHA_TF === 'T' && (
            <div className="mt-2 p-1.5 bg-amber-100 border border-amber-300 rounded text-[9px] text-amber-800">
              Special Flood Hazard Area - Flood insurance required for federally-backed mortgages.
            </div>
          )}
          <div className="text-gray-400 text-[8px] mt-1.5">
            FEMA NFHL - Effective 9/26/2024
          </div>
        </div>
      )}

      {/* Separate Floodway layer */}
      {floodway && !femaFlood && (
        <div className="rounded-lg p-2 border bg-red-50 border-red-300">
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[11px]">
              FLOODWAY
            </div>
            <span className="text-red-800 text-[10px] font-medium">Zone {floodway.properties.FLD_ZONE}</span>
          </div>
          <div className="text-red-700 text-[10px] mt-1">
            River channel that must remain free of obstruction. No new construction permitted.
          </div>
          <div className="mt-2 p-1.5 bg-amber-100 border border-amber-300 rounded text-[9px] text-amber-800">
            Special Flood Hazard Area - Flood insurance required for federally-backed mortgages.
          </div>
          <div className="text-gray-400 text-[8px] mt-1.5">FEMA NFHL - Effective 9/26/2024</div>
        </div>
      )}

      {/* Wildfire risk */}
      {wui && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
            <span className="text-orange-800 text-[10px] font-medium">Wildland-Urban Interface</span>
          </div>
          <div className="text-orange-700 text-[10px] mt-1">
            Class: {wui.properties.WUI_Class || 'Intermix'}
          </div>
        </div>
      )}

      {/* Nearby stream/river */}
      {streams && (
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span className="text-cyan-800 text-[10px] font-medium">
              {streams.properties.GCD_NAME || streams.properties.COM_NAME || 'Stream/River'}
            </span>
          </div>
          {streams.properties.TYPE && (
            <div className="text-cyan-600 text-[9px] mt-0.5">
              {streams.properties.TYPE}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function HistoryTab({ features }: { features: FeatureInfo[] }) {
  const permits = features.filter(f => f.layerId === 'building_permits')

  if (permits.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 mx-auto mb-2 bg-purple-50 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="text-gray-600 text-[11px] font-medium">No Recent Permits</div>
        <div className="text-gray-400 text-[10px] mt-1">
          State permit data covers 2016-2023.
        </div>
        <a
          href="tel:4062853431"
          className="inline-block mt-3 px-3 py-1.5 bg-purple-50 text-purple-600 text-[10px] font-medium rounded-full hover:bg-purple-100 transition-colors"
        >
          Inquire about permits
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-[10px] text-gray-500 mb-2">
        {permits.length} permit{permits.length !== 1 ? 's' : ''} on record
      </div>

      {permits.map((permit, i) => {
        const p = permit.properties
        const isActive = p.status === 'Active'
        const date = p.issued_date ? new Date(p.issued_date).toLocaleDateString() : null

        return (
          <div key={i} className="bg-gray-50 rounded-lg p-2 border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-gray-700">{p.permit_number}</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
              }`}>
                {p.status}
              </span>
            </div>
            <div className="text-[10px] text-gray-600 mt-1">{p.permit_type}</div>
            {date && <div className="text-[9px] text-gray-400 mt-0.5">Issued: {date}</div>}
          </div>
        )
      })}

      <div className="text-[9px] text-gray-400 mt-2">
        Data from Montana EBIZ portal (2016-2023).
      </div>
    </div>
  )
}

export default function PopupContent({ features, onClose }: PopupContentProps) {
  // Filter out non-relevant layers
  const validFeatures = features.filter(f => f.layerId !== 'cities' && f.layerId !== 'buildings')
  if (validFeatures.length === 0) return null

  const parcel = validFeatures.find(f => f.layerId === 'parcels')
  const publicLand = validFeatures.find(f => f.layerId === 'public_lands')
  const subdivision = validFeatures.find(f => f.layerId === 'subdivisions' || f.layerId === 'minor_subdivisions')
  const zoning = validFeatures.find(f => f.layerId === 'zoning' || f.layerId === 'zoningdistricts')

  // Determine which tabs to show
  const hasProperty = !!(parcel || publicLand)
  const hasZoning = !!zoning
  const hasServices = validFeatures.some(f =>
    ['firedistricts', 'schooldistricts', 'water_sewer_districts', 'water_supply', 'wastewater'].includes(f.layerId)
  )
  const hasHazards = validFeatures.some(f =>
    ['floodplain_100yr', 'floodplain_500yr', 'fema_flood', 'fema_flood_zones', 'floodway', 'wui', 'streams'].includes(f.layerId)
  )
  const hasHistory = validFeatures.some(f => f.layerId === 'building_permits')

  // Default to History tab when building permits are present, otherwise Property
  const [activeTab, setActiveTab] = useState<TabId>(hasHistory ? 'history' : 'property')

  // TODO: Re-enable these tabs when data is ready:
  // - zoning: needs zoningdistricts layer with proper data
  // - services: needs firedistricts, schooldistricts, water layers
  const tabs: { id: TabId; label: string; show: boolean }[] = [
    { id: 'history', label: 'History', show: hasHistory },
    { id: 'property', label: 'Property', show: hasProperty },
    { id: 'zoning', label: 'Zoning', show: false }, // TEMPORARILY HIDDEN - enable when zoning data ready
    { id: 'services', label: 'Services', show: false }, // TEMPORARILY HIDDEN - enable when service districts ready
    { id: 'hazards', label: 'Hazards', show: hasHazards }, // Re-enabled with FEMA flood data
  ]

  const visibleTabs = tabs.filter(t => t.show)

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

      <div className="min-w-[200px] max-w-[240px]">
        {/* Tab navigation */}
        <div className="flex border-b border-gray-200 -mx-2 px-1 overflow-x-auto">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2 py-1 text-[9px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="pt-2 max-h-[35vh] overflow-y-auto">
          {activeTab === 'property' && (
            <PropertyTab parcel={parcel} publicLand={publicLand} subdivision={subdivision} />
          )}
          {activeTab === 'zoning' && (
            <ZoningTab zoning={zoning} parcel={parcel} />
          )}
          {activeTab === 'services' && (
            <ServicesTab features={validFeatures} />
          )}
          {activeTab === 'hazards' && (
            <HazardsTab features={validFeatures} />
          )}
          {activeTab === 'history' && (
            <HistoryTab features={validFeatures} />
          )}
        </div>

      </div>
    </>
  )
}
