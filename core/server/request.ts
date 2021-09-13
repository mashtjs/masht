import { IRequest } from '../types'
import { Headers } from './headers'
import url from 'url'
import { ParameterCollection } from '../server/parameter-collection'

export default class Request {
  constructor (
    private readonly req: IRequest
  ) {
    this.init()
  }

  init () {
    const request = this.req

    this.headers = new Headers(request.headers)

    this.url = request.url !== void 0
      ? new url.URL(request.url)
      : void 0

    this.querystring = this.url?.searchParams.toString() || ''

    this.query = new ParameterCollection(
      this.url
        ? Object.fromEntries(this.url.searchParams.entries())
        : {}
    )
  }

  public headers: Headers

  public url: url.URL | undefined

  public querystring: string

  public query: ParameterCollection<{ [p: string]: string }>

  get method () {
    return this.req.method
  }

  get origin () {
    return
    // return `${this.protocol}://${this.host}`
  }

  get href () {
    if (this.url === void 0 || this.req.url === void 0) return null

    if (this.url.href !== null) return this.url.href

    if (/^https?:\/\//i.test(this.req.url)) return this.req.url

    return this.origin + this.req.url
  }

  get path () {
    return this.url?.pathname || null
  }
}