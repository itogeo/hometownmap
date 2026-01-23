import dynamic from 'next/dynamic'
import Head from 'next/head'

// Dynamic import to avoid SSR issues
const SimpleMap = dynamic(() => import('@/components/SimpleMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontSize: '20px'
    }}>
      Loading map...
    </div>
  )
})

export default function ParcelsPage() {
  return (
    <>
      <Head>
        <title>Three Forks Parcels - Test</title>
      </Head>
      <SimpleMap />
    </>
  )
}
