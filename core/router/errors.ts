export class NoLeadingSlashError extends Error {
  message = 'path must start with \'/\''
}

export class WildcardConflictError extends Error {
  constructor (
    pathSeg: string,
    fullPath: string,
    path: string,
    prefix: string
  ) {
    super(
      `'${pathSeg}' in new path '${fullPath}'` +
      `conflicts with existing wildcard '${path}'` +
      ` in existing prefix '${prefix}'`
    );
  }
}

export class HandleAlreadyRegisteredError extends Error {
  constructor (fullPath: string) {
    super(`a handle is already registered for path '${fullPath}'`)
  }
}

export class MultipleWildcardInSegmentError extends Error {
  constructor (wildcard: string, fullPath: string) {
    super(
      `only one wildcard per path segment is allowed,` +
      `has: '${wildcard}' in path '${fullPath}'`
    )
  }
}

export class EmptyNameWildcardError extends Error {
  constructor (fullPath: string) {
    super(
      `wildcards must be named with a non-empty name in path '${fullPath}'`
    )
  }
}

export class WildcardChildConflictError extends Error {
  constructor (wildcard: string, fullPath: string) {
    super(
      `wildcard segment '${wildcard}' conflicts with existing children in path '${fullPath}'`
    )
  }
}

export class InvalidCatchallPositionError extends Error {
  constructor (fullPath: string) {
    super(`catch-all routes are only allowed at the end of the path in path '${fullPath}'`)
  }
}

export class CatchallConflictError extends Error {
  constructor (fullPath: string) {
    super(`catch-all conflicts with existing handle for the path segment root in path '${fullPath}'`)
  }
}

export class SlashBeforeCatchallError extends Error {
  constructor (fullPath: string) {
    super(`no / before catch-all in path '${fullPath}'`)
  }
}