import express from 'express';

const router = express.Router();

router.get('/privacy', async (_req, res, next) => {
  try {
    res.redirect(
      'https://docs.google.com/document/d/1AwofbGUpWC0pmRcok1N99hja5_-lzzKOVWf0cmO1kb0/edit?tab=t.0'
    );
  } catch (e) {
    next(e);
  }
});

router.get('/tos', async (_req, res, next) => {
  try {
    res.redirect(
      'https://docs.google.com/document/d/15Wrr3iOljOvrwkffRhspLxlhACVkT4Yj4Egcdq8RGPw/edit?usp=sharing'
    );
  } catch (e) {
    next(e);
  }
});

export default router;
