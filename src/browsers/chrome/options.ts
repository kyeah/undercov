import { IStorageObject } from '../../storageObject'
import { ChromeStorage } from './chromeStorage'

class Options {
  private static storage: ChromeStorage = new ChromeStorage()
  constructor() {
    this.restoreState()
    this.bindBehaviors()
  }

  private restoreState(): void {
    Options.storage.loadOption((value: IStorageObject) => {
      (<HTMLInputElement>document.getElementById('overlay')).checked = value.overlayEnabled;
      (<HTMLInputElement>document.getElementById('debug')).checked = value.debugEnabled;
      (<HTMLInputElement>document.getElementById('branch')).value = value.branchUrlTemplate;
      (<HTMLInputElement>document.getElementById('pr')).value = value.prUrlTemplate;
      (<HTMLInputElement>document.getElementById('path-prefix')).value = value.pathPrefix
    })
  }

  private bindBehaviors(): void {
    window.document.getElementById('save')!.addEventListener('click', this.saveOptions)
  }

  private saveOptions(): void {
    const overlayEnabled = (<HTMLInputElement>document.getElementById('overlay')).checked
    const debugEnabled = (<HTMLInputElement>document.getElementById('debug')).checked
    const branchUrlTemplate = (<HTMLInputElement>document.getElementById('branch')).value
    const prUrlTemplate = (<HTMLInputElement>document.getElementById('pr')).value
    const pathPrefix = (<HTMLInputElement>document.getElementById('path-prefix')).value

    Options.storage.saveOption(
      overlayEnabled,
      debugEnabled,
      branchUrlTemplate,
      prUrlTemplate,
      pathPrefix,
      () => {
        const status = document.getElementById('status')
        status!.textContent = 'Options saved.'
        setTimeout(() => { status!.textContent = '' }, 750)
      }
    )
  }
}

document.addEventListener('DOMContentLoaded', () => {
  return new Options()
})
