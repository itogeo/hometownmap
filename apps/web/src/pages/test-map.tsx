import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues with mapbox
const SimpleMap = dynamic(() => import('@/components/SimpleMap'), {
  ssr: false,
  loading: () => <div style={{padding: 50}}>Loading map component...</div>
})

export default function TestMapPage() {
  return <SimpleMap />
}
