import { useState } from 'react'
import { LocationStep } from './components/LocationStep'
import { PreferencesStep } from './components/PreferencesStep'
import { OptionsStep } from './components/OptionsStep'
import { FinalItinerary } from './components/FinalItinerary'
import { HistoryView } from './components/HistoryView'
import { buildItineraryOptions, regenerateStop } from './services/itineraryBuilder'
import { buildICS } from './services/calendar'
import { downloadTextFile } from './lib/download'
import { saveItinerary, deleteItinerary, loadItineraries } from './services/storage'
import { hasLiveDataSource } from './services/env'
import type { ItineraryOption, ItineraryRequest, PlaceLocation, SavedItinerary } from './types/domain'

type Screen = 'location' | 'preferences' | 'loading' | 'options' | 'final' | 'history'

function App() {
  const [screen, setScreen] = useState<Screen>('location')
  const [location, setLocation] = useState<PlaceLocation | null>(null)
  const [request, setRequest] = useState<ItineraryRequest | null>(null)
  const [options, setOptions] = useState<ItineraryOption[]>([])
  const [selected, setSelected] = useState<ItineraryOption | null>(null)
  const [fallbackNotice, setFallbackNotice] = useState<string | undefined>(undefined)
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState<SavedItinerary[]>([])
  const [error, setError] = useState<string | null>(null)

  async function handlePreferencesSubmit(prefs: Omit<ItineraryRequest, 'location'>) {
    if (!location) return
    const fullRequest: ItineraryRequest = { ...prefs, location }
    setRequest(fullRequest)
    setScreen('loading')
    setError(null)
    try {
      const result = await buildItineraryOptions(fullRequest)
      setOptions(result.options)
      setFallbackNotice(result.usedLiveData ? undefined : hasLiveDataSource ? 'live search unavailable' : undefined)
      setScreen('options')
    } catch (err) {
      setError((err as Error).message)
      setScreen('preferences')
    }
  }

  function handleChooseOption(option: ItineraryOption) {
    setSelected(option)
    setSaved(false)
    setScreen('final')
  }

  async function handleRegenerateStop(index: number) {
    if (!request || !selected) return
    setRegeneratingIndex(index)
    try {
      const updated = await regenerateStop(request, selected, index)
      setSelected(updated)
      setSaved(false)
    } finally {
      setRegeneratingIndex(null)
    }
  }

  function handleDownloadICS() {
    if (!request || !selected) return
    const ics = buildICS(request, selected)
    downloadTextFile(`memorables-${request.date}.ics`, ics)
  }

  function handleSave() {
    if (!request || !selected) return
    saveItinerary(request, selected)
    setSaved(true)
  }

  function openHistory() {
    setHistory(loadItineraries())
    setScreen('history')
  }

  function handleViewSaved(item: SavedItinerary) {
    setRequest(item.request)
    setSelected(item.option)
    setLocation(item.request.location)
    setSaved(true)
    setScreen('final')
  }

  function handleDeleteSaved(id: string) {
    deleteItinerary(id)
    setHistory(loadItineraries())
  }

  function startOver() {
    setLocation(null)
    setRequest(null)
    setOptions([])
    setSelected(null)
    setSaved(false)
    setError(null)
    setScreen('location')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <button type="button" onClick={startOver} className="text-lg font-semibold">
            💜 Memorables
          </button>
          <button type="button" onClick={openHistory} className="text-sm font-medium text-violet-600 hover:underline">
            History
          </button>
        </div>
        {!hasLiveDataSource && (
          <div className="bg-violet-50 px-4 py-1.5 text-center text-xs text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            Demo mode - showing simulated venues. Add a Google Maps API key to search real places.
          </div>
        )}
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {error && <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-500/10">{error}</p>}

        {screen === 'location' && <LocationStep onSelect={(loc) => { setLocation(loc); setScreen('preferences') }} />}

        {screen === 'preferences' && location && (
          <PreferencesStep location={location} onChangeLocation={() => setScreen('location')} onSubmit={handlePreferencesSubmit} />
        )}

        {screen === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500 dark:text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            <p>Finding venues and checking travel times…</p>
          </div>
        )}

        {screen === 'options' && (
          <OptionsStep options={options} fallbackNotice={fallbackNotice} onChoose={handleChooseOption} onBack={() => setScreen('preferences')} />
        )}

        {screen === 'final' && request && selected && (
          <FinalItinerary
            request={request}
            option={selected}
            regeneratingIndex={regeneratingIndex}
            onRegenerateStop={handleRegenerateStop}
            onDownloadICS={handleDownloadICS}
            onSave={handleSave}
            saved={saved}
            onStartOver={startOver}
          />
        )}

        {screen === 'history' && (
          <HistoryView itineraries={history} onView={handleViewSaved} onDelete={handleDeleteSaved} onBack={() => setScreen(request ? 'final' : 'location')} />
        )}
      </main>
    </div>
  )
}

export default App
