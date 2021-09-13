import { IRequestHeaders } from '../types'
import { ParameterCollection } from '../server/parameter-collection'

export class Headers extends ParameterCollection<IRequestHeaders> {
  constructor (
    headers: IRequestHeaders
  ) {
    super(headers)
  }

  public get (key: string, defaultValue: any = null) {
    switch (key = key.toLowerCase()) {
      case 'referer':
      case 'referrer':
        return this.params.referrer || this.params.referer || ''
      default:
        return this.params[key] || ''
    }
  }

  set (key: string, value: string) {
    this[key] = value
  }
}