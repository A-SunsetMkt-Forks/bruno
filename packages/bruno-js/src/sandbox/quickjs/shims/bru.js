const { cleanJson, cleanCircularJson } = require('../../../utils');
const { marshallToVm } = require('../utils');

const addBruShimToContext = (vm, bru) => {
  const bruObject = vm.newObject();
  const bruRunnerObject = vm.newObject();

  let cwd = vm.newFunction('cwd', function () {
    return marshallToVm(bru.cwd(), vm);
  });
  vm.setProp(bruObject, 'cwd', cwd);
  cwd.dispose();

  let getEnvName = vm.newFunction('getEnvName', function () {
    return marshallToVm(bru.getEnvName(), vm);
  });
  vm.setProp(bruObject, 'getEnvName', getEnvName);
  getEnvName.dispose();

  let getCollectionName = vm.newFunction('getCollectionName', function () {
    return marshallToVm(bru.getCollectionName(), vm);
  });
  vm.setProp(bruObject, 'getCollectionName', getCollectionName);
  getCollectionName.dispose();

  let getProcessEnv = vm.newFunction('getProcessEnv', function (key) {
    return marshallToVm(bru.getProcessEnv(vm.dump(key)), vm);
  });
  vm.setProp(bruObject, 'getProcessEnv', getProcessEnv);
  getProcessEnv.dispose();

  let interpolate = vm.newFunction('interpolate', function (str) {
    return marshallToVm(bru.interpolate(vm.dump(str)), vm);
  });
  vm.setProp(bruObject, 'interpolate', interpolate);
  interpolate.dispose();

  let hasEnvVar = vm.newFunction('hasEnvVar', function (key) {
    return marshallToVm(bru.hasEnvVar(vm.dump(key)), vm);
  });
  vm.setProp(bruObject, 'hasEnvVar', hasEnvVar);
  hasEnvVar.dispose();

  let getEnvVar = vm.newFunction('getEnvVar', function (key) {
    return marshallToVm(bru.getEnvVar(vm.dump(key)), vm);
  });
  vm.setProp(bruObject, 'getEnvVar', getEnvVar);
  getEnvVar.dispose();

  let setEnvVar = vm.newFunction('setEnvVar', function (key, value) {
    bru.setEnvVar(vm.dump(key), vm.dump(value));
  });
  vm.setProp(bruObject, 'setEnvVar', setEnvVar);
  setEnvVar.dispose();

  let deleteEnvVar = vm.newFunction('deleteEnvVar', function (key) {
    return marshallToVm(bru.deleteEnvVar(vm.dump(key)), vm);
  });
  vm.setProp(bruObject, 'deleteEnvVar', deleteEnvVar);
  deleteEnvVar.dispose();

  let getGlobalEnvVar = vm.newFunction('getGlobalEnvVar', function (key) {
    return marshallToVm(bru.getGlobalEnvVar(vm.dump(key)), vm);
  });
  vm.setProp(bruObject, 'getGlobalEnvVar', getGlobalEnvVar);
  getGlobalEnvVar.dispose();

  let getOauth2CredentialVar = vm.newFunction('getOauth2CredentialVar', function (key) {
    return marshallToVm(bru.getOauth2CredentialVar(vm.dump(key)), vm);
  });
  vm.setProp(bruObject, 'getOauth2CredentialVar', getOauth2CredentialVar);
  getOauth2CredentialVar.dispose();

  let setGlobalEnvVar = vm.newFunction('setGlobalEnvVar', function (key, value) {
    bru.setGlobalEnvVar(vm.dump(key), vm.dump(value));
  });
  vm.setProp(bruObject, 'setGlobalEnvVar', setGlobalEnvVar);
  setGlobalEnvVar.dispose();

  let hasVar = vm.newFunction('hasVar', function (key) {
    return marshallToVm(bru.hasVar(vm.dump(key)), vm);
  });
  vm.setProp(bruObject, 'hasVar', hasVar);
  hasVar.dispose();

  let getVar = vm.newFunction('getVar', function (key) {
    return marshallToVm(bru.getVar(vm.dump(key)), vm);
  });
  vm.setProp(bruObject, 'getVar', getVar);
  getVar.dispose();

  let setVar = vm.newFunction('setVar', function (key, value) {
    bru.setVar(vm.dump(key), vm.dump(value));
  });
  vm.setProp(bruObject, 'setVar', setVar);
  setVar.dispose();

  let deleteVar = vm.newFunction('deleteVar', function (key) {
    bru.deleteVar(vm.dump(key));
  });
  vm.setProp(bruObject, 'deleteVar', deleteVar);
  deleteVar.dispose();

  let deleteAllVars = vm.newFunction('deleteAllVars', function () {
    bru.deleteAllVars();
  });
  vm.setProp(bruObject, 'deleteAllVars', deleteAllVars);
  deleteAllVars.dispose();

  let setNextRequest = vm.newFunction('setNextRequest', function (nextRequest) {
    bru.setNextRequest(vm.dump(nextRequest));
  });
  vm.setProp(bruObject, 'setNextRequest', setNextRequest);
  setNextRequest.dispose();

  let runnerSkipRequest = vm.newFunction('skipRequest', function () {
    bru?.runner?.skipRequest();
  });
  vm.setProp(bruRunnerObject, 'skipRequest', runnerSkipRequest);
  runnerSkipRequest.dispose();

  let runnerStopExecution = vm.newFunction('stopExecution', function () {
    bru?.runner?.stopExecution();
  });
  vm.setProp(bruRunnerObject, 'stopExecution', runnerStopExecution);
  runnerStopExecution.dispose();

  let runnerSetNextRequest = vm.newFunction('setNextRequest', function (nextRequest) {
    bru?.runner?.setNextRequest(vm.dump(nextRequest));
  });
  vm.setProp(bruRunnerObject, 'setNextRequest', runnerSetNextRequest);
  runnerSetNextRequest.dispose();

  let visualize = vm.newFunction('visualize', function (htmlString) {
    bru.visualize(vm.dump(htmlString));
  });
  vm.setProp(bruObject, 'visualize', visualize);
  visualize.dispose();

  let getSecretVar = vm.newFunction('getSecretVar', function (key) {
    return marshallToVm(bru.getSecretVar(vm.dump(key)), vm);
  });
  vm.setProp(bruObject, 'getSecretVar', getSecretVar);
  getSecretVar.dispose();

  let getRequestVar = vm.newFunction('getRequestVar', function (key) {
    return marshallToVm(bru.getRequestVar(vm.dump(key)), vm);
  });
  vm.setProp(bruObject, 'getRequestVar', getRequestVar);
  getRequestVar.dispose();

  let getFolderVar = vm.newFunction('getFolderVar', function (key) {
    return marshallToVm(bru.getFolderVar(vm.dump(key)), vm);
  });
  vm.setProp(bruObject, 'getFolderVar', getFolderVar);
  getFolderVar.dispose();

  let getCollectionVar = vm.newFunction('getCollectionVar', function (key) {
    return marshallToVm(bru.getCollectionVar(vm.dump(key)), vm);
  });
  vm.setProp(bruObject, 'getCollectionVar', getCollectionVar);
  getCollectionVar.dispose();

  let getTestResults = vm.newFunction('getTestResults', () => {
    const promise = vm.newPromise();
    bru
      .getTestResults()
      .then((results) => {
        promise.resolve(marshallToVm(cleanJson(results), vm));
      })
      .catch((err) => {
        promise.resolve(
          marshallToVm(
            cleanJson({
              message: err.message
            }),
            vm
          )
        );
      });
    promise.settled.then(vm.runtime.executePendingJobs);
    return promise.handle;
  });
  getTestResults.consume((handle) => vm.setProp(bruObject, 'getTestResults', handle));

  let getAssertionResults = vm.newFunction('getAssertionResults', () => {
    const promise = vm.newPromise();
    bru
      .getAssertionResults()
      .then((results) => {
        promise.resolve(marshallToVm(cleanJson(results), vm));
      })
      .catch((err) => {
        promise.resolve(
          marshallToVm(
            cleanJson({
              message: err.message
            }),
            vm
          )
        );
      });
    promise.settled.then(vm.runtime.executePendingJobs);
    return promise.handle;
  });
  getAssertionResults.consume((handle) => vm.setProp(bruObject, 'getAssertionResults', handle));

  let runRequestHandle = vm.newFunction('runRequest', (args) => {
    const promise = vm.newPromise();
    bru
      .runRequest(vm.dump(args))
      .then((response) => {
        promise.resolve(marshallToVm(cleanCircularJson(response), vm));
      })
      .catch((err) => {
        promise.resolve(
          marshallToVm(
            cleanJson({
              message: err.message
            }),
            vm
          )
        );
      });
    promise.settled.then(vm.runtime.executePendingJobs);
    return promise.handle;
  });
  runRequestHandle.consume((handle) => vm.setProp(bruObject, 'runRequest', handle));

  let sendRequestHandle = vm.newFunction('_sendRequest', (args) => {
    const promise = vm.newPromise();
    bru
      .sendRequest(vm.dump(args))
      .then((response) => {
        promise.resolve(marshallToVm(cleanCircularJson(response), vm));
      })
      .catch((err) => {
        promise.reject(
          marshallToVm(
            cleanJson(err),
            vm
          )
        );
      });
    promise.settled.then(vm.runtime.executePendingJobs);
    return promise.handle;
  });
  sendRequestHandle.consume((handle) => vm.setProp(bruObject, '_sendRequest', handle));

  const sleep = vm.newFunction('sleep', (timer) => {
    const t = vm.getString(timer);
    const promise = vm.newPromise();
    setTimeout(() => {
      promise.resolve(vm.newString('slept'));
    }, t);
    promise.settled.then(vm.runtime.executePendingJobs);
    return promise.handle;
  });
  sleep.consume((handle) => vm.setProp(bruObject, 'sleep', handle));

  vm.setProp(bruObject, 'runner', bruRunnerObject);
  vm.setProp(vm.global, 'bru', bruObject);
  bruObject.dispose();

  vm.evalCode(`
    globalThis.bru.sendRequest = async (requestConfig, callback) => {
      if (!callback) return await globalThis.bru._sendRequest(requestConfig);
      try {
        const response = await globalThis.bru._sendRequest(requestConfig);
        try {
          await callback(null, response);
        }
        catch(error) {
          return Promise.reject(error);
        }
      }
      catch(error) {
        try {
          await callback(JSON.parse(JSON.stringify(error)), null);
        }
        catch(err) {
          return Promise.reject(err);
        }
      }
    }
  `);
};

module.exports = addBruShimToContext;
