class NotImplementedError extends Error {
  message: string
  name: string
}

function isEmpty (object: object | null) {
  return typeof object === 'object'
    && object !== null
    && Object.getPrototypeOf(object) === null
    && Object.getOwnPropertyNames(object).length === 0
    && Object.getOwnPropertySymbols(object).length === 0
}

/**
 * @name ProxyObject
 * A ProxyObject that traps calls to undefined members
 */
abstract class ProxyObject {
  constructor () {
    return new Proxy(this, {
      get (target: ProxyObject, p: PropertyKey, receiver: any): any {
        if (Reflect.has(target, p)) {
          return Reflect.get(target, p, receiver)
        }
        return target._get(p, receiver)
      },

      set (target: ProxyObject, p: PropertyKey, value: any, receiver: any): boolean {
        return target._set(p, value, receiver)
      },

      deleteProperty (target: ProxyObject, p: string | symbol): boolean {
        return target._delete(p)
      }
    })
  }

  protected abstract _get (p: PropertyKey, receiver: any)

  protected abstract _set (p: PropertyKey, value: any, receiver: any): boolean

  protected abstract _delete (p: PropertyKey): boolean

  [key: string]: any
}

export class LazyObject<T extends object> extends ProxyObject {
  protected wrapped: T = Object.create(null)

  protected setup () {
    throw new NotImplementedError()
  }

  protected _get (p: PropertyKey, receiver: any) {
    if (isEmpty(this.wrapped)) {
      this.setup()
    }
    return Reflect.get(this.wrapped as object, p, receiver)
  }

  protected _set (p: PropertyKey, value: any, receiver: any): boolean {
    if (p === 'wrapped') {
      return Reflect.set(this, p, value, receiver)
    } else {
      if (isEmpty(this.wrapped)) {
        this.setup()
      }
      return Reflect.set(this.wrapped as object, p, value, receiver)
    }
  }

  protected _delete (p: PropertyKey): boolean {
    if (p === 'wrapped') {
      throw new TypeError('can\'t delete wrapped.')
    }
    if (isEmpty(this.wrapped)) {
      this.setup()
    }
    return Reflect.deleteProperty(this.wrapped as object, p)
  }
}