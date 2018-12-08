import { pageType, lineType, OverlayWindow } from './overlayWindow'
import { IStorageObject } from './storageObject'
import { ISyncStorage } from './syncStorage'

export default class GithubWindow extends OverlayWindow {
  constructor(preferences: IStorageObject, storage: ISyncStorage) {
    super(preferences, storage)
  }

  protected checkForConfig(): void {
    for (const elem of $('.files .js-navigation-open')) {
      const href = elem.getAttribute('href')
      if (href && href.includes('blob')) {
        const split = href.split('/')
        if (split[split.length - 1].includes('undercov')) {
          this.linkToConfig(href!)
          break
        }
      }
    }
  }

  private linkToConfig(href: string): void {
    const btnGroup = $('.file-navigation > .BtnGroup')
    if (!btnGroup) {
      return
    }

    const btn = document.createElement('a')
    btn.className = 'btn btn-sm BtnGroup-item'
    btn.innerHTML = `Undercov available`
    btn.style.color = '#0366d6'

    const split = href.split('/')
    split[3] = 'raw'
    btn.href = split.join('/')

    btnGroup.prepend(btn)
  }

  private visualizeOverallCoverage(coverage: JSON): void {
    const repoOptions = this.preferences.repos.find((repo) => repo.repoName === this.repoName)
    if (!repoOptions) {
      this.log('::visualizeOverallCoverage', `no repo options for ${this.repoName}`)
      return
    }

    this.log('::visualizeOverallCoverage', 'start')
    for (const elem of $('.files > tbody > tr > .content')) {
      const element = $(elem)
      const href = element.find('a').attr('href')

      if (!href) {
        continue
      }

      const filePath = href!.split('/').slice(5).join('/')

      const coverageMap = filePath && coverage && coverage[`${repoOptions.pathPrefix}${filePath}`]

      const td = document.createElement('td')

      if (coverageMap) {
        const cov = coverageMap['overallCoverage'].toFixed(2)
        const span = document.createElement('span')
        span.textContent = `${cov}%`
        td.appendChild(span)

        if (cov >= 80) {
          td.className = 'coverage coveralls-high'
        } else if (cov >= 60) {
          td.className = 'coverage coveralls-med'
        } else {
          td.className = 'coverage coveralls-low'
        }
      }

      elem.parentNode!.insertBefore(td, elem.nextElementSibling!.nextElementSibling)
    }
  }

  private visualizeCoverage(coverage: JSON): void {
    const repoOptions = this.preferences.repos.find((repo) => repo.repoName === this.repoName)
    if (!repoOptions) {
      this.log('::visualizeCoverage', `no repo options for ${this.repoName}`)
      return
    }

    for (const elem of $('.repository-content .file')) {
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

          td
            .removeClass('coveralls-hit coveralls-missed coveralls-partial coveralls-irrelevant')
            .addClass(`coveralls coveralls-${lineType[type]}`)
        } catch (e) {
          this.log('::visualizeCoverage', 'error: ${e}')
        }
      }
    }
  }

  protected visualizeOverlay(coverage: JSON): void {
    this.log('::visualizeOverlay')
    $('.coveralls-removable').remove()

    switch (this.page) {
      case pageType.tree:
        if (this.preferences.filetreeCoverageEnabled) {
          const href = window.location.href
          let counter = 0

          const fn = () => {
            if (window.location.href !== href) {
              return
            }

            if ($('.files > tbody > tr > .coverage').length === 0) {
              this.visualizeOverallCoverage(coverage)
            }

            // the ultimate hack to get around GH's delayed page wipes/updates...
            // continuously revisualize as needed.
            counter++
            if (counter < 4) {
              setTimeout(fn, 1000)
            }
          }

          fn()
        }
        break
      case pageType.blob:
      case pageType.pull:
        this.visualizeCoverage(coverage)
        break
    }
  }

  protected acquireReference(page: pageType, value: string[]): string | void {
    this.log('::acquireReference ', 'pageType ' + pageType[page])
    this.repoName = undefined

    if (page === pageType.commit || page === pageType.blob || page === pageType.tree || page === pageType.pull) {
      // return the commit, branch, or pull request ID
      this.repoName = `${value[3]}/${value[4]}`
      this.log('::acquireReference ', value[6])
      return value[6]
    }
  }
}
