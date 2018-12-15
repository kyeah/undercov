import { IStorageObject } from '../../storageObject'
import { ChromeStorage } from './chromeStorage'

/**
 * Controller for the options page.
 */
class Options {
  private static storage: ChromeStorage = new ChromeStorage()

  constructor() {
    this.restoreState()
    this.bindBehaviors()
  }

  private restoreState(): void {
    Options.storage.loadOption((value: IStorageObject) => {
      (<HTMLInputElement>document.getElementById('overlay')).checked = value.overlayEnabled;
      (<HTMLInputElement>document.getElementById('debug')).checked = value.debugEnabled;
      (<HTMLInputElement>document.getElementById('filetree')).checked = value.filetreeCoverageEnabled

      const repos = value.repos || []
      for (const repo of repos) {
        this.createRepoElement(
          this,
          repo.repoName,
          repo.branchUrlTemplate,
          repo.prUrlTemplate,
          repo.pathPrefix,
          repo.githubPathPrefix,
          repo.authUrlTemplate,
          repo.filetype
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
    const filetreeCoverageEnabled = (<HTMLInputElement>document.getElementById('filetree')).checked
    const reposElement = (<HTMLInputElement>document.getElementById('repos')).children

    const repos = []

    for (const repo of reposElement) {
      repos.push({
        repoName: (<HTMLInputElement>repo.querySelector('#repo-name')).value,
        branchUrlTemplate: (<HTMLInputElement>repo.querySelector('#branch')).value,
        prUrlTemplate: (<HTMLInputElement>repo.querySelector('#pr')).value,
        pathPrefix: (<HTMLInputElement>repo.querySelector('#path-prefix')).value,
        githubPathPrefix: (<HTMLInputElement>repo.querySelector('#github-path-prefix')).value,
        authUrlTemplate: (<HTMLInputElement>repo.querySelector('#auth')).value,
        filetype: (<HTMLSelectElement>repo.querySelector('#filetype')).selectedOptions[0].value
      })
    }

    Options.storage.saveOption(
      overlayEnabled,
      debugEnabled,
      filetreeCoverageEnabled,
      repos,
      () => {
        const status = document.getElementById('status')
        status!.textContent = 'Options saved.'
        setTimeout(() => { status!.textContent = '' }, 750)
      }
    )
  }

  // Really obnoxious repo document elements creation below
  // please forgive me and never read this

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
    pathPrefix: string = '',
    githubPathPrefix: string = '',
    authUrlTemplate: string = '',
    filetype: string = 'json'
  ) {
    const mainDiv = document.createElement('div')
    mainDiv.style.padding = '3px 10px'

    const innerDiv = document.createElement('div')
    innerDiv.style['border-left'] = '2px solid black'
    innerDiv.style.padding = '0 10px'
    innerDiv.style.margin = '10px 0'

    const removeButton = document.createElement('a')
    removeButton.id = 'remove'
    removeButton.textContent = 'remove repo'

    innerDiv.appendChild(options.branchElement(branchUrlTemplate))
    innerDiv.appendChild(document.createElement('br'))

    innerDiv.appendChild(options.prElement(prUrlTemplate))
    innerDiv.appendChild(document.createElement('br'))

    innerDiv.appendChild(options.authUrlElement(authUrlTemplate))
    innerDiv.appendChild(document.createElement('br'))

    innerDiv.appendChild(options.pathPrefixElement(pathPrefix))
    innerDiv.appendChild(document.createElement('br'))

    innerDiv.appendChild(options.githubPathPrefixElement(githubPathPrefix))
    innerDiv.appendChild(document.createElement('br'))

    innerDiv.appendChild(options.filetypeElement(filetype))

    mainDiv.appendChild(options.repoNameElement(repoName))
    mainDiv.appendChild(removeButton)
    mainDiv.appendChild(document.createElement('br'))
    mainDiv.appendChild(innerDiv)

    const parent = <HTMLInputElement>document.getElementById('repos')
    parent.appendChild(mainDiv)

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
    input.style.display = 'block'

    const resizeInput = (input: HTMLInputElement) => {
      const length = Math.max(input.value.length || input.placeholder.length, 20)
      input.style.width = `${length}ch`
    }

    input.addEventListener('input', function() { resizeInput(this) })
    resizeInput(input)

    const labelElement = window.document.createElement('label')
    labelElement.textContent = label
    labelElement.style.display = 'block'

    const div = window.document.createElement('div')
    div.appendChild(labelElement)
    div.appendChild(input)
    return div
  }

  private filetypeElement(value: string): HTMLDivElement {
    const input = window.document.createElement('select')
    input.name = 'filetype'
    input.id = 'filetype'
    input.style.display = 'block'

    const filetypes = ['json', 'cobertura']
    for (const filetype of filetypes) {
      const option = window.document.createElement('option')
      option.value = filetype
      option.textContent = filetype

      if (value === filetype) {
        option.selected = true
      }

      input.appendChild(option)
    }

    const labelElement = window.document.createElement('label')
    labelElement.textContent = 'Coverage filetype'
    labelElement.style.display = 'block'

    const div = window.document.createElement('div')
    div.appendChild(labelElement)
    div.appendChild(input)
    return div
  }

  private repoNameElement(value: string): HTMLDivElement {
    return this.textElement(
      'repo-name',
      'org/repo',
      '',
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
      'Remove path prefix from coverage filenames',
      value
    )
  }

  private githubPathPrefixElement(value: string): HTMLDivElement {
    return this.textElement(
      'github-path-prefix',
      'src/main/scala/',
      'Remove path prefix from github filenames',
      value
    )
  }

  private authUrlElement(value: string): HTMLDivElement {
    return this.textElement(
      'auth',
      'https://example.com/securityRealm/commenceLogin?from=$1',
      'URL Template for authentication to the remote server (using $1 as current page href)',
      value
    )
  }
}

document.addEventListener('DOMContentLoaded', () => {
  return new Options()
})
