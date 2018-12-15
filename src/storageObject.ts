/**
 * Configurable options for each repo.
 */
export type Repo = {
  repoName: string,
  branchUrlTemplate: string,
  prUrlTemplate: string,
  pathPrefix: string,
  githubPathPrefix: string,
  authUrlTemplate: string,
  filetype: string
}

/**
 * Value object to encapsulate options.
 */
export interface IStorageObject {
  overlayEnabled: boolean
  debugEnabled: boolean
  filetreeCoverageEnabled: boolean
  debug_url: any
  repos: Repo[]
}

export class StorageObject implements IStorageObject {
  get overlayEnabled(): boolean {
    return this._overlayEnabled
  }

  set overlayEnabled(value: boolean) {
    this._overlayEnabled = value
  }

  get filetreeCoverageEnabled(): boolean {
    return this._filetreeCoverageEnabled
  }

  set filetreeCoverageEnabled(value: boolean) {
    this._filetreeCoverageEnabled = value
  }

  get debugEnabled(): boolean {
    return this._debugEnabled
  }

  set debugEnabled(value: boolean) {
    this._debugEnabled = value
  }

  get debug_url(): any {
    return false
  }

  get repos(): Repo[] {
    return this._repos
  }

  set repos(value: Repo[]) {
    this._repos = value
  }

  constructor(
    private _overlayEnabled: boolean = true,
    private _debugEnabled: boolean = false,
    private _filetreeCoverageEnabled: boolean = true,
    private _repos: Repo[] = []
  ) {
  }
}
