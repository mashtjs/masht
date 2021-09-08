import { IRequestHeaders } from '~/core/types'

export class Headers {
  constructor (
    private readonly headers: IRequestHeaders
  ) {}

  get (key: string) {
    switch (key = key.toLowerCase()) {
      case 'referer':
      case 'referrer':
        return this.headers.referrer || this.headers.referer || ''
      default:
        return this.headers[key] || ''
    }
  }

  set (key: string, value: string) {
    this[key] = value
  }
}