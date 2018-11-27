import { IStorageObject, Repo, StorageObject } from '../../storageObject'
import { ISyncStorage } from '../../syncStorage'

export class ChromeStorage implements ISyncStorage {
  loadOption(callback: (preferences: IStorageObject) => void): void {
    chrome.storage.sync.get({
      overlayEnabled: true,
      debugEnabled: false,
      repos: []
    }, (items: any) => {
      if (items['overlayEnabled'] === undefined) {
        items['overlayEnabled'] = true
      }
      callback(new StorageObject(
        items['overlayEnabled'],
        items['debugEnabled'],
        items['repos']
      ))
    })
  }

  saveOption(
    overlayEnabled: boolean,
    debugEnabled: boolean,
    repos: Repo[],
    callback: () => void
  ): void {
    chrome.storage.sync.set({
      overlayEnabled,
      debugEnabled,
      repos
    }, callback)
  }

  loadCoverage(value: any, id: string, callback: (coverage: JSON) => void): void {
    chrome.storage.local.get(value, (items: any) => {
      const value = items[id]
      if (callback) {
        callback(value)
      }
    })
  }

  saveCoverage(value: any, callback: () => void): void {
    chrome.storage.local.set(value, callback)
  }
}
