import { IncomingHttpHeaders, IncomingMessage, RequestListener, ServerResponse } from 'http'

export interface IRequestHeaders extends IncomingHttpHeaders {}

export interface IRequest extends IncomingMessage {}

export interface IResponse extends ServerResponse {}

export interface IHandler extends RequestListener {}