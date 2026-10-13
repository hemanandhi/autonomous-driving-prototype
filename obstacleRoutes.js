const express = require('express');
const router = express.Router({ mergeParams: true });
const obstacleController = require('../controllers/obstacleController');

router.get('/', obstacleController.getObstacles);
router.post('/', obstacleController.addObstacle);
router.patch('/:obstacleId', obstacleController.updateObstacle);
router.delete('/:obstacleId', obstacleController.deleteObstacle);

module.exports = router;
