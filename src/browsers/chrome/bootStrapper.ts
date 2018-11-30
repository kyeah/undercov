import GithubWindow from '../../githubWindow'
import { OverlayWindow } from '../../overlayWindow'
import { ChromeStorage } from './chromeStorage'
import { IStorageObject } from '../../storageObject'

/**
 * Initialize overlay window instance when document is loaded.
 */
class BootStrapper {
  private static preferences?: IStorageObject
  private overlay?: OverlayWindow
  private storage: ChromeStorage = new ChromeStorage()
  private url: string = ''

  constructor() {
    this.initialize()
  }

  private createOverlay(preferences: IStorageObject): void {
    const doc = document.getElementById('chrome-install-plugin')
    if (doc) {
      doc.style.display = 'none'
    }

    this.url = preferences.debug_url || document.URL

    if (this.url.includes('raw.githubusercontent.com')) {
      this.configureRepo(preferences)
    }

    if (!(this.url.indexOf('https://github.com') < 0)) {
      this.overlay = new GithubWindow(preferences, this.storage)
    }
  }

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

    window.addEventListener('message', (event: MessageEvent) => {
      if (event.source === window && event.data.type) {
        if (this.overlay && (event.data.type === 'undercov' || event.data.type === 'url_change')) {
          this.overlay.log('::pjax-event-received')
          this.overlay.initialize()
        }
      }
    })

    if (!(this.url.indexOf('https://github.com') < 0)) {
      this.injectListener()
    }
  }

  /**
   * Inject listener script into document
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

  private configureRepo(preferences: IStorageObject): void {
    let json
    try {
      json = JSON.parse($('pre').text())
    } catch (e) {
      return
    }

    if (!json['branchUrlTemplate'] && !json['prUrlTemplate']) {
      return
    }

    const split = document.URL.split('/')
    json.repoName = `${split[3]}/${split[4]}`

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
