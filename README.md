# HTTP router like Express Router

Express-Lib is an HTTP router than implements basic HTTP Verb `POST`, `GET`, `DELETE` and `PUT`

## Usage

#### Initialise

```javascript
const { Router } = require('./lib');

const router = Router();

rotuer.use((req, res) => req.user = 'userId')

router.post('/path', (req, res) => res.send('Made a Post Request'));
router.get('/path', (req, res) => res.send('Made a GET Request'));
router.put('/path', (req, res) => res.send('Made a PUT Request'));
router.delete('/path', (req, res) => res.send('Made a PUT Request'));
```

### Improvements

- Introduce next function