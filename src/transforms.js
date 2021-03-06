var _ = require('./utility');

function itemToPayload(item, options, callback) {
  var payloadOptions = options.payload || {};
  if (payloadOptions.body) {
    delete payloadOptions.body;
  }

  var data = _.extend(true, {}, item.data, payloadOptions);
  if (item._isUncaught) {
    data._isUncaught = true;
  }
  if (item._originalArgs) {
    data._originalArgs = item._originalArgs;
  }
  callback(null, data);
}

function addTelemetryData(item, options, callback) {
  if (item.telemetryEvents) {
    _.set(item, 'data.body.telemetry', item.telemetryEvents);
  }
  callback(null, item);
}

function addMessageWithError(item, options, callback) {
  if (!item.message) {
    callback(null, item);
    return;
  }
  var tracePath = 'data.body.trace_chain.0';
  var trace = _.get(item, tracePath);
  if (!trace) {
    tracePath = 'data.body.trace';
    trace = _.get(item, tracePath);
  }
  if (trace) {
    if (!(trace.exception && trace.exception.description)) {
      _.set(item, tracePath+'.exception.description', item.message);
      callback(null, item);
      return;
    }
    var extra = _.get(item, tracePath+'.extra') || {};
    var newExtra =  _.extend(true, {}, extra, {message: item.message});
    _.set(item, tracePath+'.extra', newExtra);
  }
  callback(null, item);
}

function userTransform(logger) {
  return function(item, options, callback) {
    var newItem = _.extend(true, {}, item);
    try {
      if (_.isFunction(options.transform)) {
        options.transform(newItem.data);
      }
    } catch (e) {
      options.transform = null;
      logger.error('Error while calling custom transform() function. Removing custom transform().', e);
      callback(null, item);
      return;
    }
    callback(null, newItem);
  }
}

module.exports = {
  itemToPayload: itemToPayload,
  addTelemetryData: addTelemetryData,
  addMessageWithError: addMessageWithError,
  userTransform: userTransform
};
