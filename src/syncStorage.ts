import { IStorageObject, Repo } from './storageObject'

export interface ISyncStorage {
  loadCoverage(value: any, id: string, callback: (coverage: JSON) => void): void
  saveCoverage(value: any, callback: () => void): void
  loadOption(callback: (preferences: IStorageObject) => void): void
  saveOptions(preferences: IStorageObject): void
  saveOption(
    overlayEnabled: boolean,
    debugEnabled: boolean,
    filetreeCoverageEnabled: boolean,
    repos: Repo[],
    callback: () => void
  ): void

}
