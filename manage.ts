import Server from './core/server/server'
import Request from './core/server/request'

if (require.main === module) {
  const server = new Server(
    (req, res) => {
      console.log(req.url)
      console.log(new Request(req))
    }, {
      port: 8000
    }
  )

  server.start()
}