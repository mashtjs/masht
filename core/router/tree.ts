import { Handle, INode, nodeType } from './types'
import {
  CatchallConflictError,
  EmptyNameWildcardError,
  HandleAlreadyRegisteredError,
  InvalidCatchallPositionError,
  MultipleWildcardInSegmentError,
  SlashBeforeCatchallError,
  WildcardChildConflictError,
  WildcardConflictError
} from './errors'
import * as stream from 'stream'

const SLASH_CHAR_CODE = String('/').charCodeAt(0)

function longestCommonPrefix (a: string, b: string) {
  const lenA = a.length
  const lenB = b.length
  const max = lenA <= lenB ? lenA : lenB
  let i = 0

  for (; i < max && a[i] === b[i]; i++) {}

  return i
}

function findWildcard (path: string): { wildcard: string, i: number, valid: boolean } {
  // Find start
  for (let start = 0; start < path.length; start++) {
    let c = path[start]

    if (c !== ':' && c !== '*') {
      continue
    }

    // Find end and check for invalid characters
    let valid = true
    const rem = path.slice(start + 1)
    for (let end = 0; end < rem.length; end++) {
      c = rem[end]

      switch (c) {
        case '/':
          return {
            wildcard: path.slice(start, start + 1 + end),
            i: start,
            valid
          }
        case ':':
        case '*':
          valid = false
      }
    }

    return {
      wildcard: path.slice(start),
      i: start,
      valid
    }
  }

  return {
    wildcard: '',
    i: -1,
    valid: false
  }
}

function countParams (path: string) {
  let n = 0
  for (let i = 0; i < path.length; i++) {
    switch (path[i]) {
      case ':':
      case '*':
        n++
    }
  }

  return n
}

export class Node implements INode {
  constructor (
    public path = '',
    public wildChild = false,
    public nType: nodeType = nodeType.STATIC,
    public indices = '',
    public children: Node[] = [],
    public handle: INode['handle'] = null,
    public priority = 0
  ) {}

  incrementChildPrio(pos: number): number {
    let cs = this.children
    cs[pos].priority++
    let prio = cs[pos].priority

    // Adjust position (move to front)
    let newPos = pos
    for (; newPos > 0 && cs[newPos - 1].priority < prio; newPos--) {
      // Swap node positions
      const temp = cs[newPos]
      cs[newPos] = cs[newPos - 1]
      cs[newPos - 1] = temp
    }

    // Build new index char string
    if (newPos !== pos) {
      this.indices = this.indices.slice(0, newPos) + // Unchanged prefix, might be empty
        this.indices[pos] + // The index char we move
        this.indices.slice(newPos, pos) + this.indices.slice(pos + 1) // Rest without char at 'pos'
    }

    return newPos
  }

  addRoute (path: string, handle: Handle) {
    let fullPath = path
    this.priority++

    if (this.path === '' && this.indices === '') {
      this.insertChild(path, fullPath, handle)
      this.nType = nodeType.ROOT
      return
    }

    let n: Node = this

    walk: while (true) {
      // Find the longest common prefix.
      // This also implies that the common prefix contains no ':' or '*'
      // since the existing key can't contain those chars.
      let i = longestCommonPrefix(path, n.path)

      // Split edge
      if (i < n.path.length) {
        const child = new Node(
          n.path.slice(i),
          n.wildChild,
          nodeType.STATIC,
          n.indices,
          n.children,
          n.handle,
          n.priority - 1
        )

        n.children = [child]
        n.indices = n.path[i]
        n.path = path.slice(0, i)
        n.handle = null
        n.wildChild = false
      }

      // Make new node a child of this node
      if (i < path.length) {
        path = path.slice(i)

        if (n.wildChild) {
          n = n.children[0]
          n.priority++

          // Check if the wildcard matches
          if (
            path.length >= n.path.length &&
            n.path === path.slice(0, n.path.length) &&
            // Adding a child to a catchAll is not possible
            n.nType !== nodeType.CATCH_ALL &&
            // Check for longer wildcard, e.g. :name and :names
            (n.path.length >= path.length || path[n.path.length] === '/')
          ) {
            continue walk
          } else {
            // Wildcard conflict
            let pathSeg = path

            if (n.nType !== nodeType.CATCH_ALL) {
              pathSeg = path.split('/')[0]
            }

            const prefix = fullPath.slice(0, fullPath.indexOf(pathSeg)) + n.path

            throw new WildcardConflictError(pathSeg, fullPath, n.path, prefix)
          }
        }

        const idxc = path[0]

        // '/' after param
        if (n.nType === nodeType.PARAM && idxc === '/' && n.children.length === 1) {
          n = n.children[0]
          n.priority++
          continue walk
        }

        // Check if a child with the next path byte exists
        for (let i = 0; i < n.indices.length; i++) {
          const c = n.indices[i]

          if (c === idxc) {
            i = n.incrementChildPrio(i)
            n = n.children[i]
            continue walk
          }
        }

        // Otherwise insert it
        if (idxc !== ':' && idxc !== '*') {
          n.indices += idxc
          const child = new Node()
          n.children.push(child)
          n.incrementChildPrio(n.indices.length - 1)
          n = child
        }
        n.insertChild(path, fullPath, handle)
        return
      }

      // Otherwise add handle to current node
      if (n.handle !== null) {
        throw new HandleAlreadyRegisteredError(fullPath)
      }
      n.handle = handle
      return
    }
  }

  insertChild(path: string, fullPath: string, handle: Handle) {
    let n: INode = this

    while (true) {
      // Find prefix until first wildcard
      let { wildcard, i, valid } = findWildcard(path)

      if (i < 0) {
        // No wildcard found
        break
      }

      // The wildcard name must not contain ':' and '*'
      if (!valid) {
        throw new MultipleWildcardInSegmentError(wildcard, fullPath)
      }

      // Check if the wildcard has a name
      if (wildcard.length < 2) {
        throw new EmptyNameWildcardError(fullPath)
      }

      // Check if this node has existing children which would be
      // unreachable if we insert the wildcard here
      if (n.children.length > 0) {
        throw new WildcardChildConflictError(wildcard, fullPath)
      }

      // param
      if (wildcard[0] === ':') {
        if (i > 0) {
          // Insert prefix before the current wildcard
          n.path = path.slice(0, i)
          path = path.slice(i)
        }

        n.wildChild = true
        const child = new Node(wildcard, false, nodeType.PARAM)
        n.children = [child]
        n = child
        n.priority++

        // If the path doesn't end with the wildcard, then there
        // will be another non-wildcard subpath starting with '/'
        if (wildcard.length < path.length) {
          path = path.slice(wildcard.length)
          const child = new Node(
            '',
            false,
            nodeType.STATIC,
            '',
            [],
            null,
            1
          )
          n.children = [child]
          n = child
          continue
        }

        // Otherwise we're done. Insert the handle in the new leaf
        n.handle = handle
        return
      }

      // catchAll
      if  (i + wildcard.length !== path.length) {
        throw new InvalidCatchallPositionError(fullPath)
      }

      if (n.path.length > 0 && n.path[n.path.length - 1] === '/') {
        throw new CatchallConflictError(fullPath)
      }

      // Currently fixed width 1 for '/'
      i--
      if (path[i] !== '/') {
        throw new SlashBeforeCatchallError(fullPath)
      }

      n.path = path.slice(0, i)

      // First node: catchAll node with empty path
      let child = new Node('', true, nodeType.CATCH_ALL)
      n.children = [child]
      n.indices = '/'
      n = child
      n.priority++

      // Second node: node holding the variable
      child = new Node(
        path.slice(i),
        false,
        nodeType.CATCH_ALL,
        '',
        [],
        handle,
        1
      )
      n.children = [child]

      return
    }

    // If no wildcard was found, simply insert the path and handle
    n.path = path
    n.handle = handle
  }

  getValue (path: string) {
    let handle: Handle | null = null
    const params: Record<string, string>[] = []
    let n: Node = this

    walk: while (true) {
      let prefix = n.path
      if (path.length > prefix.length) {
        if (path.slice(0, n.path.length) === prefix) {
          path = path.slice(n.path.length)

          // If this node does not have a wildcard child,
          // we can just look up the next child node and continue
          // to walk down the tree
          if (!n.wildChild) {
            const idxc = path.charCodeAt(0);
            for (let i = 0; i < n.indices.length; i++) {
              const c = n.indices.charCodeAt(i)
              if (c === idxc) {
                n = n.children[i]
                continue walk
              }
            }

            // Nothing found.
            // We can recommend to redirect to the same URL without a
            // trailing slash if a leaf exists for that path.
            return {
              handle,
              params,
              tsr: (path === "/" && n.handle != null)
            }
          }

          // Handle wildcard child
          n = n.children[0];
          switch (n.nType) {
            case nodeType.PARAM:
              // Find param end (either '/' or path end)
              let end: number
              for (
                end = 0;
                end < path.length && path.charCodeAt(end) !== SLASH_CHAR_CODE;
                end++
               ) {}

              // Save param value
              params.push({
                key: n.path.slice(1),
                value: path.slice(0, end)
              })

              // We need to go deeper!
              if (end < path.length) {
                if (n.children.length > 0) {
                  path = path.slice(end)
                  n = n.children[0]
                  continue walk
                }

                // ... but we can't
                return {
                  handle,
                  params,
                  tsr: (path.length === end + 1)
                }
              }

              handle = n.handle

              let tsr = false

              if (handle != null) {
                return { handle, params, tsr }
              } else if (n.children.length === 1) {
                // No handle found. Check if a handle for this path + a
                // trailing slash exists for TSR recommendation
                n = n.children[0]
                tsr = (n.path == '/' && n.handle != null) || (n.path === '' && n.indices === '/')
              }

              return { handle, params, tsr }
            case nodeType.CATCH_ALL:
              params.push({ key: n.path.slice(2), value: path })

              handle = n.handle
              return { handle, params, tsr: false }

            default:
              throw new Error('invalid node type')
          }
        }
      } else if (path === prefix) {
        handle = n.handle

        // We should have reached the node containing the handle.
        // Check if this node has a handle registered.
        if (handle != null) {
          return {
            handle,
            params,
            tsr: false
          }
        }

        // If there is no handle for this route, but this route has a
        // wildcard child, there must be a handle for this path with an
        // additional trailing slash
        if (path === '/' && n.wildChild && n.nType !== nodeType.ROOT) {
          return {
            handle,
            params,
            tsr: true
          }
        }

        // No handle found. Check if a handle for this path + a
        // trailing slash exists for trailing slash recommendation
        for (let i = 0; i < n.indices.length; i++) {
          const c = n.indices.charCodeAt(i)
          if (c === SLASH_CHAR_CODE) {
            n = n.children[i]
            const tsr = (
              n.path.length === 1 &&
              n.handle != null
              ) || (
                n.nType === nodeType.CATCH_ALL &&
                n.children[0].handle != null
              )

            return {
              handle,
              params,
              tsr
            }
          }
        }
        return {
          handle,
          params,
          tsr: false
        }
      }

      // Nothing found. We can recommend to redirect to the same URL with an
      // extra trailing slash if a leaf exists for that path
      const tsr = (
        path === '/'
        ) ||
        (
          prefix.length === path.length + 1 &&
          prefix[path.length] === '/' &&
          path === prefix.slice(0, prefix.length -1) &&
          n.handle != null
        )

      return { handle, params, tsr }
    }
  }
 
  // end of class
}