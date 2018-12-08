import { IStorageObject, Repo } from './storageObject'

export interface ISyncStorage {
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
