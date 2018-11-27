import { IStorageObject } from './storageObject'

export interface ISyncStorage {
  loadCoverage(value: any, id: string, callback: (coverage: JSON) => void): void
  saveCoverage(value: any, callback: () => void): void
  loadOption(callback: (preferences: IStorageObject) => void): void
  saveOption(
    overlayEnabled: boolean,
    debugEnabled: boolean,
    branchUrlTemplate: string,
    prUrlTemplate: string,
    pathPrefix: string,
    callback: () => void
  ): void

}
