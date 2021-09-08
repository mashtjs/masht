import { IRequest } from '~/core/types'
import { Headers } from './headers'
import Url from './url'

export default class Request {
  constructor (
    private readonly req: IRequest
  ) {
    this.headers = new Headers(req.headers)
    this.url = Url.parse(req)
  }
  public headers: Headers

  public url: Url | undefined

  get method () {
    return this.req.method
  }

  get socket () {
    return this.req.socket
  }

  get href () {
    if (this.url === void 0 || this.req.url === void 0) return null

    if (this.url.href !== null) return this.url.href

    if (/^https?:\/\//i.test(this.req.url)) return this.req.url

    // return this.origin + this.req.url
  }

  get path () {
    return this.url?.pathname || null
  }

  get querystring () {
    return this.url?.query
  }
}