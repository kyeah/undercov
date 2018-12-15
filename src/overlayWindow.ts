import { IStorageObject } from './storageObject'
import { ISyncStorage } from './syncStorage'
import { Observable } from 'rx'

export enum pageType { blob, compare, pull, commit, blame, tree }
export enum lineType { missed, hit, irrelevant, partial }

export abstract class OverlayWindow {
  protected static emptyCoverage: JSON = JSON.parse('{}')
  protected coverageID?: string
  protected repoName?: string
  protected page?: pageType
  protected coverageAvailable: boolean = false
  protected invalidating: boolean = false
  protected coverage: { [key: string]: JSON; } = {}

  protected abstract acquireReference(page: pageType, value: string[]): string | void | undefined
  protected abstract visualizeOverlay(value: any): void
  protected abstract checkForConfig(storage: ISyncStorage): void

  constructor(protected preferences: IStorageObject, private storage: ISyncStorage) {
    this.initialize()
  }

  /**
   * Log to the console only if the debug setting is enabled.
   */
  log(title: string, data?: any): void {
    if (!this.preferences.debugEnabled) {
      return
    }

    data ? console.log(title, data) : console.log(title)
  }

  initialize(): void {
    const href = (this.preferences.debug_url || document.URL).split('/')
    this.log('::initialize', href)

    // Grab the page type from the URL
    this.page = (<any>pageType)[href[5]]

    // Grab the coverage reference (branch or PR ID) from the page
    const ref = this.acquireReference(this.page!, href)
    if (ref) {
      this.coverageID = ref
    }

    // If we don't have coverage settings for this repo, search for .undercov.json
    // and prompt the user to autoconfigure if it exists.
    if (this.repoName && !this.preferences.repos.find(repo => repo.repoName === this.repoName)) {
      this.checkForConfig(this.storage)
    }

    if (this.coverageID) {
      this.invalidateOverlay()
    }
  }

  /**
   * Retrieve the coverage from the configured code coverage server.
   * This also handles requesting Chrome permissions + redirecting to
   * an authentication URL as needed.
   */
  private retrieveCoverageObservable(id: string): Observable<any> {
    this.log('::retrieveCoverage', id)
    this.coverageAvailable = false

    const repoOptions = this.preferences.repos.find((repo) => repo.repoName === this.repoName)
    if (!repoOptions) {
      this.log('::retrieveCoverage', `no repo options for ${this.repoName}`)
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
      dataType: 'xml'
    }

    return Rx.Observable.fromPromise(Promise.resolve($.when($.ajax(url, settings))))
      .map((v: any) => Observable.of(v))
      .catch((err: any) => {
        // We have to return Observables here because of async calls. These observables
        // are merged into the original observable using concatAll.
        //
        // To make concatAll work in the happy case, we map to a nested observable above.
        //
        if (err.status === 0 && url) {
          // Request permissions if needed.
          const origin = new URL(url).origin + '/'
          this.log('::retrieveCoverage', `requesting permissions to ${origin}`)

          return Observable.fromCallback<any>(chrome.runtime.sendMessage)({
            action: 'REQUEST_PERMISSION',
            origin: origin
          }).map((granted) => {
            if (!granted) {
              this.log('::retrieveCoverage', `permissions denied to ${origin}`)
              return Observable.empty()
            }

            this.log('::retrieveCoverage', `permissions granted to ${origin}`)

            // Retry code coverage request.
            return Rx.Observable.fromPromise(Promise.resolve($.when($.ajax(url, settings))))
              .catch((err: any) => {
                this.redirectToAuthOrFail(repoOptions.authUrlTemplate, err)
                return Observable.empty()
              })
          })
        } else {
          // We can reach the code coverage server, check if we need to auth.
          this.log('::retrieveCoverage', err)
          this.redirectToAuthOrFail(repoOptions.authUrlTemplate, err)
          return Observable.empty()
        }
      }).concatAll()
  }

  /**
   * Redirect to the authentication URL if it's configured and we hit a 403.
   */
  private redirectToAuthOrFail(authUrlTemplate: string, err: any) {
    if (!(authUrlTemplate && err.status === 403)) {
      return
    }

    // Prevent infinite redirects with a lil query param.
    if (!window.location.href.endsWith('undercov=1')) {
      chrome.runtime.sendMessage({
        action: 'REQUEST_NOTIFICATION',
        options: {
          type: 'basic',
          iconUrl: 'resources/18dp.png',
          title: 'undercov',
          message: 'Redirecting to authenticate for coverage...'
        }
      })
      const authUrl = authUrlTemplate.replace(/\$1/g, `${window.location.href}&undercov=1`)
      window.location.replace(authUrl)
    } else {
      chrome.runtime.sendMessage({
        action: 'REQUEST_NOTIFICATION',
        options: {
          type: 'basic',
          iconUrl: 'resources/18dp.png',
          title: 'undercov',
          message: 'Failed to auth for coverage in repo. Remove auth URL from undercov options to prevent autoreload.',
          requireInteraction: true
        }
      })
    }
  }

  private range(start: number, end: number): number[] {
    return Array.from(Array(end - start + 1)).map((_, i) => start + i)
  }

  private zip(a: [any], b: [any]): any[] {
    return a.map((val, i) => [val, b[i]])
  }

  private convertJsonFileCoverage(coverage: any): Object {
    // Grab each statement location and the number of hits
    const statements = Object.keys(coverage['statementMap'])
      .map(i => [coverage['statementMap'][i], coverage['s'][i]])

    // Grab each function location and the number of hits
    const fns = Object.keys(coverage['fnMap'])
      .map(i => [coverage['fnMap'][i].loc, coverage['f'][i]])

    let [statementsHit, totalStatements] = [0, 0]

    // Calculate hit count for each line that is part of a statement or fn
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

    // Find lines with partial coverage
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

    // Calculate basic stats for filetree coverage overlay
    res['statementCoverage'] = statementsHit / totalStatements * 100.0
    res['branchCoverage'] = branchesHit / totalBranches * 100.0
    res['overallCoverage'] = (statementsHit + branchesHit) / (totalStatements + totalBranches) * 100.0
    return res
  }

  // Define converters from different file formats into our expected results model:
  //
  // {
  //   "filename1" => {
  //     1 => 5,  // hit
  //     2 => 0,  // not hit
  //     5 => -1, // partial hit
  //     ...
  //     "statementCoverage" => 96.1,
  //     "branchCoverage"" => 95.2,
  //     "overallCoverage" => 95.89
  //   },
  //   "filename2" => {
  //     ...
  //   },
  //   ...
  // }
  protected converters: { [key: string]: (coverage: any) => JSON; } = {
    'json': (coverage: any) => {
      const res: JSON = JSON.parse('{}')

      for (const filename in coverage) {
        if (coverage[filename]['statementMap']) {
          res[filename] = this.convertJsonFileCoverage(coverage[filename])
        } else {
          this.log('::convert json - no statement map', filename)
        }
      }
      return res
    },
    'cobertura': (coverage: any) => {
      const res: JSON = JSON.parse('{}')

      const coveragee = $(coverage).find('coverage')
      res['branchCoverage'] = parseFloat(coveragee.attr('branch-rate')!) * 100
      res['lineCoverage'] = parseFloat(coveragee.attr('line-rate')!) * 100
      res['overallCoverage'] =
        (parseInt(coveragee.attr('lines-covered')!) +
          parseInt(coveragee.attr('branches-covered')!)) /
        (parseInt(coveragee.attr('lines-valid')!) +
          parseInt(coveragee.attr('branches-valid')!))

      for (const pkg of coveragee.find('packages').find('package')) {
        const $pkg = $(pkg)
        res[$pkg.attr('name')!] = {
          lineCoverage: parseFloat($pkg.attr('line-rate')!) * 100,
          branchCoverage: parseFloat($pkg.attr('branch-rate')!) * 100
        }

        const fileClasses = {}
        for (const klass of $pkg.find('classes').find('class')) {
          const $klass = $(klass)
          const filename = $klass.attr('filename')!
          if (!fileClasses[filename]) {
            fileClasses[filename] = []
          }
          fileClasses[filename].push($klass)
        }

        for (const filename of Object.keys(fileClasses)) {
          let [linesHit, totalLines] = [0, 0]
          let [branchesHit, totalBranches] = [0, 0]

          const klasses = fileClasses[filename]
          console.log(filename)
          for (const klass of klasses) {
            for (const line of klass.find('lines').find('line')) {
              const $line = $(line)
              const linee = $line.attr('number')
              const hits = parseInt($line.attr('hits')!)
              let partial = false

              // todo: fix branch counts
              if ($line.attr('branch') === 'true') {
                totalBranches += 1
                const conditionCoverage = $line.attr('condition-coverage')!
                const [nbranchesHit, nbranches] = conditionCoverage.match(/\((.*)\)$/)![1].split('/').map(x => parseInt(x))
                if (nbranchesHit !== nbranches && hits > 0) {
                  partial = true
                }
                branchesHit += nbranchesHit
                totalBranches += nbranches
              }

              if (!res[filename]) {
                res[filename] = {}
              }

              totalLines += 1
              if (hits > 0) {
                linesHit += 1
              }
              res[filename][linee!] = partial ? -1 : hits
            }

            console.log(filename, linesHit, totalLines, branchesHit, totalBranches)
            // Calculate basic stats for filetree coverage overlay
            res[filename]['statementCoverage'] = linesHit / totalLines * 100.0
            res[filename]['branchCoverage'] = branchesHit / totalBranches * 100.0
            res[filename]['overallCoverage'] = (linesHit + branchesHit) / (totalLines + totalBranches) * 100.0
          }
        }
      }
      return res
    }
  }

  /**
   * Read coverage from memory or retrieve it from the configured server.
   * The internal memory is reset after every page load (real page load, not Github pjax change.)
   */
  private readCoverageObservable(id: string): Observable<JSON> {
    const stored = this.coverage[id]
    if (stored) {
      return Observable.of(stored)
    }

    return this.retrieveCoverageObservable(id)
      .map(coverage => {
        if (!coverage) {
          return coverage
        }

        const repoOptions = this.preferences.repos.find((repo) => repo.repoName === this.repoName)
        return this.converters[repoOptions!.filetype](coverage)
      })
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
      this.visualizeOverlay(this.coverage[id])
    }

    this.readCoverageObservable(id).finally(() => {
      this.invalidating = false
    }).subscribe(visualize(id))
  }
}
