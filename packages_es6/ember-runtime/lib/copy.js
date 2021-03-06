import EnumerableUtils from "ember-metal/enumerable_utils";
import {typeOf} from "ember-metal/utils";
import EmberObject from "ember-runtime/system/object";
import Copyable from "ember-runtime/mixins/copyable";
import {create} from "ember-metal/platform";

var indexOf = EnumerableUtils.indexOf;

function _copy(obj, deep, seen, copies) {
  var ret, loc, key;

  // primitive data types are immutable, just return them.
  if ('object' !== typeof obj || obj===null) return obj;

  // avoid cyclical loops
  if (deep && (loc=indexOf(seen, obj))>=0) return copies[loc];

  Ember.assert('Cannot clone an Ember.Object that does not implement Ember.Copyable', !(obj instanceof EmberObject) || (Copyable && Copyable.detect(obj)));

  // IMPORTANT: this specific test will detect a native array only. Any other
  // object will need to implement Copyable.
  if (typeOf(obj) === 'array') {
    ret = obj.slice();
    if (deep) {
      loc = ret.length;
      while(--loc>=0) ret[loc] = _copy(ret[loc], deep, seen, copies);
    }
  } else if (Copyable && Copyable.detect(obj)) {
    ret = obj.copy(deep, seen, copies);
  } else {
    ret = {};
    for(key in obj) {
      if (!obj.hasOwnProperty(key)) continue;

      // Prevents browsers that don't respect non-enumerability from
      // copying internal Ember properties
      if (key.substring(0,2) === '__') continue;

      ret[key] = deep ? _copy(obj[key], deep, seen, copies) : obj[key];
    }
  }

  if (deep) {
    seen.push(obj);
    copies.push(ret);
  }

  return ret;
}

/**
  Creates a clone of the passed object. This function can take just about
  any type of object and create a clone of it, including primitive values
  (which are not actually cloned because they are immutable).

  If the passed object implements the `clone()` method, then this function
  will simply call that method and return the result.

  @method copy
  @for Ember
  @param {Object} obj The object to clone
  @param {Boolean} deep If true, a deep copy of the object is made
  @return {Object} The cloned object
*/
function copy(obj, deep) {
  // fast paths
  if ('object' !== typeof obj || obj===null) return obj; // can't copy primitives
  if (Copyable && Copyable.detect(obj)) return obj.copy(deep);
  return _copy(obj, deep, deep ? [] : null, deep ? [] : null);
};

export default copy;
