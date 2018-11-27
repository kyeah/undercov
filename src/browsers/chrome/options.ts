import { IStorageObject } from '../../storageObject'
import { ChromeStorage } from './chromeStorage'

class Options {
  private static storage: ChromeStorage = new ChromeStorage()

  constructor() {
    this.restoreState()
    this.bindBehaviors()
  }

  private restoreState(): void {
    Options.storage.loadOption((value: IStorageObject) => {
      (<HTMLInputElement>document.getElementById('overlay')).checked = value.overlayEnabled;
      (<HTMLInputElement>document.getElementById('debug')).checked = value.debugEnabled

      const repos = value.repos || []
      for (const repo of repos) {
        this.createRepoElement(
          this,
          repo.repoName,
          repo.branchUrlTemplate,
          repo.prUrlTemplate,
          repo.pathPrefix
        )
      }
    })
  }

  private bindBehaviors(): void {
    window.document.getElementById('add-repo')!.addEventListener('click', this.createEmptyRepoElement(this))
    window.document.getElementById('save')!.addEventListener('click', this.saveOptions)
  }

  private saveOptions(): void {
    const overlayEnabled = (<HTMLInputElement>document.getElementById('overlay')).checked
    const debugEnabled = (<HTMLInputElement>document.getElementById('debug')).checked
    const reposElement = (<HTMLInputElement>document.getElementById('repos')).children

    const repos = []

    for (const repo of reposElement) {
      repos.push({
        repoName: (<HTMLInputElement>repo.querySelector('#repo-name')).value,
        branchUrlTemplate: (<HTMLInputElement>repo.querySelector('#branch')).value,
        prUrlTemplate: (<HTMLInputElement>repo.querySelector('#pr')).value,
        pathPrefix: (<HTMLInputElement>repo.querySelector('#path-prefix')).value
      })
    }

    Options.storage.saveOption(
      overlayEnabled,
      debugEnabled,
      repos,
      () => {
        const status = document.getElementById('status')
        status!.textContent = 'Options saved.'
        setTimeout(() => { status!.textContent = '' }, 750)
      }
    )
  }

  private createEmptyRepoElement(options: Options) {
    return () => {
      this.createRepoElement(options)
    }
  }

  private createRepoElement(
    options: Options,
    repoName: string = '',
    branchUrlTemplate: string = '',
    prUrlTemplate: string = '',
    pathPrefix: string = ''
  ) {
    const div = document.createElement('div')

    const removeButton = document.createElement('button')
    removeButton.id = 'remove'
    removeButton.textContent = 'Remove'

    div.appendChild(removeButton)
    div.appendChild(document.createElement('br'))

    div.appendChild(options.repoNameElement(repoName))
    div.appendChild(document.createElement('br'))

    div.appendChild(options.branchElement(branchUrlTemplate))
    div.appendChild(document.createElement('br'))

    div.appendChild(options.prElement(prUrlTemplate))
    div.appendChild(document.createElement('br'))

    div.appendChild(options.pathPrefixElement(pathPrefix))
    div.appendChild(document.createElement('br'))

    const parent = <HTMLInputElement>document.getElementById('repos')
    parent.appendChild(div)

    removeButton.addEventListener('click', () => {
      const div = removeButton.parentNode!
      div.parentNode!.removeChild(div)
    })
  }

  private textElement(id: string, placeholder: string, label: string, value: string) {
    const input = window.document.createElement('input')
    input.type = 'text'
    input.id = id
    input.placeholder = placeholder
    input.value = value

    const labelElement = window.document.createElement('label')
    labelElement.textContent = label

    const div = window.document.createElement('div')
    div.appendChild(input)
    div.appendChild(labelElement)
    return div
  }

  private repoNameElement(value: string): HTMLDivElement {
    return this.textElement(
      'repo-name',
      'org/repo',
      'full repo name',
      value
    )
  }

  private branchElement(value: string): HTMLDivElement {
    return this.textElement(
      'branch',
      'https://example.com/artifacts/coverage/branches/$1/coverage.json',
      'URL Template for branch coverage (using $1 as branch name)',
      value
    )
  }

  private prElement(value: string): HTMLDivElement {
    return this.textElement(
      'pr',
      'https://example.com/artifacts/coverage/prs/PR-$1/coverage.json',
      'URL Template for PR coverage (using $1 as pull request ID)',
      value
    )
  }

  private pathPrefixElement(value: string): HTMLDivElement {
    return this.textElement(
      'path-prefix',
      '/container/',
      'Path prefix for coverage files',
      value
    )
  }
}

document.addEventListener('DOMContentLoaded', () => {
  return new Options()
})
