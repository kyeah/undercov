import { IStorageObject, Repo, StorageObject } from '../../storageObject'
import { ISyncStorage } from '../../syncStorage'

/**
 * Utility to encapsulate reading and writing to chrome options.
 */
export class ChromeStorage implements ISyncStorage {
  loadOption(callback: (preferences: IStorageObject) => void): void {
    chrome.storage.sync.get({
      overlayEnabled: true,
      debugEnabled: false,
      filetreeCoverageEnabled: true,
      repos: []
    }, (items: any) => {
      if (items['overlayEnabled'] === undefined) {
        items['overlayEnabled'] = true
      }
      callback(new StorageObject(
        items['overlayEnabled'],
        items['debugEnabled'],
        items['filetreeCoverageEnabled'],
        items['repos']
      ))
    })
  }

  saveOptions(preferences: IStorageObject): void {
    this.saveOption(
      preferences.overlayEnabled,
      preferences.debugEnabled,
      preferences.filetreeCoverageEnabled,
      preferences.repos,
      () => { }
    )
  }

  saveOption(
    overlayEnabled: boolean,
    debugEnabled: boolean,
    filetreeCoverageEnabled: boolean,
    repos: Repo[],
    callback: () => void
  ): void {
    chrome.storage.sync.set({
      overlayEnabled,
      debugEnabled,
      filetreeCoverageEnabled,
      repos
    }, callback)
  }
}
