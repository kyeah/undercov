import GithubWindow from '../../githubWindow'
import { OverlayWindow } from '../../overlayWindow'
import { ChromeStorage } from './chromeStorage'
import { IStorageObject } from '../../storageObject'

/**
 * Main entrypoint for all the things.
 * This initializes the overlay window instance when the document is loaded.
 */
class BootStrapper {
  private static preferences?: IStorageObject
  private overlay?: OverlayWindow
  private storage: ChromeStorage = new ChromeStorage()
  private url: string = ''

  constructor() {
    this.initialize()
  }

  /**
   * Create the overlay if we're on Github, or
   * autoconfigure the repo if we're on a raw file blob.
   */
  private createOverlay(preferences: IStorageObject): void {
    const doc = document.getElementById('chrome-install-plugin')
    if (doc) {
      doc.style.display = 'none'
    }

    this.url = preferences.debug_url || document.URL

    // If we're on a raw file blob, see if we're looking at
    // an .undercov.json config and autoload it if so.
    if (this.url.includes('raw.githubusercontent.com')) {
      this.configureRepo(preferences)
    }

    if (this.url.indexOf('https://github.com') >= 0) {
      this.overlay = new GithubWindow(preferences, this.storage)
    }
  }

  /**
   * Ensure we have preferences loaded, then initialize the overlay.
   */
  private initialize(): void {
    if (BootStrapper.preferences) {
      this.setupOverlay(BootStrapper.preferences)
    } else {
      this.storage.loadOption(prefs => this.setupOverlay(prefs))
    }
  }

  private setupOverlay(preferences: IStorageObject): void {
    if (!preferences.overlayEnabled) {
      return
    }

    this.createOverlay(preferences)

    // Listen to Github's pjax events to indicate when we're moving to different
    // pages and tabs (and need to reload coverage).
    window.addEventListener('message', (event: MessageEvent) => {
      if (event.source === window && event.data.type) {
        if (this.overlay && (event.data.type === 'undercov' || event.data.type === 'url_change')) {
          this.overlay.log('::pjax-event-received')
          this.overlay.initialize()
        }
      }
    })

    if (this.url.indexOf('https://github.com') >= 0) {
      this.injectListener()
    }
  }

  /**
   * Inject a listener for Github's pjax requests.
   */
  private injectListener(): void {
    const listener = '(' + function() {
      document.addEventListener('pjax:success', function() {
        window.postMessage({ type: 'undercov' }, '*')
      })
    } + ')();'

    const script = document.createElement('script')
    const element = document.head || document.documentElement

    if (element) {
      script.textContent = listener
      element.appendChild(script)
      script.parentNode!.removeChild(script)
    }
  }

  /**
   * Autoconfigure a repository's code coverage settings if
   * We're looking at a raw JSON blob.
   */
  private configureRepo(preferences: IStorageObject): void {
    let json
    try {
      json = JSON.parse($('pre').text())
    } catch (e) {
      return
    }

    // Return if we don't find one of the required keys.
    if (!json['branchUrlTemplate'] && !json['prUrlTemplate']) {
      return
    }

    const split = document.URL.split('/')
    json.repoName = `${split[3]}/${split[4]}`

    // Remove an old config if it already exists.
    for (let i = 0; i < preferences.repos.length; i++) {
      if (preferences.repos[i].repoName === json.repoName) {
        preferences.repos.splice(i, 1)
        break
      }
    }

    preferences.repos.push(json)
    this.storage.saveOptions(preferences)

    chrome.runtime.sendMessage({
      action: 'REQUEST_NOTIFICATION',
      options: {
        type: 'basic',
        iconUrl: 'resources/18dp.png',
        title: 'undercov',
        message: `Configured ${json.repoName}.`
      }
    })
  }
}

$(() => {
  return new BootStrapper()
})
