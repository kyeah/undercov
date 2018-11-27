import { IStorageObject, StorageObject } from '../../storageObject'
import { ISyncStorage } from '../../syncStorage'

export class ChromeStorage implements ISyncStorage {
  loadOption(callback: (preferences: IStorageObject) => void): void {
    chrome.storage.sync.get({
      overlayEnabled: true,
      debugEnabled: false,
      branchUrlTemplate: '',
      prUrlTemplate: '',
      pathPrefix: ''
    }, (items: any) => {
      if (items['overlayEnabled'] === undefined) {
        items['overlayEnabled'] = true
      }
      callback(new StorageObject(
        items['overlayEnabled'],
        items['debugEnabled'],
        items['branchUrlTemplate'],
        items['prUrlTemplate'],
        items['pathPrefix']
      ))
    })
  }

  saveOption(
    overlayEnabled: boolean,
    debugEnabled: boolean,
    branchUrlTemplate: string,
    prUrlTemplate: string,
    pathPrefix: string,
    callback: () => void
  ): void {
    chrome.storage.sync.set({
      overlayEnabled,
      debugEnabled,
      branchUrlTemplate,
      prUrlTemplate,
      pathPrefix
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
