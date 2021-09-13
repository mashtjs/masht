import * as http from 'http'
import * as https from 'https'
import { IHandler } from '../types'

export default class Server {
  private readonly _server: http.Server | https.Server
  private readonly _protocol: 'http' | 'https'

  constructor (
    private readonly requestListener: IHandler,
    private readonly serverOptions: {
      protocol?: 'http' | 'https'
      port?: number
    } = {}
  ) {
    this._protocol = serverOptions.protocol || 'http'

    if (this._protocol === 'https') {
      this._server = https.createServer(this.requestListener)
    } else {
      this._server = http.createServer(this.requestListener)
    }
  }

  public async start () {
    this._server.listen({
      port: this.serverOptions.port || 0
    })
  }


  public async stop () {
    this._server.close()
  }

  public get protocol () {
    return this._protocol
  }

  public get port () {
    return this.serverOptions.port
  }

  public get listening (): boolean {
    return this._server.listening
  }
}