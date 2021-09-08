import Router from './core/router/router'

if (require.main === module) {
  const router = new Router()

  router.on('get', '/foo/bar/:ker', () => {})

  const found = router.lookup('get', '/foo/bar/alex')

  console.log(found)
}