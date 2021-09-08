import { Node } from '../../../core/router/tree'

const noOp = function () {
}

describe('Add and get', () => {
  const tree = new Node()

  const routes = [
    '/hi',
    '/contact',
    '/co',
    '/c',
    '/a',
    '/ab',
    '/doc/',
    '/doc/node_faq.html',
    '/doc/node1.html',
    '/α',
    '/β'
  ]

  routes.forEach(route => {
    tree.addRoute(route, noOp)
  })


  const testData = [
    {
      route: '/a',
      found: true
    },
    {
      route: '/',
      found: false
    },
    {
      route: '/hi',
      found: true
    },
    {
      route: '/contact',
      found: true
    },
    {
      route: '/co',
      found: true
    },
    {
      route: '/con',
      found: false
    },
    {
      route: '/cona',
      found: false
    },
    {
      route: '/no',
      found: false
    },
    {
      route: '/ab',
      found: true
    },
    {
      route: '/α',
      found: true
    },
    {
      route: '/β',
      found: true
    }
  ]

  testData.forEach(data => {
    it(data.route, () => {
      const {handle} = tree.getValue(data.route)
      if (data.found) {
        expect(handle).toBeTruthy()
      } else {
        expect(handle).toBeNull()
      }
    })
  })
})

describe('Wildcard', () => {
  const tree = new Node()

  const routes = [
    '/',
    '/cmd/:tool/:sub',
    '/cmd/:tool/',
    '/src/*filepath',
    '/search/',
    '/search/:query',
    '/user_:name',
    '/user_:name/about',
    '/files/:dir/*filepath',
    '/doc/',
    '/doc/node_faq.html',
    '/doc/node1.html',
    '/info/:user/public',
    '/info/:user/project/:project'
  ]

  routes.forEach(route => {
    tree.addRoute(route, noOp)
  })

  const foundData = [
    {
      route: '/',
      params: []
    },
    {
      route: '/cmd/test/',
      params: [{key: 'tool', value: 'test'}]
    },
    {
      route: '/cmd/test/3',
      params: [{key: 'tool', value: 'test'}, {key: 'sub', value: '3'}]
    },
    {
      route: '/src/',
      params: [{key: 'filepath', value: '/'}]
    },
    {
      route: '/src/some/file.png',
      params: [{key: 'filepath', value: '/some/file.png'}]
    },
    {
      route: '/search/',
      params: []
    },
    {
      route: '/search/中文',
      params: [{key: 'query', value: '中文'}]
    },
    {
      route: '/user_noder',
      params: [{key: 'name', value: 'noder'}]
    },
    {
      route: '/user_noder/about',
      params: [{key: 'name', value: 'noder'}]
    },
    {
      route: '/files/js/inc/framework.js',
      params: [
        {key: 'dir', value: 'js'},
        {key: 'filepath', value: '/inc/framework.js'}
      ]
    },
    {
      route: '/info/gordon/public',
      params: [{key: 'user', value: 'gordon'}]
    },
    {
      route: '/info/gordon/project/node',
      params: [
        {key: 'user', value: 'gordon'},
        {key: 'project', value: 'node'}
      ]
    }
  ]

  foundData.forEach(data => {
    it(data.route, () => {
      const {handle, params} = tree.getValue(data.route)
      expect(handle).toBeTruthy()
      expect(params).toMatchObject(data.params)
    })
  })

  const noHandlerData = [
    {
      route: '/cmd/test',
      params: [{key: 'tool', value: 'test'}]
    },
    {
      route: '/search/中文/',
      params: [{key: 'query', value: '中文'}]
    }
  ]

  noHandlerData.forEach(data => {
    it(data.route, () => {
      const {handle, params} = tree.getValue(data.route)
      expect(handle).toBeNull()
      expect(params).toMatchObject(data.params)
    })
  })
})