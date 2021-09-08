import { IHandler, IRequest, IResponse } from '~/core/types'

// Router types
export type Handle = () => void

export type HttpHandler = IHandler

export type PanicHandler = (req: IRequest, res: IResponse, e: Error) => void

export type Options = {
  /**
   * If enabled, adds the matched route path onto the http.Request context
   * before invoking the handler.
   * The matched route path is only added to handlers of routes that were
   * registered when this option was enabled.
   */
  saveMatchedRoutePath?: boolean

  // Enables automatic redirection if the current route can't be matched but a
  // handler for the path with (without) the trailing slash exists.
  // For example if /foo/ is requested but a route only exists for /foo, the
  // client is redirected to /foo with http status code 301 for GET requests
  // and 308 for all other request methods.
  /**
   * @default true
   */
  redirectTrailingSlash?: boolean

  // If enabled, the router tries to fix the current request path, if no
  // handle is registered for it.
  // First superfluous path elements like ../ or // are removed.
  // Afterwards the router does a case-insensitive lookup of the cleaned path.
  // If a handle can be found for this route, the router makes a redirection
  // to the corrected path with status code 301 for GET requests and 308 for
  // all other request methods.
  // For example /FOO and /..//Foo could be redirected to /foo.
  // RedirectTrailingSlash is independent of this option.
  /**
   * @default true
   */
  redirectFixedPath?: boolean

  // If enabled, the router checks if another method is allowed for the
  // current route, if the current request can not be routed.
  // If this is the case, the request is answered with 'Method Not Allowed'
  // and HTTP status code 405.
  // If no other Method is allowed, the request is delegated to the NotFound
  // handler.
  /**
   * @default true
   */
  handleMethodNotAllowed?: boolean

  // If enabled, the router automatically replies to OPTIONS requests.
  // Custom OPTIONS handlers take priority over automatic replies.
  /**
   * @default true
   */
  handleOPTIONS?: boolean

  // An optional http.Handler that is called on automatic OPTIONS requests.
  // The handler is only called if HandleOPTIONS is true and no OPTIONS
  // handler for the specific path was set.
  // The "Allowed" header is set before calling the handler.
  globalOPTIONS?: HttpHandler

  // Cached value of global (*) allowed methods
  globalAllowed?: string

  // Configurable http.Handler which is called when no matching route is
  // found. If it is not set, http.NotFound is used.
  notFound?: HttpHandler

  // Configurable http.Handler which is called when a request
  // cannot be routed and HandleMethodNotAllowed is true.
  // If it is not set, http.Error with http.StatusMethodNotAllowed is used.
  // The "Allow" header with allowed request methods is set before the handler
  // is called.
  methodNotAllowed?: HttpHandler

  // Function to handle panics recovered from http handlers.
  // It should be used to generate a error page and return the http error code
  // 500 (Internal Server Error).
  // The handler can be used to keep your server from crashing because of
  // unrecovered panics.
  panicHandler?: PanicHandler
}

// Tree types
export enum nodeType {
  STATIC,
  ROOT,
  PARAM,
  CATCH_ALL
}

export interface INode {
  path: string
  indices: string
  wildChild: boolean
  nType: nodeType
  priority: number
  children: INode[]
  handle: Handle | null
}