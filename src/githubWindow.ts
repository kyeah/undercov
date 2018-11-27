import { pageType, lineType, OverlayWindow } from './overlayWindow'
import { IStorageObject } from './storageObject'
import { ISyncStorage } from './syncStorage'

export default class GithubWindow extends OverlayWindow {
  constructor(preferences: IStorageObject, storage: ISyncStorage) {
    super(preferences, storage)
  }

  // TODO: fix this (iterate over all files in the tree, calculate covered percentage)
  // maybe i should do this calculation up front...
  // private visualizeOverallCoverage(coverage: JSON): void {
  //   const changed: number = (<any>coverage)['coverage_change']
  //   const overall: number = (<any>coverage)['covered_percent']

  //   const changedPrefix: string = changed > 0 ? '+' : ''
  //   const formatString: string = `${overall.toFixed(2)}%,
  //                               ${changedPrefix}${changed}`

  //   $('.commit-tease .right').append(`<a href="${OverlayWindow.baseUrl}/${this.commitSha}"
  //     class="sha-block coveralls coveralls-removable tooltipped tooltipped-n" aria-label="Overall coverage">
  //     ${formatString}%</a>`)
  // }

  private visualizeCoverage(coverage: JSON): void {
    const repoOptions = this.preferences.repos.find((repo) => repo.repoName === this.repoName)
    if (!repoOptions) {
      this.log('::visualizeCoverage', 'no repo options for ${this.repoName}')
      return
    }

    for (const elem of $('.repository-content .file')) {
      // let totalHits = 0
      // let totalLines = 0
      const element = $(elem)

      let filePath
      if (this.page === pageType.blob) {
        const split = $('a[data-hotkey=y]').attr('href')!.split('/')
        filePath = `${split.slice(5).join('/')}`
      } else {
        filePath = element.find('.file-info>span[title]').attr('title') ||
          element.find('.file-info > a[title]').attr('title')
      }
      this.log('::visualizeCoverage', filePath)

      const coverageMap = filePath && coverage && coverage[`${repoOptions.pathPrefix}${filePath}`]
      if (!coverageMap) {
        this.log('::visualizeCoverage', 'no coverage for file')
        continue
      }

      const btnGroup = element.find('.file-actions > .BtnGroup')
      const btn = document.createElement('a')
      btn.className = 'btn btn-sm BtnGroup-item'
      btn.innerHTML = `View coverage (${coverageMap['overallCoverage'].toFixed(2)}%)`

      let url: string
      if (this.page === pageType.pull) {
        url = repoOptions.prUrlTemplate.replace(/\$1/g, this.coverageID!)
      } else {
        url = repoOptions.branchUrlTemplate.replace(/\$1/g, this.coverageID!)
      }

      btn.href = `${url.replace('coverage-final.json', '')}${filePath}.html`
      btnGroup.prepend(btn)

      const _td = `td:eq(${this.page === pageType.blob ? 0 : 1})`

      for (const trElement of element.find('tr:not(.js-expandable-line)')) {
        const td = $(trElement).find(_td)

        let lineNumber: number
        try {
          lineNumber = parseInt((td.attr('data-line-number') || (<any>td.attr('id')).split[1]))

          let type = coverageMap[lineNumber]
          if (type && type > 1) {
            type = lineType.hit
          } else if (type === -1) {
            type = lineType.partial
          }
          // if (type !== undefined && type !== lineType.irrelevant) {
          //   totalLines++
          // }
          // if (type === lineType.hit) {
          //   totalHits++
          // }

          td
            .removeClass('coveralls-hit coveralls-missed coveralls-partial coveralls-irrelevant')
            .addClass(`coveralls coveralls-${lineType[type]}`)
        } catch (e) {
          this.log('::visualizeCoverage', 'error: ${e}')
        }
      }

      // const ratio = OverlayWindow.ratio(totalHits, totalLines)
      // if (page === pageType.blob) {
      //   button.text(`Coverage ${ratio}%`)
      //   if (this.preferences.overlayEnabled) {
      //     button.trigger('click')
      //   }
      // }
    }
  }

  protected visualizeOverlay(coverage: JSON): void {
    this.log('::visualizeOverlay')
    $('.coveralls-removable').remove()

    switch (this.page) {
      case pageType.tree:
        //this.visualizeOverallCoverage(coverage);
        break
      case pageType.blob:
      case pageType.pull:
        this.visualizeCoverage(coverage)
        break
    }
  }

  protected acquireReference(page: pageType, value: string[]): string | void {
    this.log('::acquireReference ', 'pageType ' + pageType[page])
    this.baseSha = undefined
    this.repoName = undefined

    if (page === pageType.commit || page === pageType.blob || page === pageType.tree || page === pageType.pull) {
      // return the commit, branch, or pull request ID
      this.repoName = `${value[3]}/${value[4]}`
      this.log('::acquireReference ', value[6])
      return value[6]
    } else if (page === pageType.compare) {
      // keep commit shas for now, idk
      this.repoName = `${value[3]}/${value[4]}`
      this.baseSha = `&base=${$('.commit-id:first').text()}`
      this.log('::acquireReference ', $('.commit-id:last').text())
      return $('.commit-id:last').text()
    }
  }
}
