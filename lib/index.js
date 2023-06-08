const http = require('http');

const MEHTODS = {
  POST: 'POST',
  GET: 'GET',
  PUT: 'PUT',
  DELTE: 'DELETE',
  USE: 'USE',
};

const getPath = (pathname) => {
  const paths = pathname.split('/');
  if (isNaN(paths[0])) return paths.join('/');
  paths.shift();
  return paths.join('/');
};

const jsonParser = (req) =>
  new Promise((resolve, _reject) => {
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      const data = Buffer.concat(chunks);
      resolve(data.toString());
    });
  });
/**
 * @param  {http.ServerResponse} res
 * @return {http.ServerResponse, status, json }
 */
var responseParser = (res) => {
  var response = {
    ...res,
    status: function (statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    send: function (body) {
      res.writeHead(this.statusCode, { 'Content-Type': 'text/plain' });
      res.end(JSON.stringify(body));
    },
    json: function (body) {
      res.writeHead(this.statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    },
  };
  return response;
};

function Router() {
  let requestHandler = {};
  let requestMethod = {};
  return {
    /**
     * @param {string} param
     * @param  {...(req: http.IncomingMessage, res: http.ServerResponse)} callback
     */
    get: function (param, ...callback) {
      const method = MEHTODS.GET;
      requestMethod[`${param}_${method}`] = method;
      requestHandler[`${param}_${method}`] = [...callback];
    },
    /**
     * @param {string} param
     * @param  {...(req: http.IncomingMessage, res: http.ServerResponse)} callback
     */
    post: function (param, ...callback) {
      const method = MEHTODS.POST;
      requestMethod[`${param}_${method}`] = method;
      requestHandler[`${param}_${method}`] = [...callback];
    },
    put: function (param, ...callback) {
      const method = MEHTODS.PUT;
      requestMethod[`${param}_${method}`] = method;
      requestHandler[`${param}_${method}`] = [...callback];
    },
    delete: function (param, ...callback) {
      const method = MEHTODS.DELTE;
      requestMethod[`${param}_${method}`] = method;
      requestHandler[`${param}_${method}`] = [...callback];
    },
    use: function (param, ...callback) {
      if (typeof param !== 'string' && typeof param !== 'function') {
        throw new TypeError(
          'use () requires a function but got type of ',
          typeof param,
        );
      }
      if (typeof param === 'function') {
        callback.push(param);
        for (const iterator in callback) {
          if (requestHandler[`${MEHTODS.USE}_${iterator}`]) {
            const count = callback.length + 1;
            requestHandler[`${MEHTODS.USE}_${iterator}_${count}`] = [
              callback[iterator],
            ];
          } else {
            requestHandler[`${MEHTODS.USE}_${iterator}`] = [callback[iterator]];
          }
        }
      }
      if (typeof param === 'string') {
        requestHandler[`${MEHTODS.USE}_${param}`] = [...callback];
      }
    },
    listen: function (port, callback) {
      /**
       * @param {http.IncomingMessage}  req
       * @param  {http.ServerResponse} res
       */
      const requester = (req, res) => {
        const requestListeners = [];
        const url = new URL(`${req.headers.host}${req.url}`);
        const requestHanlderObject = Object.keys(requestHandler);
        req.path = getPath(url.pathname);
        req.query = {};
        req.params = {};
        const requestHanlderMethods = [];
        const response = responseParser(res);

        for (const keys of requestHanlderObject) {
          const paramURL = keys.split('_');
          if (keys.split('_').includes(req.method)) {
            requestHanlderMethods.push(keys.split('_')[1]);
            paramURL.pop();
            const pathSplit = paramURL.toString().split('/');
            pathSplit
              .filter((key) => /:/.test(key))
              .flatMap((mapKey) => {
                req.params[mapKey.replace(':', '')] =
                  req.path.split('/')[pathSplit.indexOf(mapKey) - 1];
              });
          }
        }

        if (requestHanlderMethods[0] === req.method) {
          for (const keys of Object.keys(req.params)) {
            if (req.path.includes(req.params[keys])) {
              req.path = req.path.replace(req.params[keys], `:${keys}`);
            }
          }
        }

        url.searchParams.forEach((value, key) => {
          req.query[key] = value;
        });

        const requestAddress = `/${req.path}_${req.method}`;
        const useKeys = requestHanlderObject.filter((key) => /USE/.test(key));
        for (const i of useKeys) {
          for (func of requestHandler[i]) {
            const response = responseParser(res);
            requestListeners.push(func(req, response));
          }
        }

        if (requestHandler[requestAddress]) {
          for (func of requestHandler[requestAddress]) {
            if (req.method === requestMethod[requestAddress]) {
              requestListeners.push(func(req, response));
            }
          }
        } else {
          response.status(404).send('Unknown Route');
        }

        return requestListeners;
      };
      const server = http.createServer(async (req, res) => {
        req.body = JSON.parse(await jsonParser(req));
        return [...requester(req, res)];
      });
      server.listen(port, callback);
    },
  };
}

module.exports = Router;