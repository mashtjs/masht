import { LazyObject } from './functional'

const prohibited = ['get', 'set', '_get', '_set', '_delete', 'setup', 'wrapped', 'prohibited']

class Environ extends LazyObject<typeof process.env> {
  protected setup () {
    require('dotenv').config()

    this.wrapped = process.env
  }

  get (name: string) {
    if (prohibited.includes(name)) {
      throw new TypeError(`can't get ${name}`)
    }
    return this[name]
  }

  set (name: string, value: any) {
    if (prohibited.includes(name)) {
      throw new TypeError(`can't set ${name}`)
    }
    this[name] = value
  }
}

export const environ = new Environ()