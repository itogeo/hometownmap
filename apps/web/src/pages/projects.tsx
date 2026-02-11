import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import Link from 'next/link'

interface ProjectUpdate {
  date: string
  text: string
}

interface Project {
  id: string
  name: string
  category: string
  status: string
  description: string
  budget: number
  spent: number
  start_date: string
  end_date: string
  contractor: string
  project_manager: string
  funding_sources: string[]
  updates: ProjectUpdate[]
  impact?: string
  benefits: string[]
  source?: string
  coordinates: [number, number] | [number, number][] | [number, number][][]
  geometryType: string
}

const MapView = dynamic(() => import('@/components/ProjectsMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <div className="text-gray-600">Loading map...</div>
    </div>
  ),
})

const statusColors: { [key: string]: { bg: string; text: string; border: string } } = {
  'Completed': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  'In Progress': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  'Planning': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  'On Hold': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
}

const categoryIcons: { [key: string]: string } = {
  'Streets': '🛤️',
  'Parks': '🌳',
  'Water/Sewer': '💧',
  'Buildings': '🏛️',
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  return `$${(amount / 1000).toFixed(0)}K`
}

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === 'TBD') return 'TBD'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function ProjectCard({
  project,
  isSelected,
  onSelect,
}: {
  project: Project
  isSelected: boolean
  onSelect: () => void
}) {
  const status = statusColors[project.status] || statusColors['Planning']
  const progress = Math.round((project.spent / project.budget) * 100)

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{categoryIcons[project.category] || '📋'}</span>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">{project.name}</h3>
            <span className="text-xs text-gray-500">{project.category}</span>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          {project.status}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{project.description}</p>

      {/* Budget Progress */}
      <div className="mb-3">
        {project.budget > 0 ? (
          <>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Budget: {formatCurrency(project.budget)}</span>
              <span>{progress}% spent</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  project.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </>
        ) : (
          <div className="text-xs text-gray-500 italic">Budget to be determined</div>
        )}
      </div>

      {/* Timeline */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>📅</span>
        <span>{formatDate(project.start_date)} → {formatDate(project.end_date)}</span>
      </div>
    </div>
  )
}

function ProjectDetail({ project, onClose }: { project: Project; onClose: () => void }) {
  const status = statusColors[project.status] || statusColors['Planning']
  const progress = Math.round((project.spent / project.budget) * 100)

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden max-h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{categoryIcons[project.category] || '📋'}</span>
            <div>
              <h2 className="text-xl font-bold">{project.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-white/20`}>
                  {project.category}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                  {project.status}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Description */}
        <div>
          <p className="text-gray-700">{project.description}</p>
        </div>

        {/* Budget Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>💰</span> Budget & Spending
          </h4>
          {project.budget > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(project.budget)}</div>
                  <div className="text-xs text-gray-500">Total Budget</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(project.spent)}</div>
                  <div className="text-xs text-gray-500">Spent to Date</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(project.budget - project.spent)}</div>
                  <div className="text-xs text-gray-500">Remaining</div>
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${project.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">{progress}% of budget utilized</div>
            </>
          ) : (
            <div className="text-gray-500 italic text-sm">Budget to be determined through planning process</div>
          )}
        </div>

        {/* Funding Sources */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span>🏦</span> Funding Sources
          </h4>
          <div className="flex flex-wrap gap-2">
            {project.funding_sources.map((source, i) => (
              <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                {source}
              </span>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Start Date</div>
            <div className="font-semibold">{formatDate(project.start_date)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Target Completion</div>
            <div className="font-semibold">{formatDate(project.end_date)}</div>
          </div>
        </div>

        {/* Project Team */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Contractor</div>
            <div className="font-medium text-gray-900">{project.contractor}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Project Manager</div>
            <div className="font-medium text-gray-900">{project.project_manager}</div>
          </div>
        </div>

        {/* Impact Notice */}
        {project.impact && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg">
            <div className="font-semibold text-amber-800 text-sm flex items-center gap-2">
              <span>⚠️</span> Current Impact
            </div>
            <p className="text-sm text-amber-700 mt-1">{project.impact}</p>
          </div>
        )}

        {/* Benefits */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span>✨</span> Project Benefits
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {project.benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-500">✓</span>
                {benefit}
              </div>
            ))}
          </div>
        </div>

        {/* Updates Timeline */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>📝</span> Project Updates
          </h4>
          <div className="space-y-3">
            {project.updates.map((update, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  {i < project.updates.length - 1 && <div className="w-0.5 flex-1 bg-gray-200" />}
                </div>
                <div className="flex-1 pb-3">
                  <div className="text-xs text-gray-500">{formatDate(update.date)}</div>
                  <div className="text-sm text-gray-700">{update.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source Link */}
        {project.source && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-600 mb-1">📄 Data Source</div>
            <a
              href={project.source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-700 hover:underline break-all"
            >
              {project.source}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [cityConfig, setCityConfig] = useState<any>(null)

  // Load city config
  useEffect(() => {
    fetch('/data/config/three-forks.json')
      .then((res) => res.json())
      .then((config) => setCityConfig(config))
      .catch((err) => console.error('Failed to load config:', err))
  }, [])

  // Load projects
  useEffect(() => {
    fetch('/data/layers/three-forks/projects.geojson')
      .then((res) => res.json())
      .then((data) => {
        if (data.features) {
          const projectList: Project[] = data.features.map((f: any) => ({
            ...f.properties,
            coordinates: f.geometry.coordinates,
            geometryType: f.geometry.type,
          }))
          setProjects(projectList)
          console.log(`✅ Loaded ${projectList.length} projects`)
        }
      })
      .catch((err) => console.error('Failed to load projects:', err))
  }, [])

  const categories = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.category))).sort()
  }, [projects])

  const statuses = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.status)))
  }, [projects])

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filterCategory && p.category !== filterCategory) return false
      if (filterStatus && p.status !== filterStatus) return false
      return true
    })
  }, [projects, filterCategory, filterStatus])

  // Stats
  const stats = useMemo(() => {
    const total = projects.reduce((sum, p) => sum + p.budget, 0)
    const spent = projects.reduce((sum, p) => sum + p.spent, 0)
    const active = projects.filter((p) => p.status === 'In Progress').length
    const completed = projects.filter((p) => p.status === 'Completed').length
    return { total, spent, active, completed }
  }, [projects])

  if (!cityConfig) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Capital Projects | {cityConfig.name}</title>
        <meta name="description" content={`Active infrastructure projects in ${cityConfig.name}`} />
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
          rel="stylesheet"
        />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/" className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  ← Back to Map
                </Link>
                <div className="h-6 w-px bg-gray-300" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Capital Projects</h1>
                  <p className="text-sm text-gray-500">City of {cityConfig.name} Infrastructure Investments</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </header>

        {/* Stats Bar */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold">{projects.length}</div>
                <div className="text-xs sm:text-sm text-blue-100">Total Projects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{formatCurrency(stats.total)}</div>
                <div className="text-sm text-blue-100">Total Investment</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.active}</div>
                <div className="text-sm text-blue-100">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.completed}</div>
                <div className="text-sm text-blue-100">Completed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Filters & List */}
            <div className="lg:col-span-1 space-y-4">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Filter Projects</h3>

                {/* Category Filter */}
                <div className="mb-3">
                  <label className="text-xs text-gray-500 block mb-1">Category</label>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setFilterCategory(null)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        !filterCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                          filterCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span>{categoryIcons[cat]}</span>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Status</label>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setFilterStatus(null)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        !filterStatus ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    {statuses.map((status) => {
                      const colors = statusColors[status] || statusColors['Planning']
                      return (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(filterStatus === status ? null : status)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            filterStatus === status
                              ? 'bg-blue-600 text-white'
                              : `${colors.bg} ${colors.text} hover:opacity-80`
                          }`}
                        >
                          {status}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Project List */}
              <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isSelected={selectedProject?.id === project.id}
                    onSelect={() => setSelectedProject(project)}
                  />
                ))}
                {filteredProjects.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No projects match your filters
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Map & Detail */}
            <div className="lg:col-span-2 space-y-4">
              {/* Map */}
              <div className="bg-white rounded-lg shadow overflow-hidden h-[400px]">
                <MapView
                  projects={filteredProjects}
                  selectedProject={selectedProject}
                  onProjectSelect={setSelectedProject}
                  cityConfig={cityConfig}
                />
              </div>

              {/* Project Detail */}
              {selectedProject ? (
                <ProjectDetail
                  project={selectedProject}
                  onClose={() => setSelectedProject(null)}
                />
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">👆</div>
                  <p>Select a project to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t mt-8">
          <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
            <p>Questions about city projects? Contact City Hall at {cityConfig.contact?.phone}</p>
            <p className="mt-1">
              <a href={cityConfig.contact?.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {cityConfig.contact?.website}
              </a>
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
