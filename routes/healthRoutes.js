const express = require('express');
const { successResponse } = require('../utils/apiResponse');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json(
    successResponse('Anonymous Course Feedback API is running', {
      status: 'healthy'
    })
  );
});

module.exports = router;