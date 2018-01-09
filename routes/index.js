var express = require('express');
var router = express.Router();
const request = require('request')
const baseUrl = 'http://htpmsg.jiecaojingxuan.com/msg/current'
const questions = []

const json = { 
  'code': 0, 
  'msg': '成功', 
  'data': { 
    'event': { 
      'answerTime': 10,
      'desc': '10.世界上第一部全电脑制作的动画长片是？', 
      'displayOrder': 9,
      'liveId': 82,
      'options':
        '["玩具总动员","赛车总动员","飞机总动员"]',
        'questionId': 943,
        'showTime': 1515410193285,
        'status': 0, 'type': 'showQuestion' }, 
        'type': 'showQuestion' } }

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

function getQuestion() {
  return new Promise((resolve, reject) => {
    request(baseUrl, (err, res, body) => {
      if (err) {
        resolve(false)
      }
      const ret = JSON.parse(body)
      if (ret.msg === 'no data') {
        resolve(json)
      } else {
        resolve(ret)
      }
    })
  })
}

router.get('/query', async function (req, res, next) {
  const questionReq = await getQuestion()

  // 没有结果
  if (!questionReq) {
    return res.json({
      code: 1
    })
  }

  const event = questionReq.data.event || {}
  const { desc, options } = event

  // 结果已经显示
  if (questions.indexOf(desc) >= 0) {
    return res.json({
      code: 1
    })
  }
  questions.push(desc)
  return res.json({
    code: 0,
    desc: desc.slice(desc.indexOf('.') + 1),
    options
  })
})

module.exports = router;
