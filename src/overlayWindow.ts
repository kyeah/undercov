import { IStorageObject } from './storageObject'
import { ISyncStorage } from './syncStorage'
import { Observable } from 'rx'

export enum pageType { blob, compare, pull, commit, blame, tree }
export enum lineType { missed, hit, irrelevant, partial }

export abstract class OverlayWindow {
  protected static emptyCoverage: JSON = JSON.parse('{}')
  protected coverageID?: string
  protected repoName?: string
  protected baseSha?: string
  protected page?: pageType
  protected coverageAvailable: boolean = false
  protected invalidating: boolean = false
  protected coverage: { [key: string]: JSON; } = {}

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

    const repoOptions = this.preferences.repos.find((repo) => repo.repoName === this.repoName)
    if (!repoOptions) {
      this.log('::retrieveCoverage', 'no repo options for ${this.repoName}')
      return Observable.of(OverlayWindow.emptyCoverage)
    }

    let url: string
    if (this.page === pageType.pull) {
      url = repoOptions.prUrlTemplate.replace(/\$1/g, this.coverageID!)
    } else {
      url = repoOptions.branchUrlTemplate.replace(/\$1/g, this.coverageID!)
    }

    this.log('::retrieveCoverage', url)

    let settings: JQueryAjaxSettings
    settings = {
      type: 'get',
      dataType: 'json'
    }

    return Rx.Observable.fromPromise(Promise.resolve($.when($.ajax(url, settings))))
      .catch((err: any) => {
        if (repoOptions.authUrlTemplate && err.status === 403) {
          const authUrl = repoOptions.authUrlTemplate.replace(/\$1/g, window.location.href)
          window.location.replace(authUrl)
        }
        return Observable.empty()
      })
  }

  private range(start: number, end: number): number[] {
    return Array.from(Array(end - start + 1)).map((_, i) => start + i)
  }

  private zip(a: [any], b: [any]): any[] {
    return a.map((val, i) => [val, b[i]])
  }

  private convertJsonFileCoverage(coverage: JSON): Object {
    const statements = Object.keys(coverage['statementMap'])
      .map(i => [coverage['statementMap'][i], coverage['s'][i]])

    const fns = Object.keys(coverage['fnMap'])
      .map(i => [coverage['fnMap'][i].loc, coverage['f'][i]])

    let [statementsHit, totalStatements] = [0, 0]

    const res = [...statements, ...fns]
      .reduce((res: Object, [location, hits]) => {
        const start = location.start.line
        const end = location.end.line

        const lines = this.range(start, end)
        for (const line of lines) {
          if (res[line] !== 0) {
            res[line] = hits
          }
        }

        totalStatements++
        if (hits > 0) {
          statementsHit++
        }

        return res
      }, {})

    let [branchesHit, totalBranches] = [0, 0]

    Object.keys(coverage['branchMap'])
      .filter(i => coverage['branchMap'][i].type !== 'if')
      .map(i => this.zip(coverage['branchMap'][i].locations, coverage['b'][i]))
      .reduce((acc: any[], val: any[]) => acc.concat(val), [])
      .forEach(([location, hits]) => {
        const start = location.start.line
        const end = location.end.line

        const lines = this.range(start, end)
        for (const line of lines) {
          if (res[line] && hits === 0) {
            // line has hits, but a branch on this line has zero hits
            // indicate a partial hit
            res[line] = -1
          }
        }

        totalBranches++
        if (hits > 0) {
          branchesHit++
        }
      })

    res['statementCoverage'] = statementsHit / totalStatements * 100.0
    res['branchCoverage'] = branchesHit / totalBranches * 100.0
    res['overallCoverage'] = (statementsHit + branchesHit) / (totalStatements + totalBranches) * 100.0
    return res
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

    return this.retrieveCoverageObservable(id)
      .map(coverage => coverage && this.converters['json'](coverage))
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

      // Don't persist across document pages, since we don't have
      // invalidation mechanisms at the moment.
      // this.storage.saveCoverage(this.coverage, () => { })

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
