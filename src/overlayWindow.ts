import { IStorageObject } from './storageObject'
import { ISyncStorage } from './syncStorage'
import { Observable } from 'rx'

export enum pageType { blob, compare, pull, commit, blame, tree }
export enum lineType { missed, hit, irrelevant }

export abstract class OverlayWindow {
  protected static emptyCoverage: JSON = JSON.parse('{}')
  protected coverageID?: string
  protected baseSha?: string
  protected page?: pageType
  protected coverageAvailable: boolean = false
  protected invalidating: boolean = false
  protected coverage: { [key: string]: JSON; } = { }

  protected abstract acquireReference(page: pageType, value: string[]): string | void | undefined
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

    this.page = (<any>pageType)[href[5]]

    const ref = this.acquireReference(this.page!, href)
    if (ref) {
      this.coverageID = ref
    }

    if (this.coverageID) {
      this.invalidateOverlay()
    }
  }

  private retrieveCoverageObservable(id: string): Observable<JSON> {
    this.log('::retrieveCoverage', id)
    this.coverageAvailable = false

    let url: string
    if (this.page === pageType.pull) {
      url = this.preferences.prUrlTemplate.replace('$1', this.coverageID!)
    } else {
      url = this.preferences.branchUrlTemplate.replace('$1', this.coverageID!)
    }

    this.log('::retrieveCoverage', url)

    let settings: JQueryAjaxSettings
    settings = {
      type: 'get',
      dataType: 'json'
    }

    return Rx.Observable.fromPromise(Promise.resolve($.when($.ajax(url, settings))))
  }

  private convertJsonFileCoverage(coverage: JSON): Object {
    const statements = Object.keys(coverage['statementMap'])
      .map(i => [coverage['statementMap'][i], coverage['s'][i]])

    const fns = Object.keys(coverage['fnMap'])
      .map(i => [coverage['fnMap'][i].loc, coverage['f'][i]])

    return [...statements, ...fns]
      .reduce((res: Object, [location, hits]) => {
        const start = location.start.line
        const end = location.end.line

        const lines = Array.from(Array(end - start + 1)).map((_, i) => start + i)
        for (const line of lines) {
          res[line] = hits
        }
        return res
      }, {})
  }

  protected converters: { [key: string]: (coverage: JSON) => JSON; } = {
    'json': (coverage: JSON) => {
      const res: JSON = JSON.parse('{}')
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

    const id = this.coverageID!
    this.log('::invalidateOverlay', 'invalidating')
    this.invalidating = true

    const visualize: (id: string) => (coverage: JSON) => void = (id: string) => (coverage: JSON) => {
      this.log('::visualize', 'saving coverage')
      this.coverage[id] = coverage
      this.storage.saveCoverage(this.coverage, () => { })
      this.visualizeOverlay(this.coverage[id])
    }

    this.readCoverageObservable(id).finally(() => {
      this.invalidating = false
    }).subscribe(visualize(id))
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
