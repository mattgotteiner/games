import { useLayoutEffect } from 'preact/hooks'

export function usePageColor(attribute: string, themeId: string, page: string, metaThemeColor: string): void {
  useLayoutEffect(() => {
    const root = document.documentElement
    const previousTheme = root.getAttribute(attribute)
    const previousPage = root.style.getPropertyValue('--bd-page')
    const previousPagePriority = root.style.getPropertyPriority('--bd-page')
    const existingMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    )
    const meta = existingMeta ?? document.createElement('meta')
    const previousMetaContent = meta.getAttribute('content')

    if (existingMeta === null) {
      meta.name = 'theme-color'
      document.head.append(meta)
    }
    root.setAttribute(attribute, themeId)
    root.style.setProperty('--bd-page', page)
    meta.content = metaThemeColor

    return () => {
      if (previousTheme === null) {
        root.removeAttribute(attribute)
      } else {
        root.setAttribute(attribute, previousTheme)
      }
      if (previousPage) {
        root.style.setProperty('--bd-page', previousPage, previousPagePriority)
      } else {
        root.style.removeProperty('--bd-page')
      }
      if (existingMeta === null) {
        meta.remove()
      } else if (previousMetaContent === null) {
        meta.removeAttribute('content')
      } else {
        meta.content = previousMetaContent
      }
    }
  }, [attribute, themeId, page, metaThemeColor])
}
