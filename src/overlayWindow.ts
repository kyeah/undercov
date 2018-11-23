import { IStorageObject } from './storageObject'
import { ISyncStorage } from './syncStorage'
import * as Rx from 'rx'
import Observable = Rx.Observable

export enum pageType { blob, compare, pull, commit, blame, tree }
export enum lineType { missed, hit, irrelevant }

export abstract class OverlayWindow {
  protected static emptyCoverage: JSON = JSON.parse('{}')
  protected filePath: string = null
  protected coverageID: string = null
  protected baseSha: string = null
  protected page: pageType = null
  protected owner: string = null
  protected coverageAvailable: boolean = false
  protected invalidating: boolean = false
  protected coverage: { [key: string]: JSON; } = { }

  protected abstract acquireReference(value: string[]): string
  protected abstract prepareOverlay(): void
  protected abstract visualizeOverlay(value: any): void

  constructor(protected preferences: IStorageObject, private storage: ISyncStorage) {
    this.initialize()
  }

  log(title: string, data?: any): void {
    if (!this.preferences.debugEnabled) {
      return
    }

    data ? console.log(title, data) : console.log(title)
  }

  initialize(): void {
    const href = (this.preferences.debug_url || document.URL).split('/')
    this.log('::initialize', href)

    this.owner = `${href[3]}/${href[4]}`
    this.page = (<any>pageType)[href[5]]
    this.coverageID = this.acquireReference(href)

    if (this.coverageID) {
      this.invalidateOverlay()
    }
  }

  private retrieveCoverageObservable(id: string): Observable<JSON> {
    this.log('::retrieveCoverage', id)
    this.coverageAvailable = false

    let url: string
    if (this.page === pageType.pull) {
      url = this.preferences.prUrlTemplate.replace('$1', this.coverageID)
    } else {
      // TODO: filter out any pageType that will probably error
      url = this.preferences.branchUrlTemplate.replace('$1', this.coverageID)
    }

    this.log('::retrieveCoverage', url)

    let settings: JQueryAjaxSettings
    settings = {
      type: 'get',
      dataType: 'json'
    }

    return Rx.Observable.fromPromise($.when($.ajax(url, settings)))
  }

  private convertJsonFileCoverage(coverage: JSON): Object {
    return Object.keys(coverage['statementMap'])
      .map(i => [coverage['statementMap'][i], coverage['s'][i]])
      .reduce((res: Object, [statement, s]) => {
        res[statement.start.line] = s
        return res
      }, {})
  }

  protected converters: { [key: string]: (coverage: JSON) => Object; } = {
    'json': (coverage: JSON) => {
      const res: Object = {}
      for (const filename in coverage) {
        if (coverage[filename]['statementMap']) {
          res[filename] = this.convertJsonFileCoverage(coverage[filename])
        } else {
          this.log('::convert json - no statement map', filename)
        }
      }
      return res
    }
  }

  private readCoverageObservable(id: string): Observable<JSON> {
    const stored = this.coverage[id]
    if (stored) {
      return Observable.of(stored)
    }

    const observable = Observable.fromCallback<any>(this.storage.loadCoverage)
    return observable(this.coverage, id).map(cachedCoverage => {
      return cachedCoverage || this.retrieveCoverageObservable(id)
        .map(coverage => coverage && this.converters['json'](coverage))
    }).concatAll()
  }

  protected invalidateOverlay(): void {
    if (this.invalidating) {
      this.log('::invalidateOverlay', 'invalidate ongoing')
      return
    }

    const id = this.coverageID
    this.log('::invalidateOverlay', 'invalidating')
    this.invalidating = true

    const visualize: (coverage: JSON) => void = (coverage: JSON) => {
      this.log('::visualize', 'saving coverage')
      this.coverage[id] = coverage
      this.storage.saveCoverage(this.coverage, () => { })
      this.visualizeOverlay(this.coverage[id])
    }

    this.readCoverageObservable(id).finally(() => {
      this.invalidating = false
    }).subscribe(visualize,
                 (err: JQueryXHR) => {
                   if (err.status === 500) {
                     visualize(OverlayWindow.emptyCoverage)
                   }
                 })
  }

  protected static ratio(hit: number, total: number): string {
    if (hit >= total) {
      return '100'
    } else if (total > hit && hit > 0) {
      return ((hit / total) * 10000 / 100).toFixed(2)
    }
    return '0'
  }
}
