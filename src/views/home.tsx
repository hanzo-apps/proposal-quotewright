import { useEffect, useState } from 'react'
import { List } from './list'
import { Editor } from './editor'
import { Preview } from './preview'

type View = 'list' | 'editor' | 'preview'
interface Route {
  view: View
  id: string | null
}

/**
 * Hand-rolled routing — no router dependency (the same ethos as the starter's
 * `/auth/callback` gate). A read-only share link is a real URL: `/p/<id>` opens
 * straight into the preview, and navigation keeps the address bar in sync via
 * `history.pushState`, so "Copy share link" always matches what's on screen.
 */
function readRoute(): Route {
  if (typeof window !== 'undefined') {
    const match = window.location.pathname.match(/^\/p\/([^/]+)/)
    if (match) return { view: 'preview', id: decodeURIComponent(match[1]) }
  }
  return { view: 'list', id: null }
}

/** The signed-in shell: switches between the three views and syncs the URL. */
export function Home() {
  const [route, setRoute] = useState<Route>(readRoute)

  useEffect(() => {
    const onPop = () => setRoute(readRoute())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  function go(next: Route) {
    setRoute(next)
    const path = next.view === 'preview' && next.id ? `/p/${next.id}` : '/'
    window.history.pushState(null, '', path)
  }

  const openList = () => go({ view: 'list', id: null })
  const openEditor = (id: string) => go({ view: 'editor', id })
  const openPreview = (id: string) => go({ view: 'preview', id })

  if (route.view === 'editor' && route.id) {
    return <Editor id={route.id} onList={openList} onPreview={openPreview} />
  }
  if (route.view === 'preview' && route.id) {
    return <Preview id={route.id} onBack={() => openEditor(route.id as string)} />
  }
  return <List onOpen={openEditor} />
}
