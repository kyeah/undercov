import { IStorageObject, Repo } from './storageObject'

export interface ISyncStorage {
  loadCoverage(value: any, id: string, callback: (coverage: JSON) => void): void
  saveCoverage(value: any, callback: () => void): void
  loadOption(callback: (preferences: IStorageObject) => void): void
  saveOption(
    overlayEnabled: boolean,
    debugEnabled: boolean,
    repos: Repo[],
    callback: () => void
  ): void

}
