/**
 * Convert Postman header array format to Bruno headers object
 * @param {Object} j - jscodeshift API
 * @param {Object} arrayValue - Array expression of key-value pair objects
 * @returns {Object} - Object expression with key-value pairs
 */
const convertArrayToObject = (j, arrayValue) => {
  const obj = j.objectExpression([]);
  
  if (arrayValue.type === 'ArrayExpression') {
    arrayValue.elements.forEach(elem => {
      if (elem.type === 'ObjectExpression') {
        const keyProp = elem.properties.find(p => (p.key.name === 'key' || p.key.value === 'key'));
        const valueProp = elem.properties.find(p => (p.key.name === 'value' || p.key.value === 'value'));

        if (keyProp && valueProp) {
          obj.properties.push(
            j.property(
              'init',
              j.literal(keyProp.value.value),
              valueProp.value
            )
          );
        }
      }
    });
  }
  
  return obj;
};

/**
 * Add or update a specific header in the request options
 * @param {Object} j - jscodeshift API
 * @param {Object} requestOptions - Request options object
 * @param {string} headerName - Header name to add/update
 * @param {string} headerValue - Header value
 */
const addOrUpdateHeader = (j, requestOptions, headerName, headerValue) => {
  let headersProp = requestOptions.properties.find(p => (p.key.name === 'headers' || p.key.value === 'headers'));

  if (!headersProp) {
    headersProp = j.property('init', j.identifier('headers'), j.objectExpression([]));
    requestOptions.properties.push(headersProp);
  } else if (headersProp.value.type !== 'ObjectExpression') {
    headersProp.value = j.objectExpression([]);
  }

  // filter out existing header with same name (case-insensitive)
  headersProp.value.properties = headersProp.value.properties.filter(p =>
    p.key.type !== 'Literal' ||
    p.key.value.toLowerCase() !== headerName.toLowerCase()
  );

  headersProp.value.properties.push(
    j.property(
      'init',
      j.literal(headerName),
      j.literal(headerValue)
    )
  );
};

/**
 * Transform headers property from array to object format
 * @param {Object} j - jscodeshift API
 * @param {Object} requestOptions - Request options object
 */
const transformHeaders = (j, requestOptions) => {
  if (requestOptions.type !== 'ObjectExpression') return;

  requestOptions.properties.forEach(prop => {
    // find and rename 'header' property to 'headers'
    if (prop.key.name === 'header' || prop.key.value === 'header') {
      prop.key.name = 'headers';
      prop.key.value = 'headers';

      // Handle array of header objects
      if (prop.value.type === 'ArrayExpression') {
        prop.value = convertArrayToObject(j, prop.value);
      }
    }
  });
};

/**
 * Transform body property based on body mode
 * @param {Object} j - jscodeshift API
 * @param {Object} requestOptions - Request options object
 * @returns {Array|null} - Array of statements if formdata is used, null otherwise
 */
const transformBody = (j, requestOptions) => {
  if (requestOptions.type !== 'ObjectExpression') return null;
  
  requestOptions.properties.forEach(prop => {
    if (prop.key.name === 'body' || prop.key.value === 'body') {
      if (prop.value.type === 'ObjectExpression') {
        const bodyProps = prop.value.properties;
        const modeProp = bodyProps.find(p => (p.key.name === 'mode' || p.key.value === 'mode'));

        if (modeProp && modeProp.value.type === 'Literal') {
          const bodyMode = modeProp.value.value;

          // Handle raw mode (text, json, xml, etc.)
          if (bodyMode === 'raw') {
            const rawProp = bodyProps.find(p => (p.key.name === 'raw' || p.key.value === 'raw'));

            if (rawProp) {
              // Replace body with data
              prop.key.name = 'data';
              prop.key.value = 'data';
              prop.value = rawProp.value;
            }
          }
          // Handle urlencoded mode
          else if (bodyMode === 'urlencoded') {
            const urlencodedProp = bodyProps.find(p => (p.key.name === 'urlencoded' || p.key.value === 'urlencoded') && p.value.type === 'ArrayExpression');

            if (urlencodedProp) {
              // Replace the body property with a 'data' property
              prop.key.name = 'data';
              prop.key.value = 'data';
              
              // Transform the urlencoded array to an object
              prop.value = convertArrayToObject(j, urlencodedProp.value);

              // Add Content-Type header for urlencoded
              addOrUpdateHeader(j, requestOptions, 'Content-Type', 'application/x-www-form-urlencoded');
            }
          }
          // Handle formdata mode
          else if (bodyMode === 'formdata') {
            const formdataProp = bodyProps.find(p => (p.key.name === 'formdata' || p.key.value === 'formdata') && p.value.type === 'ArrayExpression');

            if (formdataProp) {
                // Replace the body property with a 'data' property
                prop.key.name = 'data';
                prop.key.value = 'data';
                
                // Transform the urlencoded array to an object
                prop.value = convertArrayToObject(j, formdataProp.value);
  
                // Add Content-Type header for urlencoded
                addOrUpdateHeader(j, requestOptions, 'Content-Type', 'multipart/form-data');
            }
          }
        }
      }
    }
  });
};

/**
 * Transform callback function to Bruno format
 * @param {Object} j - jscodeshift API
 * @param {Object} callback - Callback function expression
 * @returns {Object} - Transformed callback function
 */
const transformCallback = (j, callback) => {
  if (!callback || callback.type !== 'FunctionExpression') return null;
  
  const params = callback.params;
  const callbackBody = callback.body;

  // Get the response parameter name (typically the second param)
  let responseVarName = 'response'; // Default if not found
  if (params.length >= 2 && params[1].type === 'Identifier') {
    responseVarName = params[1].name;
  }

  let errorVarName = 'error'; // Default if not found
  if (params.length >= 1 && params[0].type === 'Identifier') {
    errorVarName = params[0].name;
  }

  // Define translations for callback response properties
  const responsePropertyMap = {
    'json': 'getBody',
    'text': 'getBody',
    'code': 'getStatus()',
    'status': 'statusText',
    'responseTime': 'getResponseTime()',
    'statusText': 'statusText',
    'headers': 'getHeaders()',
  };

  // Process the callback body to transform response property references
  j(callbackBody).find(j.MemberExpression, {
    object: {
      type: 'Identifier',
      name: responseVarName
    }
  }).forEach(memberPath => {
    const property = memberPath.node.property;

    // Handle property access
    if (property.type === 'Identifier' && responsePropertyMap[property.name]) {
      const bruProperty = responsePropertyMap[property.name];

      // If it's a method call (with parentheses)
      if (bruProperty.endsWith('()')) {
        // If it's already being called (e.g., response.json())
        if (memberPath.parent.node.type === 'CallExpression' &&
          memberPath.parent.node.callee === memberPath.node) {
          // Replace with method call: res.getBody()
          j(memberPath.parent).replaceWith(
            j.callExpression(
              j.memberExpression(
                j.identifier(responseVarName),
                j.identifier(bruProperty.slice(0, -2))
              ),
              []
            )
          );
        } else {
          // Replace with method call: res.getBody()
          j(memberPath).replaceWith(
            j.callExpression(
              j.memberExpression(
                j.identifier(responseVarName),
                j.identifier(bruProperty.slice(0, -2))
              ),
              []
            )
          );
        }
      } else {
        // Replace with property access: res.statusText
        j(memberPath).replaceWith(
          j.memberExpression(
            j.identifier(responseVarName),
            j.identifier(bruProperty)
          )
        );
      }
    }
  });

  // Create the callback block
  return j.functionExpression(
    null,
    [j.identifier(errorVarName), j.identifier(responseVarName)],
    j.blockStatement(callbackBody.body)
  );
};

const sendRequestTransformer = (path, j) => {
  const callExpr = path.parent.value;
  if (callExpr.type !== 'CallExpression') return;

  // Clone the argument object for modification
  const args = [...callExpr.arguments];
  if (!args.length) return;

  const requestOptions = args[0];
  const callback = args[1];

  // transform the request config options
  if (requestOptions.type === 'ObjectExpression') {
    // Transform headers
    transformHeaders(j, requestOptions);
    // Transform body
    transformBody(j, requestOptions);
  }

  // Create the callback block and promise chain if there's a callback
  if (callback) {
    const transformedCallback = transformCallback(j, callback);
    
    // Create expression: bru.sendRequest(requestConfig, callback);
    return j.callExpression(
      j.identifier('bru.sendRequest'),
      transformedCallback ? [requestOptions, transformedCallback] : [requestOptions]
    );
  }

  // If there's no callback, just transform to bru.sendRequest
  return j.callExpression(
    j.identifier('bru.sendRequest'),
    [requestOptions]
  );
};

export default sendRequestTransformer;