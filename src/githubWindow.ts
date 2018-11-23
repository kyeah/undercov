import { pageType, lineType, OverlayWindow } from './overlayWindow'
import { IStorageObject } from './storageObject'
import { ISyncStorage } from './syncStorage'

export default class GithubWindow extends OverlayWindow {
  constructor(preferences: IStorageObject, storage: ISyncStorage) {
    super(preferences, storage)
  }

  // TODO: fix this (iterate over all files in the tree, calculate covered percentage)
  // maybe i should do this calculation up front...
  private visualizeOverallCoverage(coverage: JSON): void {
    let changed: number = (<any>coverage)['coverage_change']
    let overall: number = (<any>coverage)['covered_percent']

    let changedPrefix: string = changed > 0 ? '+' : ''
    let formatString: string = `${overall.toFixed(2)}%,
                                ${changedPrefix}${changed}`

//    $('.commit-tease .right').append(`<a href="${OverlayWindow.baseUrl}/${this.commitSha}"
//      class="sha-block coveralls coveralls-removable tooltipped tooltipped-n" aria-label="Overall coverage">
//      ${formatString}%</a>`)
  }

  private toggleFileCoverageVisual(event: MouseEvent): void {
    if (event.shiftKey) {
      window.open($(this).attr('data-coveralls-url'), '_blank')
    } else if ($('.coveralls.coveralls-on:first').length === 0) {
      $('.coveralls').addClass('coveralls-on')
      $(this).addClass('selected')
    } else {
      $('.coveralls').removeClass('coveralls-on')
      $(this).removeClass('selected')
    }
  }

  private visualizeCoverage(coverage: JSON): void {
    const page = this.page

    $('.repository-content .file').each((index: number, elem: Element) => {
      let totalHits = 0
      let totalLines = 0
      let element = $(elem)

      let filePath = this.filePath ||
          element.find('.file-info>span[title]').attr('title') ||
            $('.file-info > a[title]').attr('title')

      const coverageMap = filePath && coverage && coverage[`/container/${filePath}`]
      if (!coverageMap) {
        return
      }

      if (element.find('.file-actions > .btn-group').length === 0) {
        element.find('.file-actions a:first').wrap('<div class="btn-group"></div>')
      }

      let _td = `td:eq(${this.page === pageType.blob ? 0 : 1})`

      element.find('tr:not(.js-expandable-line)').each((index: number, trElement: Element) => {
        let td = $(trElement).find(_td)

        let lineNumber: number
        try {
            lineNumber = parseInt((td.attr('data-line-number') || (<any>td.attr('id')).split[1]))

            let type = coverageMap[lineNumber]
            if (type && type > 1) {
                type = 1
            }
            if (type !== undefined && type !== lineType.irrelevant) {
                totalLines++
            }
            if (type === lineType.hit) {
                totalHits++
            }

            td
                .removeClass('coveralls-hit coveralls-missed coveralls-partial coveralls-irrelevant')
                .addClass(`coveralls coveralls-${lineType[type]}`)
        } catch (e) {
            // yolo
        }
      })

        let ratio = OverlayWindow.ratio(totalHits, totalLines)
        if (page === pageType.blob) {
          // button.text(`Coverage ${ratio}%`)
          if (this.preferences.overlayEnabled) {
            // button.trigger('click')
          }
        }
    })
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
      this.prepareOverlay()
      this.visualizeCoverage(coverage)
      break
    }
  }

  protected acquireReference(value: string[]): string {
    this.filePath = null
    const page = this.page
    this.log('::acquireReference ', 'pageType ' + pageType[page])

    let ret: string = null
    if (page === pageType.commit || page === pageType.blob || page === pageType.tree || page === pageType.pull) {
      // return the commit, branch, or pull request ID
      ret = value[6]
    } else if (page === pageType.compare) {
      // keep commit shas for now, idk
      this.baseSha = `&base=${$('.commit-id:first').text()}`
      ret = $('.commit-id:last').text()
    }

    this.log('::acquireReference : ', ret)
    return ret
  }

  protected prepareOverlay(): void {
    $('.repository-content .file').each((index: number, elem: Element) => {
      let element = $(elem)
      if (element.find('.btn.coveralls').length === 0) {
        if (element.find('.file-actions > .btn-group').length === 0) {
          element.find('.file-actions a:first')
            .wrap('<div class="btn-group"></div>')
        }

        element.find('.file-actions > .btn-group')
          .prepend('<a class="btn btn-sm coveralls disabled tooltipped tooltipped-n" ' +
          'aria-label="Requesting coverage from Coveralls" data-hotkey="c">Coverage loading...</a>')
      }
    })
  }
}
