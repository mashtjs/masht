import { Handle, Options } from './types'
import { NoLeadingSlashError } from './errors'
import { Node } from './tree'

export default class Router {
  private routes = new Map<string, Node>()

  private readonly opts: Options = {
    redirectTrailingSlash: true,
    redirectFixedPath: true,
    handleMethodNotAllowed: true,
    handleOPTIONS: true
  }

  constructor (opts?: Options) {
    if (opts !== void 0) {
      this.opts = {
        ...this.opts,
        ...opts
      }
    }
  }

  on (method: string, path: string, handle: Handle) {
    if (path[0] !== '/') {
      throw new NoLeadingSlashError()
    }

    if (!this.routes.has(method)) {
      this.routes.set(method, new Node())
    }

    const node = this.routes.get(method) as Node

    node.addRoute(path, handle)

    return this
  }

  // Lookup allows the manual lookup of a method + path combo.
  // This is e.g. useful to build a framework around this router.
  // If the path was found, it returns the handle function and the path parameter
  // values. Otherwise the third return value indicates whether a redirection to
  // the same path with an extra / without the trailing slash should be performed.
  lookup (method: string, path: string) {
    if (this.routes.has(method)) {
      const root = this.routes.get(method) as Node
      return root.getValue(path)
    }
  }

}