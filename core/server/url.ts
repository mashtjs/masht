import { parse, UrlWithStringQuery } from 'url'
import { IRequest } from '~/core/types'

export default class Url {
  href: string | null = null
  auth: string | null = null
  hash: string | null = null
  host: string | null = null
  hostname: string | null = null
  path: string | null = null
  pathname: string | null = null
  protocol: string | null = null
  slashes: boolean | null = null
  port: string | null = null
  search: string | null = null
  query: string | null = null

  private constructor (
    str: string
  ) {
    if (str.charCodeAt(0) !== 47 /* / */) {
      return Object.assign(this, parse(str))
    }

    this.pathname = str

    // This takes the regexp from https://github.com/joyent/node/pull/7878
    // Which is /^(\/[^?#\s]*)(\?[^#\s]*)?$/
    // And unrolls it into a for loop
    for (let i = 1; i < str.length; i++) {
      switch (str.charCodeAt(i)) {
        case 0x3f: /* ?  */
          if (this.search === null) {
            this.pathname = str.substring(0, i)
            this.query = str.substring(i + 1)
            this.search = str.substring(i)
          }
          break
        case 0x09: /* \t */
        case 0x0a: /* \n */
        case 0x0c: /* \f */
        case 0x0d: /* \r */
        case 0x20: /*    */
        case 0x23: /* #  */
        case 0xa0:
        case 0xfeff:
          return parse(str)
      }
    }

    this.path = str
    this.href = str
  }

  static parse (req: IRequest) {
    const url = req.url

    if (url === void 0) return void 0

    return new this(url)
  }
}
