import { getValue } from '../utils/object'
import { Payload } from '../utils/Payload'
import { getError, resolve } from './resolver'

/**
 * Creates a setter function for the store, automatically targeting actions or mutations
 *
 * Also supports setting of sub-properties as part of the path
 *
 * @see documentation for more detail
 *
 * @param   {Object}  store   The store object
 * @param   {string}  path    The path to the target node
 * @returns {*|Promise}       The return value from the commit() or dispatch()
 */
export function makeSetter (store, path) {
  const resolver = resolve(store, path)

  const action = resolver.get('actions')
  if (action.exists) {
    return function (value) {
      return store.dispatch(action.type, value)
    }
  }

  const mutation = resolver.get('mutations')
  if (mutation.exists) {
    return function (value) {
      return store.commit(mutation.type, mutation.path
        ? new Payload(mutation.path, value)
        : value)
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(getError(path, resolver, 'action', action, 'mutation', mutation))
  }
}

/**
 * Creates a getter function for the store, automatically targeting getters or state
 *
 * Also supports returning of sub-properties as part of the path
 *
 * @see documentation for more detail
 *
 * @param   {Object}  store   The store object
 * @param   {string}  path    The path to the target node
 * @returns {*|Function}      The state value or getter function
 */
export function makeGetter (store, path) {
  const resolver = resolve(store, path)

  const getter = resolver.get('getters')
  if (getter.exists) {
    return function (...args) {
      let value = getter.member[getter.type]
      if (getter.path) {
        value = getValue(value, getter.path)
      }
      return value instanceof Function
        ? value(...args)
        : value
    }
  }

  const state = resolver.get('state')
  if (state.exists) {
    return function () {
      return getValue(store.state, resolver.absPath)
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(getError(path, resolver, 'getter', getter, 'state', state))
  }
}
