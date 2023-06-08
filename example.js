const Router = require('./lib');

const router = Router();

router.use((req, _res) => {
  req.user = 1;
});
router.get('/master/:id/clean/:reference/:loving', (req, res) => {
  return res.status(400).json({
    success: true,
    data: req.params,
  });
});
router.post('/master/:id/:l', async (req, res) => {
  return res.status(200).json({
    success: true,
    message: req.body,
    query: req.query,
    params: req.params,
  });
});
router.post('/master', async (req, res) => {
  return res.status(200).json({
    success: true,
    message: req.body,
    query: req.query,
    params: req.params,
  });
});
router.listen(9000, () => console.info('server running'));
