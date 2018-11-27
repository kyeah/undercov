export interface IStorageObject {
  overlayEnabled: boolean
  debugEnabled: boolean
  debug_url: any
  branchUrlTemplate: string
  prUrlTemplate: string
  pathPrefix: string
}

export class StorageObject implements IStorageObject {
  get overlayEnabled(): boolean {
    return this._overlayEnabled
  }

  set overlayEnabled(value: boolean) {
    this._overlayEnabled = value
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

  get branchUrlTemplate(): string {
    return this._branchUrlTemplate
  }

  set branchUrlTemplate(value: string) {
    this._branchUrlTemplate = value
  }

  get prUrlTemplate(): string {
    return this._prUrlTemplate
  }

  set prUrlTemplate(value: string) {
    this._prUrlTemplate = value
  }

  get pathPrefix(): string {
    return this._pathPrefix
  }

  set pathPrefix(value: string) {
    this._pathPrefix = value
  }

  constructor(
    private _overlayEnabled: boolean = true,
    private _debugEnabled: boolean = false,
    private _branchUrlTemplate: string = '',
    private _prUrlTemplate: string = '',
    private _pathPrefix: string = ''
  ) {
  }
}
