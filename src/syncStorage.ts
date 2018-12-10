import { IStorageObject, Repo } from './storageObject'

/**
 * Common interface for various browsers to load and save options.
 */
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
